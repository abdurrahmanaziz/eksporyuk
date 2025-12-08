-- Add withdrawalPin fields to User table
ALTER TABLE User ADD COLUMN withdrawalPin TEXT;
ALTER TABLE User ADD COLUMN withdrawalPinSetAt DATETIME;

-- Add withdrawal settings to Settings table
ALTER TABLE Settings ADD COLUMN withdrawalMinAmount DECIMAL DEFAULT 50000;
ALTER TABLE Settings ADD COLUMN withdrawalAdminFee DECIMAL DEFAULT 5000;
ALTER TABLE Settings ADD COLUMN withdrawalPinRequired BOOLEAN DEFAULT 1;
ALTER TABLE Settings ADD COLUMN withdrawalPinLength INTEGER DEFAULT 6;
