-- Add type field to EmailVerificationToken for different token purposes
ALTER TABLE EmailVerificationToken ADD COLUMN type TEXT DEFAULT 'EMAIL_VERIFY';

-- Create index on type for faster queries
CREATE INDEX IF NOT EXISTS EmailVerificationToken_type_idx ON EmailVerificationToken(type);
