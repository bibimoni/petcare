#!/bin/bash
# Test script for all new/modified endpoints
# Usage: BASE_URL=http://localhost:8080 bash scripts/test-endpoints.sh
# Skip specific tests: SKIP_TESTS="search=|/profit|store admin - own" bash scripts/test-endpoints.sh
# When DB_TYPE=sqlite, search and profit endpoints are incompatible (ILIKE/Postgres-specific SQL)

set -e

BASE_URL="${BASE_URL:-http://localhost:8080}"
API="$BASE_URL/v1"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass=0
fail=0
skipped=0

SKIP_PATTERNS=""
if [ -n "$SKIP_TESTS" ]; then
  SKIP_PATTERNS="$SKIP_TESTS"
fi

should_skip() {
  local desc="$1"
  if [ -z "$SKIP_PATTERNS" ]; then
    return 1
  fi
  local IFS='|'
  for pattern in $SKIP_PATTERNS; do
    if [[ "$desc" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

test_endpoint() {
  local method="$1"
  local url="$2"
  local token="$3"
  local description="$4"
  local expected_status="${5:-200}"
  local body="$6"

  if should_skip "$description"; then
    echo -e "${YELLOW}SKIP${NC} $method $description"
    skipped=$((skipped + 1))
    return
  fi

  local curl_args=(-s -w "\n%{http_code}" -X "$method" "$url" -H "Authorization: Bearer $token" -H "Content-Type: application/json")
  if [ -n "$body" ]; then
    curl_args+=(-d "$body")
  fi

  response=$(curl "${curl_args[@]}" 2>/dev/null)
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}PASS${NC} [$http_code] $method $description"
    pass=$((pass + 1))
  else
    echo -e "${RED}FAIL${NC} [$http_code] $method $description (expected $expected_status)"
    echo "  Response: $(echo "$body" | head -c 200)"
    fail=$((fail + 1))
  fi
}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}PetCare API Endpoint Tests${NC}"
echo -e "${YELLOW}========================================${NC}"
echo "Base URL: $BASE_URL"
echo ""

# ── Login ──
echo -e "\n${YELLOW}=== Authentication ===${NC}"

SUPERADMIN_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"superadmin@petcare.com","password":"Admin@123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -z "$SUPERADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to login as superadmin. Make sure the server is running and seed data exists.${NC}"
  echo "Run: npm run seed && npm run seed:customers && npx ts-node scripts/seed-analytics.ts"
  exit 1
fi

STOREADMIN_TOKEN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@pethaven.com","password":"Admin@123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

echo -e "${GREEN}Logged in as superadmin and store admin${NC}"

# ── Analytics Endpoints ──
echo -e "\n${YELLOW}=== Analytics Endpoints ===${NC}"

test_endpoint GET "$API/analytics/dashboard" "$STOREADMIN_TOKEN" "GET /analytics/dashboard"
test_endpoint GET "$API/analytics/pets/stats" "$STOREADMIN_TOKEN" "GET /analytics/pets/stats"
test_endpoint GET "$API/analytics/orders/stats" "$STOREADMIN_TOKEN" "GET /analytics/orders/stats"
test_endpoint GET "$API/analytics/orders/stats?date_from=2025-01-01&date_to=2026-12-31" "$STOREADMIN_TOKEN" "GET /analytics/orders/stats (with date range)"
test_endpoint GET "$API/analytics/profit" "$STOREADMIN_TOKEN" "GET /analytics/profit"
test_endpoint GET "$API/analytics/profit?granularity=month&date_from=2025-01-01" "$STOREADMIN_TOKEN" "GET /analytics/profit (monthly)"
test_endpoint GET "$API/analytics/inventory/alerts" "$STOREADMIN_TOKEN" "GET /analytics/inventory/alerts"
test_endpoint GET "$API/analytics/activities" "$STOREADMIN_TOKEN" "GET /analytics/activities"
test_endpoint GET "$API/analytics/activities?limit=5" "$STOREADMIN_TOKEN" "GET /analytics/activities?limit=5"

# Superadmin analytics (sees all stores)
test_endpoint GET "$API/analytics/dashboard" "$SUPERADMIN_TOKEN" "GET /analytics/dashboard (superadmin)"

# ── GET /pets ──
echo -e "\n${YELLOW}=== Pets Endpoints ===${NC}"

test_endpoint GET "$API/pets" "$STOREADMIN_TOKEN" "GET /pets (all)"
test_endpoint GET "$API/pets?search=Buddy" "$STOREADMIN_TOKEN" "GET /pets?search=Buddy"
test_endpoint GET "$API/pets?status=ALIVE" "$STOREADMIN_TOKEN" "GET /pets?status=ALIVE"
test_endpoint GET "$API/pets?status=DECEASED" "$STOREADMIN_TOKEN" "GET /pets?status=DECEASED"
test_endpoint GET "$API/pets" "$SUPERADMIN_TOKEN" "GET /pets (superadmin - all stores)"

# ── GET /products ──
echo -e "\n${YELLOW}=== Products Endpoints ===${NC}"

test_endpoint GET "$API/products" "$STOREADMIN_TOKEN" "GET /products (all)"
test_endpoint GET "$API/products?search=Shampoo" "$STOREADMIN_TOKEN" "GET /products?search=Shampoo"
test_endpoint GET "$API/products?status=ACTIVE" "$STOREADMIN_TOKEN" "GET /products?status=ACTIVE"
test_endpoint GET "$API/products?status=ARCHIVED" "$STOREADMIN_TOKEN" "GET /products?status=ARCHIVED"
test_endpoint GET "$API/products?low_stock=true" "$STOREADMIN_TOKEN" "GET /products?low_stock=true"
test_endpoint GET "$API/products" "$SUPERADMIN_TOKEN" "GET /products (superadmin - all stores)"

# ── GET /services ──
echo -e "\n${YELLOW}=== Services Endpoints ===${NC}"

test_endpoint GET "$API/services" "$STOREADMIN_TOKEN" "GET /services (all)"
test_endpoint GET "$API/services?search=Grooming" "$STOREADMIN_TOKEN" "GET /services?search=Grooming"
test_endpoint GET "$API/services?status=ACTIVE" "$STOREADMIN_TOKEN" "GET /services?status=ACTIVE"
test_endpoint GET "$API/services?status=ARCHIVED" "$STOREADMIN_TOKEN" "GET /services?status=ARCHIVED"
test_endpoint GET "$API/services" "$SUPERADMIN_TOKEN" "GET /services (superadmin - all stores)"

# ── GET /customers ──
echo -e "\n${YELLOW}=== Customers Endpoints ===${NC}"

test_endpoint GET "$API/customers" "$STOREADMIN_TOKEN" "GET /customers (all)"
test_endpoint GET "$API/customers?search=Alice" "$STOREADMIN_TOKEN" "GET /customers?search=Alice"
test_endpoint GET "$API/customers?date_from=2025-01-01" "$STOREADMIN_TOKEN" "GET /customers?date_from"
test_endpoint GET "$API/customers?date_from=2025-01-01&date_to=2026-12-31" "$STOREADMIN_TOKEN" "GET /customers (date range)"
test_endpoint GET "$API/customers" "$SUPERADMIN_TOKEN" "GET /customers (superadmin - all stores)"

# ── GET /orders ──
echo -e "\n${YELLOW}=== Orders Endpoints ===${NC}"

test_endpoint GET "$API/orders" "$STOREADMIN_TOKEN" "GET /orders (all)"
test_endpoint GET "$API/orders?status=PAID" "$STOREADMIN_TOKEN" "GET /orders?status=PAID"
test_endpoint GET "$API/orders?status=PENDING" "$STOREADMIN_TOKEN" "GET /orders?status=PENDING"
test_endpoint GET "$API/orders?status=CANCELLED" "$STOREADMIN_TOKEN" "GET /orders?status=CANCELLED"
test_endpoint GET "$API/orders?date_from=2025-01-01&date_to=2026-12-31" "$STOREADMIN_TOKEN" "GET /orders (date range)"
test_endpoint GET "$API/orders?min_amount=50" "$STOREADMIN_TOKEN" "GET /orders?min_amount=50"
test_endpoint GET "$API/orders?max_amount=100" "$STOREADMIN_TOKEN" "GET /orders?max_amount=100"
test_endpoint GET "$API/orders?item_type=PRODUCT" "$STOREADMIN_TOKEN" "GET /orders?item_type=PRODUCT"
test_endpoint GET "$API/orders?item_type=SERVICE" "$STOREADMIN_TOKEN" "GET /orders?item_type=SERVICE"
test_endpoint GET "$API/orders" "$SUPERADMIN_TOKEN" "GET /orders (superadmin - all stores)"

# ── GET /users ──
echo -e "\n${YELLOW}=== Users Endpoints ===${NC}"

test_endpoint GET "$API/users" "$SUPERADMIN_TOKEN" "GET /users (superadmin - all)"
test_endpoint GET "$API/users?search=Sarah" "$SUPERADMIN_TOKEN" "GET /users?search=Sarah"
test_endpoint GET "$API/users?status=ACTIVE" "$SUPERADMIN_TOKEN" "GET /users?status=ACTIVE"
test_endpoint GET "$API/users" "$STOREADMIN_TOKEN" "GET /users (store admin - own store + unaffiliated)"

# ── Summary ──
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "  ${GREEN}Passed: $pass${NC}"
echo -e "  ${RED}Failed: $fail${NC}"
echo -e "  ${YELLOW}Skipped: $skipped${NC}"
echo -e "  Total:  $((pass + fail + skipped))"

if [ $fail -gt 0 ]; then
  echo -e "\n${RED}Some tests failed!${NC}"
  exit 1
else
  echo -e "\n${GREEN}All tests passed!${NC} ($skipped skipped)"
  exit 0
fi
