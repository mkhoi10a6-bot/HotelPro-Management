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
  -d '{"room_id":1,"staff_id":1,"scheduled_date":"2026-05-15","status":"pending","notes":"Dọn phòng sau khách"}' | head -c 100
echo ""
echo ""

# Create inventory record
echo "2. Creating inventory record..."
curl -s -X POST http://localhost:4000/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Khăn tắm","quantity":"20","category":"linens","reorder_level":"5","unit_price":"50000"}' | head -c 100
echo ""
echo ""

# Create maintenance record
echo "3. Creating maintenance record..."
curl -s -X POST http://localhost:4000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_id":2,"issue_description":"Máy lạnh không hoạt động","priority":"high","status":"new","assigned_to":1}' | head -c 100
echo ""
echo ""

# Create employee record
echo "4. Creating employee record..."
curl -s -X POST http://localhost:4000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"employee_id":"NV001","name":"Trần Thị B","position":"Nhân viên","department":"Tiếp tân","salary":"8000000","hire_date":"2026-01-15","status":"active"}' | head -c 100
echo ""
echo ""

echo "✅ Test data created!"
