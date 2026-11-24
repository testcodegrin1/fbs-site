-- =============================================================================
-- Migration: Update Product Template Dimensions from Pixels (PX) to Inches (IN)
-- Standard: 96 DPI / PPI (1 in = 96 px)
-- =============================================================================

-- 1. Modify width_px and height_px to DECIMAL(10, 2) to store exact inches with decimal precision
ALTER TABLE product_templates 
  MODIFY COLUMN width_px DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
  MODIFY COLUMN height_px DECIMAL(10, 2) NOT NULL DEFAULT 11.25;

-- 2. Convert existing templates from pixels to inches using standard 96 DPI:
--    1920 px -> 20.00 in
--    1080 px -> 11.25 in
UPDATE product_templates 
SET width_px = ROUND(width_px / 96, 2), 
    height_px = ROUND(height_px / 96, 2) 
WHERE width_px >= 100;

-- 3. Verify standard default sizes
UPDATE product_templates
SET width_px = 20.00, height_px = 11.25
WHERE width_px = 20.00 AND height_px = 11.25 AND orientation = 'landscape';

-- 4. Add available_sizes column to store multiple custom dimensions per product
ALTER TABLE product_templates 
  ADD COLUMN available_sizes JSON NULL AFTER height_px;
