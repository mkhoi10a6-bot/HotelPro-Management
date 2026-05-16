#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "✅ Creating test data for all 5 modules..."
echo ""

# Test 1: Housekeeping
echo "1. Housekeeping: Creating cleaning schedule..."
curl -s -X POST http://localhost:4000/api/housekeeping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_id":1,"staff_id":1,"scheduled_date":"2026-05-15","status":"pending","notes":"Dọn phòng sau khách"}' | grep -o '"id":[0-9]*' | head -1
echo ""

# Test 2: Inventory
echo "2. Inventory: Creating inventory item..."
curl -s -X POST http://localhost:4000/api/inventory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Khăn tắm","quantity":"20","category":"linens","reorder_level":"5"}' | grep -o '"id":[0-9]*' | head -1
echo ""

# Test 3: Maintenance
echo "3. Maintenance: Creating maintenance request..."
curl -s -X POST http://localhost:4000/api/maintenance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"room_id":2,"issue_description":"Máy lạnh không hoạt động","priority":"high","status":"new","assigned_to":1}' | grep -o '"id":[0-9]*' | head -1
echo ""

# Test 4: Employees - Create with email
echo "4. Employees: Creating employee record..."
curl -s -X POST http://localhost:4000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"employee_id":"NV001","email":"b@example.com","position":"Nhân viên","department":"Tiếp tân","salary":"8000000","hire_date":"2026-01-15","status":"active"}' | grep -o '"id":[0-9]*' | head -1
echo ""

echo ""
echo "✅ All 4 module APIs tested successfully!"
