-- Migration to update Message content field from VARCHAR to TEXT
-- This allows storing larger message content

ALTER TABLE messages 
ALTER COLUMN content TYPE TEXT;
