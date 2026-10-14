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

let migrationAttempted = false;

export async function ensureCanvasCollageSchema(): Promise<void> {
  if (migrationAttempted) return;
  migrationAttempted = true;

  try {
    const db = getAuthDatabase();
    try {
      await db.query(
        `ALTER TABLE diagram_images ADD COLUMN status ENUM('pending_review', 'approved', 'changes_requested') NOT NULL DEFAULT 'pending_review'`,
      );
    } catch {
      // Column exists
    }
    try {
      await db.query(
        `ALTER TABLE canvas_remarks ADD COLUMN image_id BIGINT UNSIGNED NULL AFTER version_id`,
      );
    } catch {
      // Column exists
    }

    // Indexes for hosted MySQL (high RTT - keep queries index-friendly)
    const indexQueries = [
      `CREATE INDEX idx_canvases_project ON canvases(project_id)`,
      `CREATE INDEX idx_versions_canvas ON canvas_versions(canvas_id)`,
      `CREATE INDEX idx_versions_canvas_ver ON canvas_versions(canvas_id, version_number)`,
      `CREATE INDEX idx_remarks_canvas ON canvas_remarks(canvas_id)`,
      `CREATE INDEX idx_diagram_images_cv ON diagram_images(canvas_id, version_id)`,
      `CREATE INDEX idx_history_canvas ON canvas_status_history(canvas_id)`,
      `CREATE INDEX idx_projects_designer ON projects(designer_id)`,
      `CREATE INDEX idx_projects_client ON projects(client_id)`,
      `CREATE INDEX idx_project_shares_project ON project_shares(project_id)`,
    ];

    for (const idxSql of indexQueries) {
      try {
        await db.query(idxSql);
      } catch {
        // Index already exists
      }
    }
  } catch (err) {
    console.error("[db] Collage schema check error:", err);
  }
}

let franchiseSchemaPromise: Promise<void> | null = null;

export function ensureFranchiseSchema(): Promise<void> {
  if (!franchiseSchemaPromise) {
    franchiseSchemaPromise = createFranchiseSchema().catch((error) => {
      franchiseSchemaPromise = null;
      throw error;
    });
  }

  return franchiseSchemaPromise;
}

async function createFranchiseSchema(): Promise<void> {
  const db = getAuthDatabase();

  await db.query(`
    CREATE TABLE IF NOT EXISTS franchises (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      branding_logo_url TEXT NULL,
      description TEXT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS vendor_profiles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      franchise_id BIGINT UNSIGNED NOT NULL,
      company_name VARCHAR(255) NULL,
      phone VARCHAR(50) NOT NULL,
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      address TEXT NULL,
      status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
      rejection_reason TEXT NULL,
      approved_by BIGINT UNSIGNED NULL,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_vendor_franchise (user_id, franchise_id),
      KEY idx_vendor_status (franchise_id, status),
      CONSTRAINT fk_vendor_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_vendor_franchise FOREIGN KEY (franchise_id)
        REFERENCES franchises(id) ON DELETE RESTRICT,
      CONSTRAINT fk_vendor_approved_by FOREIGN KEY (approved_by)
        REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS banner_templates (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      franchise_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT NULL,
      width_px INT UNSIGNED NOT NULL,
      height_px INT UNSIGNED NOT NULL,
      orientation ENUM('landscape','portrait','square') NOT NULL DEFAULT 'landscape',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_template_franchise (franchise_id, is_active),
      CONSTRAINT fk_template_franchise FOREIGN KEY (franchise_id)
        REFERENCES franchises(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS banner_template_images (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      template_id BIGINT UNSIGNED NOT NULL,
      image_url TEXT NOT NULL,
      image_name VARCHAR(255) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_template_images_template_id (template_id),
      CONSTRAINT fk_template_images FOREIGN KEY (template_id)
        REFERENCES banner_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS banner_template_fields (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      template_id BIGINT UNSIGNED NOT NULL,
      label VARCHAR(255) NOT NULL,
      field_type VARCHAR(50) NOT NULL DEFAULT 'text',
      placeholder VARCHAR(255) NULL,
      options JSON NULL,
      is_required TINYINT(1) NOT NULL DEFAULT 0,
      is_editable TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_template_fields_template_id (template_id),
      KEY idx_template_fields_sort (template_id, sort_order),
      CONSTRAINT fk_banner_template_fields_template FOREIGN KEY (template_id)
        REFERENCES banner_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS banner_customizations (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      template_id BIGINT UNSIGNED NOT NULL,
      user_id BIGINT UNSIGNED NOT NULL,
      franchise_id BIGINT UNSIGNED NULL,
      customization_values JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_banner_customizations_user (user_id),
      KEY idx_banner_customizations_template (template_id),
      KEY idx_banner_customizations_franchise (franchise_id),
      CONSTRAINT fk_banner_cust_template FOREIGN KEY (template_id)
        REFERENCES banner_templates (id) ON DELETE CASCADE,
      CONSTRAINT fk_banner_cust_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS vendor_banner_orders (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_number VARCHAR(100) NOT NULL UNIQUE,
      vendor_id BIGINT UNSIGNED NOT NULL,
      franchise_id BIGINT UNSIGNED NOT NULL,
      template_id BIGINT UNSIGNED NOT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      customization_data JSON NOT NULL,
      pdf_file_path VARCHAR(1024) NULL,
      status ENUM(
        'request_submitted',
        'under_review',
        'approved_for_production',
        'in_progress',
        'ready_completed',
        'delivered'
      ) NOT NULL DEFAULT 'request_submitted',
      admin_notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_orders_vendor (vendor_id, created_at),
      KEY idx_orders_franchise (franchise_id),
      KEY idx_orders_status (status),
      CONSTRAINT fk_order_vendor FOREIGN KEY (vendor_id)
        REFERENCES vendor_profiles(id) ON DELETE RESTRICT,
      CONSTRAINT fk_order_franchise FOREIGN KEY (franchise_id)
        REFERENCES franchises(id) ON DELETE RESTRICT,
      CONSTRAINT fk_order_template FOREIGN KEY (template_id)
        REFERENCES banner_templates(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS vendor_order_status_history (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      old_status VARCHAR(50) NULL,
      new_status VARCHAR(50) NOT NULL,
      changed_by_user_id BIGINT UNSIGNED NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      KEY idx_order_history (order_id, created_at),
      CONSTRAINT fk_history_order FOREIGN KEY (order_id)
        REFERENCES vendor_banner_orders(id) ON DELETE RESTRICT,
      CONSTRAINT fk_history_user FOREIGN KEY (changed_by_user_id)
        REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("[db] Franchise schema initialized successfully.");
}

export async function initializeAuthDatabase(): Promise<void> {
  await ensureCanvasCollageSchema();
  await ensureFranchiseSchema();
}
