-- Add replyToId column
ALTER TABLE "messages" ADD COLUMN "replyToId" UUID REFERENCES "messages"("id") ON DELETE SET NULL;

-- Add reactions column (JSONB for flexibility: [{emoji, count, userIds}])
ALTER TABLE "messages" ADD COLUMN "reactions" JSONB DEFAULT '[]'::jsonb;
