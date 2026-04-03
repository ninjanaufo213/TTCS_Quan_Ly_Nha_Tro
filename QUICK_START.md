# 🚀 QUICK START GUIDE - QUẢN LÝ NHÀ TRỌ VÀ PHÒNG TRỌ

## 📦 Installation & Setup (5 phút)

### 1. Backend (Spring Boot)
```bash
cd D:\TTCS_Quan_Ly_Nha_Tro\backend\api

# Build
mvn clean install

# Run
mvn spring-boot:run
# Server sẽ chạy tại http://localhost:8080
```

### 2. Database
```bash
# Run CreateDb.sql script trên SQL Server
# Hoặc qua SQL Server Management Studio
# Database: MotelManagement sẽ được tạo tự động
```

### 3. Frontend (React)
```bash
cd D:\TTCS_Quan_Ly_Nha_Tro\frontend

# Install dependencies
npm install

# Start dev server
npm start
# Frontend sẽ mở tại http://localhost:3000
```

---

## 🎯 How to Use (Hướng dẫn sử dụng)

### Step 1: Login
1. Truy cập http://localhost:3000/login
2. Email: `landlord@example.com` (hoặc email đã register)
3. Password: `password123`
4. Click "Đăng nhập"

### Step 2: Go to Houses Management
1. Sau khi login, click menu "Quản lý nhà trọ"
2. Hoặc truy cập http://localhost:3000/app/houses

### Step 3: Create House
1. Click button "Thêm nhà trọ"
2. Điền form:
   ```
   Tên nhà:     "Nhà trọ A"
   Số tầng:     "5"
   Địa chỉ:     "123 Nguyễn Huệ"
   Phường:      "Bến Nghé"
   Quận:        "Quận 1"
   ```
3. Click "OK"
4. Xem nhà mới xuất hiện trong bảng

### Step 4: View Rooms (Phòng của nhà)
1. Click button "Xem phòng" trong bảng
2. Hoặc truy cập `/app/rooms?house=1`
3. Bạn sẽ thấy danh sách phòng của nhà này

### Step 5: Create Room
1. Click button "Thêm phòng"
2. Chọn nhà (nếu filter)
3. Điền form:
   ```
   Tên phòng:    "Phòng 101"
   Giá tiền:     "3500000"
   Sức chứa:     "2"
   Có sẵn:       "Có" (checked)
   Mô tả:        "Phòng sạch, thoáng mát"
   ```
4. Click "OK"
5. Phòng sẽ xuất hiện trong bảng

### Step 6: Edit Room
1. Click button "Sửa" trên phòng
2. Thay đổi giá hoặc thông tin khác
3. Click "OK"

### Step 7: Delete Room
1. Click button "Xóa"
2. Confirm "Có"
3. Phòng sẽ bị xóa

### Step 8: Delete House
1. Quay lại trang Houses
2. Click button "Xóa" trên nhà
3. Confirm "Có"
4. Nhà và tất cả phòng của nó sẽ bị xóa

---

## 📡 API Quick Reference

### House Endpoints
```bash
# Get all houses
GET /api/houses/
Header: X-User-Email: landlord@example.com

# Get single house
GET /api/houses/1
Header: X-User-Email: landlord@example.com

# Create house
POST /api/houses/
Content-Type: application/json
X-User-Email: landlord@example.com
Body: {
  "name": "Nhà A",
  "floorCount": 5,
  "addressLine": "123 Nguyễn Huệ",
  "ward": "Bến Nghé",
  "district": "Quận 1"
}

# Update house
PUT /api/houses/1
Content-Type: application/json
X-User-Email: landlord@example.com
Body: { ... }

# Delete house
DELETE /api/houses/1
X-User-Email: landlord@example.com
```

### Room Endpoints
```bash
# Get all rooms
GET /api/rooms/
Header: X-User-Email: landlord@example.com

# Get rooms by house
GET /api/rooms/house/1
Header: X-User-Email: landlord@example.com

# Get single room
GET /api/rooms/10
Header: X-User-Email: landlord@example.com

# Create room
POST /api/rooms/
Content-Type: application/json
X-User-Email: landlord@example.com
Body: {
  "house_id": 1,
  "name": "Phòng 101",
  "price": 3500000,
  "capacity": 2,
  "is_available": true,
  "description": "Phòng sạch"
}

# Update room
PUT /api/rooms/10
Content-Type: application/json
X-User-Email: landlord@example.com
Body: { ... }

# Delete room
DELETE /api/rooms/10
X-User-Email: landlord@example.com
```

---

## 🧪 Test with Postman

### 1. Create environment variable
```
{{API_BASE_URL}} = http://localhost:8080/api
{{USER_EMAIL}} = landlord@example.com
```

### 2. Test Request
```
Method: GET
URL: {{API_BASE_URL}}/houses/
Headers:
  - Key: X-User-Email
    Value: {{USER_EMAIL}}
```

