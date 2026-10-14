import mysql, {
  type FieldPacket,
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

export type SqlValue = string | number | boolean | Date | null;

let pool: Pool | null = null;
let connectionLogged = false;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for MySQL auth configuration.`);
  }

  return value;
}

export function getAuthDatabase(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: requireEnv("AUTH_DB_HOST"),
      port: Number(process.env.AUTH_DB_PORT ?? "3306"),
      user: requireEnv("AUTH_DB_USER"),
      password: requireEnv("AUTH_DB_PASSWORD"),
      database: requireEnv("AUTH_DB_NAME"),
      waitForConnections: true,
      // Higher pool for parallel queries over high-latency remote MySQL
      connectionLimit: Number(process.env.AUTH_DB_CONNECTION_LIMIT ?? "20"),
      maxIdle: 10,
      idleTimeout: 60_000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Fail fast instead of hanging ~minutes on dead remote links
      connectTimeout: Number(process.env.AUTH_DB_CONNECT_TIMEOUT_MS ?? "8000"),
      namedPlaceholders: false,
      multipleStatements: false,
      // Slightly prefer server-side prepared statements reuse
      dateStrings: false,
    });
  }

  if (!connectionLogged) {
    connectionLogged = true;
    void pool
      .getConnection()
      .then(async (connection) => {
        console.log(
          `[auth-db] Connected to MySQL database "${requireEnv("AUTH_DB_NAME")}" at ${requireEnv("AUTH_DB_HOST")}:${process.env.AUTH_DB_PORT ?? "3306"}`,
        );
        // Warm one more connection so the first parallel request isn't cold
        try {
          await connection.query("SELECT 1");
        } catch {
          // ignore warm-up failure
        }
        connection.release();
      })
      .catch((error: unknown) => {
        connectionLogged = false;
        console.error("[auth-db] Failed to connect to MySQL database.", error);
      });
  }

  return pool;
}

export async function query<T extends RowDataPacket[] | ResultSetHeader>(
  sql: string,
  params: SqlValue[] = [],
): Promise<[T, FieldPacket[]]> {
  return getAuthDatabase().query<T>(sql, params);
}

export async function execute<T extends ResultSetHeader>(
  sql: string,
  params: SqlValue[] = [],
): Promise<[T, FieldPacket[]]> {
  return getAuthDatabase().execute<T>(sql, params);
}

export async function withTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await getAuthDatabase().getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function ensureCanvasCollageSchema(): Promise<void> {
  // Schema changes are managed through SQL migration files, not at runtime.
}

export function ensureFranchiseSchema(): Promise<void> {
  // Schema changes are managed through SQL migration files, not at runtime.
  return Promise.resolve();
}

export async function initializeAuthDatabase(): Promise<void> {
  getAuthDatabase();
}
