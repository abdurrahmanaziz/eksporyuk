-- Update EmailVerificationToken structure for change email feature
-- Drop the old table and create new one with updated schema

-- Backup data if any exists (optional, usually tokens are temporary)
CREATE TABLE IF NOT EXISTS EmailVerificationToken_backup AS SELECT * FROM EmailVerificationToken;

-- Drop old table
DROP TABLE IF EXISTS EmailVerificationToken;

-- Create new table with updated schema
CREATE TABLE EmailVerificationToken (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires DATETIME NOT NULL,
    type TEXT DEFAULT 'EMAIL_VERIFY',
    metadata TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS EmailVerificationToken_identifier_idx ON EmailVerificationToken(identifier);
CREATE INDEX IF NOT EXISTS EmailVerificationToken_token_idx ON EmailVerificationToken(token);
CREATE INDEX IF NOT EXISTS EmailVerificationToken_expires_idx ON EmailVerificationToken(expires);
CREATE INDEX IF NOT EXISTS EmailVerificationToken_type_idx ON EmailVerificationToken(type);
