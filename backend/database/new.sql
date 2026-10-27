-- =============================================================================
-- Product Submission Thread Schema & Migration: Banner -> Product
-- Feature: Product Templates, Customizations & Submissions (User & Admin Flow)
-- Description:
--   1. product_submission_files: Stores uploaded photos, tile version history, and replacements
--   2. product_submission_messages: Stores overall chat comments and per-photo tile replies
--   3. Migration script: Safely renames banner_* tables, foreign keys, and permissions
-- =============================================================================

-- =============================================================================
-- SECTION 1: MIGRATION SCRIPT (RENAME BANNER TO PRODUCT)
-- Run these queries directly in your MySQL database to rename existing tables
-- and permissions safely without losing any data.
-- =============================================================================

-- Step 1.1: Rename all tables from banner_* to product_*
RENAME TABLE banner_templates TO product_templates;
RENAME TABLE banner_template_images TO product_template_images;
RENAME TABLE banner_template_fields TO product_template_fields;
RENAME TABLE banner_customizations TO product_customizations;
RENAME TABLE banner_submission_files TO product_submission_files;
RENAME TABLE banner_submission_messages TO product_submission_messages;

-- Step 1.2: Rename indexes on product_submission_files (optional, for clarity)
ALTER TABLE product_submission_files RENAME INDEX idx_bsf_submission TO idx_psf_submission;
ALTER TABLE product_submission_files RENAME INDEX idx_bsf_replaced TO idx_psf_replaced;
ALTER TABLE product_submission_files RENAME INDEX idx_bsf_uploaded_by TO idx_psf_uploaded_by;

-- Step 1.3: Rename indexes on product_submission_messages (optional, for clarity)
ALTER TABLE product_submission_messages RENAME INDEX idx_bsm_submission TO idx_psm_submission;
ALTER TABLE product_submission_messages RENAME INDEX idx_bsm_image TO idx_psm_image;
ALTER TABLE product_submission_messages RENAME INDEX idx_bsm_sender TO idx_psm_sender;

-- Step 1.4: Update permissions from banner_templates:manage to product_templates:manage
UPDATE permissions 
SET slug = 'product_templates:manage',
    description = 'Manage product templates and dynamic customization fields'
WHERE slug = 'banner_templates:manage';

-- Insert product_templates:manage if not already exists
INSERT IGNORE INTO permissions (slug, description)
VALUES ('product_templates:manage', 'Manage product templates and dynamic customization fields');

-- Assign permission to super_admin role
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.slug = 'super_admin' AND p.slug = 'product_templates:manage';

-- =============================================================================
-- SECTION 2: TABLE DEFINITIONS (FOR FRESH INSTALLATIONS)
-- =============================================================================

-- 1. Product Submission Files
CREATE TABLE IF NOT EXISTS product_submission_files (
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
  KEY idx_psf_submission (submission_id),
  KEY idx_psf_replaced (replaced_file_id),
  KEY idx_psf_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Product Submission Messages
CREATE TABLE IF NOT EXISTS product_submission_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  image_id BIGINT UNSIGNED NULL,
  sender_user_id BIGINT UNSIGNED NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_psm_submission (submission_id),
  KEY idx_psm_image (image_id),
  KEY idx_psm_sender (sender_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Quantity column on product_customizations (Number of products requested by user)
ALTER TABLE product_customizations ADD COLUMN quantity INT NOT NULL DEFAULT 1;

-- =============================================================================
-- SECTION 3: MIGRATION: COMPLETELY REMOVE FRANCHISE FUNCTIONALITY (IF APPLICABLE)
-- =============================================================================
-- ALTER TABLE users DROP COLUMN IF EXISTS franchise_id;
-- ALTER TABLE product_templates DROP COLUMN IF EXISTS franchise_id;
-- ALTER TABLE product_customizations DROP COLUMN IF EXISTS franchise_id;
-- DROP TABLE IF EXISTS franchises;
