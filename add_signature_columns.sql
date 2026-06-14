-- Add signature columns to contract_requests table
ALTER TABLE contract_requests
  ADD COLUMN landlord_signature LONGTEXT NULL,
  ADD COLUMN tenant_signature LONGTEXT NULL,
  ADD COLUMN landlord_signed_at DATETIME NULL,
  ADD COLUMN tenant_signed_at DATETIME NULL,
  ADD COLUMN landlord_sign_metadata TEXT NULL,
  ADD COLUMN tenant_sign_metadata TEXT NULL;

-- Add signature columns to rented_rooms table
ALTER TABLE rented_rooms
  ADD COLUMN landlord_signature LONGTEXT NULL,
  ADD COLUMN tenant_signature LONGTEXT NULL,
  ADD COLUMN landlord_signed_at DATETIME NULL,
  ADD COLUMN tenant_signed_at DATETIME NULL,
  ADD COLUMN landlord_sign_metadata TEXT NULL,
  ADD COLUMN tenant_sign_metadata TEXT NULL;
