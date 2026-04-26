CREATE DATABASE MotelManagement;
GO

USE MotelManagement;
GO

-- =============================================
-- NHÓM 1: XÁC THỰC VÀ HỒ SƠ NGƯỜI DÙNG
-- =============================================

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    role VARCHAR(50) NOT NULL, -- ADMIN, LANDLORD, TENANT
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Landlords (
    landlord_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    brand_name NVARCHAR(255),
    bank_account_number VARCHAR(50),
    bank_name NVARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Tenants (
    tenant_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    fullname NVARCHAR(255) NOT NULL,
    identity_card VARCHAR(50) NOT NULL,
    dob DATE,
    address NVARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- =============================================
-- NHÓM 2: QUẢN LÝ CƠ SỞ VẬT CHẤT
-- =============================================

CREATE TABLE Houses (
    house_id INT IDENTITY(1,1) PRIMARY KEY,
    landlord_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    floor_count INT,
    address_line NVARCHAR(500),
    ward NVARCHAR(100),
    district NVARCHAR(100),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (landlord_id) REFERENCES Landlords(landlord_id) ON DELETE CASCADE
);

CREATE TABLE House_Images (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    house_id INT NOT NULL,
    image_url LONGTEXT NOT NULL,
    is_thumbnail BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (house_id) REFERENCES Houses(house_id) ON DELETE CASCADE
);

CREATE TABLE Rooms (
    room_id INT IDENTITY(1,1) PRIMARY KEY,
    house_id INT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(18,0) NOT NULL,
    capacity INT DEFAULT 1,
    is_available BIT DEFAULT 1,
    description NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (house_id) REFERENCES Houses(house_id) ON DELETE CASCADE
);

CREATE TABLE Room_Images (
    image_id INT IDENTITY(1,1) PRIMARY KEY,
    room_id INT NOT NULL,
    image_url LONGTEXT NOT NULL,
    is_thumbnail BIT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE CASCADE
);

CREATE TABLE Assets (
    asset_id INT IDENTITY(1,1) PRIMARY KEY,
    room_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    image_url LONGTEXT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE CASCADE
);

-- =============================================
-- NHÓM 3: SÀN GIAO DỊCH VÀ ĐẶT PHÒNG
-- =============================================

CREATE TABLE Listings (
    listing_id INT IDENTITY(1,1) PRIMARY KEY,
    room_id INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    views_count INT DEFAULT 0,
    is_published BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE CASCADE
);

CREATE TABLE Wishlists (
    wishlist_id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL,
    listing_id INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tenant_id) REFERENCES Tenants(tenant_id),
    FOREIGN KEY (listing_id) REFERENCES Listings(listing_id) ON DELETE CASCADE
);

CREATE TABLE Rent_Requests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL,
    room_id INT NOT NULL,
    expected_start_date DATE,
    deposit_amount DECIMAL(18,0),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tenant_id) REFERENCES Tenants(tenant_id),
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    review_id INT IDENTITY(1,1) PRIMARY KEY,
    tenant_id INT NOT NULL,
    room_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (tenant_id) REFERENCES Tenants(tenant_id),
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id) ON DELETE CASCADE
);

-- =============================================
-- NHÓM 4: HỢP ĐỒNG, DỊCH VỤ VÀ THANH TOÁN
-- =============================================

CREATE TABLE Rented_Rooms (
    rr_id INT IDENTITY(1,1) PRIMARY KEY,
    room_id INT NOT NULL,
    tenant_id INT NOT NULL,
    number_of_tenants INT DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    monthly_rent DECIMAL(18,0) NOT NULL,
    deposit DECIMAL(18,0) DEFAULT 0,
    contract_url VARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (room_id) REFERENCES Rooms(room_id),
    FOREIGN KEY (tenant_id) REFERENCES Tenants(tenant_id)
);

CREATE TABLE Contract_Services (
    cs_id INT IDENTITY(1,1) PRIMARY KEY,
    rr_id INT NOT NULL,
    service_name NVARCHAR(100) NOT NULL,
    unit_price DECIMAL(18,0) NOT NULL,
    initial_number INT DEFAULT 0, -- Dành cho điện/nước
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (rr_id) REFERENCES Rented_Rooms(rr_id) ON DELETE CASCADE
);

CREATE TABLE Invoices (
    invoice_id INT IDENTITY(1,1) PRIMARY KEY,
    rr_id INT NOT NULL,
    total_amount DECIMAL(18,0) NOT NULL,
    is_paid BIT DEFAULT 0,
    payment_date DATETIME,
    due_date DATE NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (rr_id) REFERENCES Rented_Rooms(rr_id) ON DELETE CASCADE
);

CREATE TABLE Invoice_Items (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    invoice_id INT NOT NULL,
    description NVARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(18,0) NOT NULL,
    amount DECIMAL(18,0) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (invoice_id) REFERENCES Invoices(invoice_id) ON DELETE CASCADE
);
GO