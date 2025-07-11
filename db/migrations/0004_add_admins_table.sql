CREATE TABLE IF NOT EXISTS "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);

-- Insert the first admin
INSERT INTO "admins" ("id", "email") VALUES ('admin-1', 'andrew@textile.io') ON CONFLICT (email) DO NOTHING;