# HƯỚNG DẪN QUẢN LÝ NHÀ TRỌ VÀ PHÒNG TRỌ

## 📋 Mục lục
1. [API Endpoints](#api-endpoints)
2. [Cách sử dụng](#cách-sử-dụng)
3. [Ví dụ Request/Response](#ví-dụ)

---

## API Endpoints

### 🏠 HOUSE (Nhà Trọ)

#### 1. Lấy tất cả nhà trọ của landlord hiện tại
```
GET /api/houses/
```
**Headers:** 
- `X-User-Email: email@example.com` (Bắt buộc)

**Response (200):**
```json
[
  {
    "houseId": 1,
    "landlordId": 5,
    "name": "Nhà trọ A",
    "floorCount": 4,
    "addressLine": "123 Nguyễn Huệ",
    "ward": "Bến Nghé",
    "district": "Quận 1",
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00"
  }
]
```

#### 2. Lấy chi tiết một nhà trọ
```
GET /api/houses/{id}
```
**Headers:** 
- `X-User-Email: email@example.com`

**Response (200):** (Như trên)

#### 3. Tạo nhà trọ mới
```
POST /api/houses/
```
**Headers:** 
- `X-User-Email: email@example.com`
- `Content-Type: application/json`

**Body:**
```json
{
  "name": "Nhà trọ B",
  "floorCount": 5,
  "addressLine": "456 Lê Lợi",
  "ward": "Bến Thành",
  "district": "Quận 1"
}
```

**Response (201):** (Như GET single)

#### 4. Cập nhật nhà trọ
```
PUT /api/houses/{id}
```
**Headers:** 
- `X-User-Email: email@example.com`
- `Content-Type: application/json`

**Body:** (Giống POST)

**Response (200):** (Như GET single)

#### 5. Xóa nhà trọ
```
DELETE /api/houses/{id}
```
**Headers:** 
- `X-User-Email: email@example.com`

**Response (200):**
```json
{
  "success": true,
  "message": "Xóa nhà trọ thành công"
}
```

---

### 🚪 ROOM (Phòng Trọ)

#### 1. Lấy tất cả phòng của landlord
```
GET /api/rooms/
```
**Headers:** 
- `X-User-Email: email@example.com`

**Response (200):**
```json
[
  {
    "roomId": 10,
    "houseId": 1,
    "name": "Phòng 101",
    "price": 3500000,
    "capacity": 2,
    "isAvailable": true,
    "description": "Phòng sạch, thoáng mát",
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00",
    "images": []
  }
]
```

#### 2. Lấy phòng theo nhà trọ
```
GET /api/rooms/house/{houseId}
```
**Headers:** 
- `X-User-Email: email@example.com`

**Response (200):** (Danh sách phòng như trên)

#### 3. Lấy chi tiết một phòng
```
GET /api/rooms/{id}
```
**Headers:** 
- `X-User-Email: email@example.com`

**Response (200):** (Như danh sách)

#### 4. Tạo phòng mới
```
POST /api/rooms/
```
**Headers:** 
- `X-User-Email: email@example.com`
- `Content-Type: application/json`

**Body:**
```json
{
  "house_id": 1,
  "name": "Phòng 102",
  "price": 4000000,
  "capacity": 2,
  "is_available": true,
  "description": "Phòng mới, đầy đủ tiện nghi"
}
```

**Response (201):** (Như GET single)

#### 5. Cập nhật phòng
```
PUT /api/rooms/{id}
```
**Headers:** 
- `X-User-Email: email@example.com`
- `Content-Type: application/json`

**Body:** (Giống POST)

**Response (200):** (Như GET single)

#### 6. Xóa phòng
```
DELETE /api/rooms/{id}
```
**Headers:** 
- `X-User-Email: email@example.com`

**Response (200):**
```json
{
  "success": true,
  "message": "Xóa phòng thành công"
}
```

---

## Cách sử dụng

### Backend (Spring Boot)

**Các file đã tạo:**
1. `HouseController.java` - API endpoints cho nhà trọ
2. `HouseService.java` - Business logic cho nhà trọ
3. `HouseRepository.java` - Database access cho nhà trọ
4. `HouseRequest.java` - DTO cho request
5. `HouseResponse.java` - DTO cho response
6. `RoomRequest.java` - DTO cho request phòng
7. Cập nhật `RoomService.java` - Thêm CRUD operations
8. Cập nhật `RoomController.java` - Thêm endpoints
9. Cập nhật `RoomRepository.java` - Thêm query methods
10. Cập nhật `AuthService.java` - Thêm helper methods
11. Cập nhật `LandlordRepository.java` - Thêm query methods

### Frontend (React)

**Các service đã có:**
- `houseService.js` - Gọi API nhà trọ (CRUD)
- `roomService.js` - Gọi API phòng (CRUD)

**Component sử dụng:**
- `Pages/landlord/Houses.js` - Quản lý nhà trọ
- `Pages/landlord/Rooms.js` - Quản lý phòng

---

## Ví dụ

### 1. Tạo nhà trọ mới
```javascript
// Frontend
const houseData = {
  name: "Nhà trọ Nguyễn Huệ",
  floorCount: 4,
  addressLine: "123 Nguyễn Huệ",
  ward: "Bến Nghé",
  district: "Quận 1"
};

const response = await houseService.create(houseData);
// response = { houseId: 1, landlordId: 5, ... }
```

### 2. Tạo phòng trong nhà
```javascript
// Frontend
const roomData = {
  house_id: 1,
  name: "Phòng 101",
  price: 3500000,
  capacity: 2,
  is_available: true,
  description: "Phòng sạch, có gác"
};

const response = await roomService.create(roomData);
// response = { roomId: 10, houseId: 1, ... }
```

### 3. Lấy phòng của nhà
```javascript
// Frontend
const rooms = await roomService.getByHouse(1);
// rooms = [{ roomId: 10, ... }, { roomId: 11, ... }]
```

### 4. Cập nhật phòng
```javascript
// Frontend
const updatedData = {
  house_id: 1,
  name: "Phòng 101 - Cải Thiện",
  price: 3800000,
  capacity: 2,
  is_available: true,
  description: "Phòng tươi sáng, có nóc"
};

const response = await roomService.update(10, updatedData);
```

### 5. Xóa phòng
```javascript
// Frontend
await roomService.delete(10);
```

---

## 🔐 Bảo mật

**Yêu cầu bắt buộc:**
- Tất cả request phải gửi header `X-User-Email`
- Backend sẽ kiểm tra quyền sở hữu (owner check)
- Chỉ landlord có thể tạo/sửa/xóa nhà và phòng của họ

**Lỗi phổ biến:**
- **400 Bad Request**: Header thiếu hoặc dữ liệu không hợp lệ
- **401 Unauthorized**: User không đăng nhập
- **403 Forbidden**: Không có quyền truy cập resource
- **404 Not Found**: Resource không tồn tại
- **500 Internal Server Error**: Lỗi server

---

## 📝 Ghi chú

1. **Response Format**: Tất cả response đều là JSON
2. **DateTime Format**: `yyyy-MM-ddTHH:mm:ss` (ISO 8601)
3. **Price**: Lưu dưới dạng BigDecimal, đơn vị VND
4. **Ownership**: Backend kiểm tra landlord_id tự động
5. **Cascade Delete**: Xóa nhà → xóa tất cả phòng của nhà đó

---

**Phiên bản API**: 1.0
**Ngày tạo**: 2025-01-15
**Status**: ✅ Hoàn thành
