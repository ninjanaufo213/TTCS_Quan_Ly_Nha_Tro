-- MySQL sample data for quick testing
-- Assumes schema already created with the same table/column names as CreateDb.sql

USE `MotelManagement`;

-- Users
INSERT INTO `Users` (`role`, `email`, `phone`, `password`)
VALUES ('LANDLORD', 'landlord1@example.com', '0900000001', 'hashed_password_1');
SET @landlord_user_id = LAST_INSERT_ID();

INSERT INTO `Users` (`role`, `email`, `phone`, `password`)
VALUES ('TENANT', 'tenant1@example.com', '0900000002', 'hashed_password_2');
SET @tenant_user_id_1 = LAST_INSERT_ID();

INSERT INTO `Users` (`role`, `email`, `phone`, `password`)
VALUES ('TENANT', 'tenant2@example.com', '0900000003', 'hashed_password_3');
SET @tenant_user_id_2 = LAST_INSERT_ID();

-- Landlord
INSERT INTO `Landlords` (`user_id`, `brand_name`, `bank_account_number`, `bank_name`)
VALUES (@landlord_user_id, 'Motel Brand A', '123456789', 'Bank A');
SET @landlord_id = LAST_INSERT_ID();

-- Tenants
INSERT INTO `Tenants` (`user_id`, `fullname`, `identity_card`, `dob`, `address`)
VALUES (@tenant_user_id_1, 'Nguyen Van A', '012345678901', '1998-01-10', 'District 1');
SET @tenant_id_1 = LAST_INSERT_ID();

INSERT INTO `Tenants` (`user_id`, `fullname`, `identity_card`, `dob`, `address`)
VALUES (@tenant_user_id_2, 'Tran Thi B', '012345678902', '1999-02-20', 'District 3');
SET @tenant_id_2 = LAST_INSERT_ID();

-- House
INSERT INTO `Houses` (`landlord_id`, `name`, `floor_count`, `address_line`, `ward`, `district`)
VALUES (@landlord_id, 'House A', 3, '123 Street', 'Ward 1', 'District 1');
SET @house_id = LAST_INSERT_ID();

-- Rooms
INSERT INTO `Rooms` (`house_id`, `name`, `price`, `capacity`, `is_available`, `description`)
VALUES (@house_id, 'Room 101', 3000000, 2, 0, 'Room for 2 tenants');
SET @room_id_1 = LAST_INSERT_ID();

INSERT INTO `Rooms` (`house_id`, `name`, `price`, `capacity`, `is_available`, `description`)
VALUES (@house_id, 'Room 102', 3500000, 2, 0, 'Room for 2 tenants');
SET @room_id_2 = LAST_INSERT_ID();

-- Rented rooms (contracts)
INSERT INTO `Rented_Rooms` (`room_id`, `tenant_id`, `number_of_tenants`, `start_date`, `end_date`, `monthly_rent`, `deposit`, `contract_url`, `is_active`)
VALUES (@room_id_1, @tenant_id_1, 1, '2025-01-01', '2025-12-31', 3000000, 1000000, 'https://example.com/contract-1', 1);
SET @rr_id_1 = LAST_INSERT_ID();

INSERT INTO `Rented_Rooms` (`room_id`, `tenant_id`, `number_of_tenants`, `start_date`, `end_date`, `monthly_rent`, `deposit`, `contract_url`, `is_active`)
VALUES (@room_id_2, @tenant_id_2, 1, '2025-02-01', '2025-12-31', 3500000, 1000000, 'https://example.com/contract-2', 1);
SET @rr_id_2 = LAST_INSERT_ID();

-- Invoices
INSERT INTO `Invoices` (`rr_id`, `total_amount`, `is_paid`, `payment_date`, `due_date`)
VALUES (@rr_id_1, 3600000, 0, NULL, '2025-03-05');

INSERT INTO `Invoices` (`rr_id`, `total_amount`, `is_paid`, `payment_date`, `due_date`)
VALUES (@rr_id_2, 4100000, 1, '2025-03-01 10:00:00', '2025-03-05');

