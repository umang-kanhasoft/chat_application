DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_devices_platform') THEN
        CREATE TYPE "public"."enum_user_devices_platform" AS ENUM('web', 'android', 'ios');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "user_devices" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fcmToken" TEXT NOT NULL,
    "platform" "public"."enum_user_devices_platform" DEFAULT 'web' NOT NULL,
    "lastActive" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY ("id"),
    CONSTRAINT "user_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_devices_fcmToken_key" ON "user_devices" ("fcmToken");
CREATE INDEX IF NOT EXISTS "user_devices_userId_key" ON "user_devices" ("userId");
