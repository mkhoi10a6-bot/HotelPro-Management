#!/bin/bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Testing 5 new module APIs..."
echo "Token: $TOKEN"
echo ""

# Test housekeeping endpoint
echo "1. Housekeeping API:"
curl -s http://localhost:4000/api/housekeeping -H "Authorization: Bearer $TOKEN" | head -c 100
echo ""
echo ""

# Test inventory endpoint
echo "2. Inventory API:"
curl -s http://localhost:4000/api/inventory -H "Authorization: Bearer $TOKEN" | head -c 100
echo ""
echo ""

# Test maintenance endpoint
echo "3. Maintenance API:"
curl -s http://localhost:4000/api/maintenance -H "Authorization: Bearer $TOKEN" | head -c 100
echo ""
echo ""

# Test employees endpoint
echo "4. Employees API:"
curl -s http://localhost:4000/api/employees -H "Authorization: Bearer $TOKEN" | head -c 100
echo ""
