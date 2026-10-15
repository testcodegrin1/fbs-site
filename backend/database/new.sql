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
