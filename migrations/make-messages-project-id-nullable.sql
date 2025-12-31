-- Allow global chats by making messages.project_id nullable

ALTER TABLE messages
ALTER COLUMN project_id DROP NOT NULL;