SET @invoice_id_1 = LAST_INSERT_ID();

-- House images
INSERT INTO `House_Images` (`house_id`, `image_url`, `is_thumbnail`)
VALUES (@house_id, 'https://example.com/house-a-1.jpg', 1);

INSERT INTO `House_Images` (`house_id`, `image_url`, `is_thumbnail`)
VALUES (@house_id, 'https://example.com/house-a-2.jpg', 0);

-- Room images
INSERT INTO `Room_Images` (`room_id`, `image_url`, `is_thumbnail`)
VALUES (@room_id_1, 'https://example.com/room-101-1.jpg', 1);

INSERT INTO `Room_Images` (`room_id`, `image_url`, `is_thumbnail`)
VALUES (@room_id_2, 'https://example.com/room-102-1.jpg', 1);

-- Assets
INSERT INTO `Assets` (`room_id`, `name`, `image_url`)
VALUES (@room_id_1, 'Air Conditioner', 'https://example.com/asset-ac.jpg');

INSERT INTO `Assets` (`room_id`, `name`, `image_url`)
VALUES (@room_id_2, 'Refrigerator', 'https://example.com/asset-fridge.jpg');

-- Listings
INSERT INTO `Listings` (`room_id`, `title`, `description`, `views_count`, `is_published`)
VALUES (@room_id_1, 'Room 101 for rent', 'Bright room with balcony', 12, 1);
SET @listing_id_1 = LAST_INSERT_ID();

INSERT INTO `Listings` (`room_id`, `title`, `description`, `views_count`, `is_published`)
VALUES (@room_id_2, 'Room 102 for rent', 'Quiet room, fully furnished', 7, 1);
SET @listing_id_2 = LAST_INSERT_ID();

-- Wishlists
INSERT INTO `Wishlists` (`tenant_id`, `listing_id`)
VALUES (@tenant_id_1, @listing_id_2);

INSERT INTO `Wishlists` (`tenant_id`, `listing_id`)
VALUES (@tenant_id_2, @listing_id_1);

-- Rent requests
INSERT INTO `Rent_Requests` (`tenant_id`, `room_id`, `expected_start_date`, `deposit_amount`, `status`)
VALUES (@tenant_id_1, @room_id_2, '2025-04-01', 1000000, 'PENDING');

-- Reviews
INSERT INTO `Reviews` (`tenant_id`, `room_id`, `rating`, `comment`)
VALUES (@tenant_id_2, @room_id_1, 5, 'Clean room and friendly landlord');

-- Contract services
INSERT INTO `Contract_Services` (`rr_id`, `service_name`, `unit_price`, `initial_number`)
VALUES (@rr_id_1, 'Water', 80000, 0);

INSERT INTO `Contract_Services` (`rr_id`, `service_name`, `unit_price`, `initial_number`)
VALUES (@rr_id_1, 'Internet', 100000, 0);

INSERT INTO `Contract_Services` (`rr_id`, `service_name`, `unit_price`, `initial_number`)
VALUES (@rr_id_2, 'Electricity', 3500, 120);

-- Invoice items
INSERT INTO `Invoice_Items` (`invoice_id`, `description`, `quantity`, `unit_price`, `amount`)
VALUES (@invoice_id_1, 'Room rent', 1, 3000000, 3000000);

INSERT INTO `Invoice_Items` (`invoice_id`, `description`, `quantity`, `unit_price`, `amount`)
VALUES (@invoice_id_1, 'Water', 1, 80000, 80000);

INSERT INTO `Invoice_Items` (`invoice_id`, `description`, `quantity`, `unit_price`, `amount`)
VALUES (@invoice_id_1, 'Internet', 1, 100000, 100000);

INSERT INTO `Invoice_Items` (`invoice_id`, `description`, `quantity`, `unit_price`, `amount`)
VALUES (@invoice_id_1, 'Electricity', 100, 3500, 350000);

