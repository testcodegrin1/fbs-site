-- =============================================================================
-- Banner Submission Thread Schema
-- Feature: Banner Submission Thread (User & Admin Flow)
-- Description:
--   1. banner_submission_files: Stores uploaded photos, tile version history, and replacements
--   2. banner_submission_messages: Stores overall chat comments and per-photo tile replies
-- =============================================================================

-- 1. Banner Submission Files
CREATE TABLE IF NOT EXISTS banner_submission_files (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  version INT NOT NULL DEFAULT 1,
  file_url VARCHAR(1000) NOT NULL,
  file_name VARCHAR(255) NULL,
  uploaded_by BIGINT UNSIGNED NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  replaced_file_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bsf_submission (submission_id),
  KEY idx_bsf_replaced (replaced_file_id),
  KEY idx_bsf_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Banner Submission Messages
CREATE TABLE IF NOT EXISTS banner_submission_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  image_id BIGINT UNSIGNED NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bsm_submission (submission_id),
  KEY idx_bsm_image (image_id),
  KEY idx_bsm_sender (sender_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Optional status / updated_at update on banner_customizations (if needed)
-- If status or updated_at are not present or need widening in banner_customizations:
-- ALTER TABLE banner_customizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'Pending';
-- ALTER TABLE banner_customizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 4. Quantity column on banner_customizations (Number of banners requested by user)
ALTER TABLE banner_customizations ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1;

-- =============================================================================
-- 5. MIGRATION: COMPLETELY REMOVE FRANCHISE FUNCTIONALITY
-- =============================================================================
-- Instructions: Run the following standard MySQL queries to remove franchise
-- foreign keys, columns, tables, and permissions from your database.

-- Step 5.1: Drop Foreign Key Constraints referencing franchises (already dropped)
ALTER TABLE users DROP FOREIGN KEY fk_users_franchise;
ALTER TABLE banner_templates DROP FOREIGN KEY fk_banner_templates_franchise;

-- Step 5.2: Drop franchise_id columns from tables
ALTER TABLE users DROP COLUMN franchise_id;
ALTER TABLE banner_templates DROP COLUMN franchise_id;
ALTER TABLE banner_customizations DROP COLUMN franchise_id;

-- Step 5.3: Drop the franchises table
DROP TABLE IF EXISTS franchises;

-- Step 5.4: Clean up franchise-related permissions and role assignments
DELETE rp FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE p.slug = 'franchises:manage';

DELETE FROM permissions WHERE slug = 'franchises:manage';
