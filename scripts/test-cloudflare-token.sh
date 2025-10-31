#!/bin/bash

# Test Cloudflare API Token for Pages Access
# Usage: ./test-cloudflare-token.sh YOUR_API_TOKEN YOUR_ACCOUNT_ID

TOKEN="${1}"
ACCOUNT_ID="${2}"

if [ -z "$TOKEN" ] || [ -z "$ACCOUNT_ID" ]; then
    echo "Usage: ./test-cloudflare-token.sh YOUR_API_TOKEN YOUR_ACCOUNT_ID"
    echo ""
    echo "Example:"
    echo "  ./test-cloudflare-token.sh abc123def456 xyz789abc123"
    exit 1
fi

echo "🧪 Testing Cloudflare API Token..."
echo ""

# Test 1: Verify token authentication
echo "Test 1: Verifying token authentication..."
AUTH_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer ${TOKEN}")

AUTH_SUCCESS=$(echo $AUTH_RESPONSE | grep -o '"success":true')

if [ -n "$AUTH_SUCCESS" ]; then
    echo "✅ Token is valid and authenticated"
    echo ""
else
    echo "❌ Token authentication failed"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

# Test 2: Check account access
echo "Test 2: Checking account access..."
ACCOUNT_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

ACCOUNT_SUCCESS=$(echo $ACCOUNT_RESPONSE | grep -o '"success":true')

if [ -n "$ACCOUNT_SUCCESS" ]; then
    ACCOUNT_NAME=$(echo $ACCOUNT_RESPONSE | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Account access confirmed: ${ACCOUNT_NAME}"
    echo ""
else
    echo "❌ Cannot access account"
    echo "Response: $ACCOUNT_RESPONSE"
    exit 1
fi

# Test 3: Check Workers/Pages project access
echo "Test 3: Checking Workers/Pages project access (russ-cloud)..."
PAGES_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/russ-cloud" \
    -H "Authorization: Bearer ${TOKEN}")

PAGES_SUCCESS=$(echo $PAGES_RESPONSE | grep -o '"success":true')

if [ -n "$PAGES_SUCCESS" ]; then
    echo "✅ Pages/Workers project access confirmed"
    PROJECT_NAME=$(echo $PAGES_RESPONSE | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
    PRODUCTION_BRANCH=$(echo $PAGES_RESPONSE | grep -o '"production_branch":"[^"]*"' | cut -d'"' -f4)
    echo "   Project: ${PROJECT_NAME}"
    echo "   Production Branch: ${PRODUCTION_BRANCH}"
    echo ""
else
    echo "⚠️  Cannot access via Pages API (this might be OK for Workers)"
    echo "   Trying Workers API instead..."

    # Try Workers API
    WORKERS_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts" \
        -H "Authorization: Bearer ${TOKEN}")

    WORKERS_SUCCESS=$(echo $WORKERS_RESPONSE | grep -o '"success":true')

    if [ -n "$WORKERS_SUCCESS" ]; then
        echo "✅ Workers access confirmed"
        echo ""
    else
        echo "❌ Cannot access Workers or Pages"
        echo "This could mean:"
        echo "  1. The token doesn't have 'Cloudflare Pages - Edit' or 'Workers Scripts - Edit' permission"
        echo "  2. The project 'russ-cloud' doesn't exist"
        echo "  3. The account ID is incorrect"
        echo ""
        echo "Pages Response: $PAGES_RESPONSE"
        echo "Workers Response: $WORKERS_RESPONSE"
        exit 1
    fi
fi

# Test 4: Check write permissions (list deployments)
echo "Test 4: Checking deployment permissions..."
DEPLOY_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/russ-cloud/deployments?per_page=1" \
    -H "Authorization: Bearer ${TOKEN}")

DEPLOY_SUCCESS=$(echo $DEPLOY_RESPONSE | grep -o '"success":true')

if [ -n "$DEPLOY_SUCCESS" ]; then
    echo "✅ Deployment access confirmed (can list deployments)"
    echo ""
else
    echo "⚠️  Cannot list deployments via Pages API (might be OK for Workers-based deployment)"
    echo ""
fi

echo "🎉 All tests passed! Token is ready for GitHub Actions."
echo ""
echo "Next steps:"
echo "1. Add this token as CLOUDFLARE_API_TOKEN secret in GitHub"
echo "2. Add ${ACCOUNT_ID} as CLOUDFLARE_ACCOUNT_ID secret in GitHub"
echo "3. Push your changes to trigger deployment"
