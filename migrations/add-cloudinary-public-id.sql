-- Add public_id column to attachments table for Cloudinary integration
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS public_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attachments_public_id ON attachments(public_id);