### 3. Response (Success)
```json
[
  {
    "houseId": 1,
    "landlordId": 1,
    "name": "Nhà trọ A",
    "floorCount": 5,
    "addressLine": "123 Nguyễn Huệ",
    "ward": "Bến Nghé",
    "district": "Quận 1",
    "createdAt": "2025-01-15T10:30:00",
    "updatedAt": "2025-01-15T10:30:00"
  }
]
```

---

## 🔍 Troubleshooting

### Error: Cannot GET /api/houses/
**Solution:**
- Verify backend is running: `mvn spring-boot:run`
- Verify port 8080 is open
- Check firewall settings

### Error: "Header X-User-Email không tìm thấy"
**Solution:**
- Login first to save user_email
- Check localStorage: Open DevTools → Application → Storage → localStorage
- Verify `user_email` key exists

### Error: "Landlord không tìm thấy"
**Solution:**
- Email must be registered as LANDLORD
- Check database: `SELECT * FROM Landlords WHERE user_id = ...`
- Relogin if necessary

### Frontend shows 404
**Solution:**
- Check .env file has `REACT_APP_API_BASE_URL=http://localhost:8080/api`
- Restart frontend: `npm start`
- Clear browser cache

### Database connection error
**Solution:**
- Verify SQL Server running
- Check connection string in application.properties
- Verify username/password correct
- Restart backend server

---

## 📊 Database Quick Check

```sql
-- Check if tables created
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME IN ('Users', 'Landlords', 'Houses', 'Rooms');

-- Check test data
SELECT * FROM Users;
SELECT * FROM Landlords;
SELECT * FROM Houses;
SELECT * FROM Rooms;

-- Check cascade delete works
DELETE FROM Houses WHERE house_id = 1;
SELECT COUNT(*) FROM Rooms WHERE house_id = 1; -- Should be 0
```

---

## 🎨 Frontend File Structure

```
frontend/src/
├── pages/
│   └── landlord/
│       ├── Houses.js          ← Trang quản lý nhà
│       └── Rooms.js           ← Trang quản lý phòng
├── services/
│   ├── api.js                 ← Axios instance
│   ├── authService.js         ← Auth logic
│   ├── houseService.js        ← House API
│   └── roomService.js         ← Room API
└── components/
    └── Layout.js              ← Main layout
```

---

## ☕ Backend File Structure

```
backend/api/src/main/java/com/example/demo/
├── controller/
│   ├── HouseController.java   ← House endpoints
│   └── RoomController.java    ← Room endpoints
├── service/
│   ├── HouseService.java      ← House logic
│   ├── RoomService.java       ← Room logic
│   └── AuthService.java       ← Auth logic
├── repository/
│   ├── HouseRepository.java   ← House DB
│   ├── RoomRepository.java    ← Room DB
│   └── LandlordRepository.java ← Landlord DB
├── dto/
│   ├── HouseRequest.java      ← House input
│   ├── HouseResponse.java     ← House output
│   └── RoomRequest.java       ← Room input
└── model/
    ├── House.java             ← House entity
    ├── Room.java              ← Room entity
    └── User.java, Landlord.java, Tenant.java
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| API_DOCUMENTATION.md | Full API endpoints & examples |
| IMPLEMENTATION_GUIDE.md | Setup & deployment guide |
| TESTING_GUIDE.md | Complete testing checklist |
| SUMMARY.md | Complete project summary |
| QUICK_START.md | This file - quick reference |

---

## ✅ Checklist Before Production

- [ ] Database: CreateDb.sql executed successfully
- [ ] Backend: Server running on port 8080
- [ ] Backend: All endpoints tested with Postman
- [ ] Frontend: npm install completed
- [ ] Frontend: REACT_APP_API_BASE_URL configured
- [ ] Frontend: Login/logout working
- [ ] Frontend: Create house working
- [ ] Frontend: Create room working
- [ ] Frontend: Update/delete operations working
- [ ] Database: Cascade delete verified
- [ ] Security: Ownership checks verified
- [ ] Header: X-User-Email sending correctly

---

## 🆘 Need Help?

1. **API Issues**: See API_DOCUMENTATION.md
2. **Setup Issues**: See IMPLEMENTATION_GUIDE.md
3. **Test Issues**: See TESTING_GUIDE.md
4. **General**: See SUMMARY.md

---

## 🚀 Go Live Checklist

1. ✅ Code reviewed
2. ✅ All tests passed
3. ✅ Database migration done
4. ✅ Environment variables set
5. ✅ Backend built: `mvn clean install`
6. ✅ Frontend built: `npm run build`
7. ✅ Deployed to server
8. ✅ Smoke tests passed

---

**Last Updated**: 2025-01-15
**Version**: 1.0
**Status**: ✅ Ready to Use
