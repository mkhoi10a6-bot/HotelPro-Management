#!/bin/bash
# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Creating test data for new modules..."
echo ""

# Create housekeeping record
echo "1. Creating housekeeping record..."
curl -s -X POST http://localhost:4000/api/housekeeping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_id":1,"status":"pending","staff_assigned":"Nguyễn Văn A","notes":"Dọn phòng sau khách"}' | head -c 80
echo ""
echo ""

# Create inventory record
echo "2. Creating inventory record..."
curl -s -X POST http://localhost:4000/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Khăn tắm","quantity":"20","unit":"cái","min_quantity":"5","location":"Kho tầng 2"}' | head -c 80
echo ""
echo ""

# Create maintenance record
echo "3. Creating maintenance record..."
curl -s -X POST http://localhost:4000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_id":2,"description":"Máy lạnh không hoạt động","priority":"high","status":"new","assigned_to":"Thợ sửa"}' | head -c 80
echo ""
echo ""

# Create employee record
echo "4. Creating employee record..."
curl -s -X POST http://localhost:4000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Trần Thị B","email":"b@example.com","phone":"0912345678","position":"Nhân viên","department":"Tiếp tân","salary":"8000000","hire_date":"2026-01-15"}' | head -c 80
echo ""
echo ""

echo "✅ Test data created!"
