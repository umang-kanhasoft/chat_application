-- Create user_tokens table for refresh token storage
-- Note: Column names use camelCase to match Sequelize model attributes.

CREATE TABLE IF NOT EXISTS user_tokens (
    id UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenType" TEXT NOT NULL,
    token TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT user_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT user_tokens_token_type_chk CHECK ("tokenType" IN ('ACCESS', 'REFRESH'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tokens_token_unique ON user_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_type ON user_tokens("userId", "tokenType");
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens("expiresAt");
