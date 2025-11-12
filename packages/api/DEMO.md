# PufferPhish API Demo Script

Complete demonstration of all API endpoints with example requests and responses.

## Prerequisites

1. Start the local dev server:
```bash
cd /Users/billyward/Documents/pufferPhish/packages/api
npm run dev
```

2. Server should be running on `http://localhost:3001`

---

## 1. Analyze Endpoint

Analyzes URLs for phishing threats.

### Test with Whitelisted Domain (Safe)
```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://google.com"
  }'
```

**Expected Response:**
```json
{
  "id": "analysis-1234567890",
  "url": "https://google.com",
  "domain": "google.com",
  "riskScore": 0,
  "threats": {
    "phishing": 0,
    "malware": 0,
    "social": 0
  },
  "blocked": false,
  "source": "whitelist",
  "confidence": 1,
  "timestamp": "2025-01-12T03:26:45.246Z",
  "message": "Domain is on safe list"
}
```

### Test with Non-Whitelisted Domain
```bash
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://suspicious-site-example.com"
  }'
```

**Expected Response:**
- First time: Calls ML Lambda (returns fallback 0.5 risk score)
- Subsequent times (within 24h): Returns cached result

---

## 2. Stats Endpoint

Retrieves aggregated statistics.

### Get Statistics
```bash
curl -X GET http://localhost:3001/stats
```

**Expected Response:**
```json
{
  "totalScans": 2,
  "threatsBlocked": 0,
  "avgRiskScore": 0,
  "safeScans": 2,
  "recentAnalyses": [
    {
      "id": "1552d4b7-8033-4241-958f-18a48641a4b5",
      "url": "https://github.com",
      "domain": "github.com",
      "riskScore": 0,
      "threats": {
        "phishing": 0,
        "malware": 0,
        "social": 0
      },
      "blocked": false,
      "source": "whitelist",
      "timestamp": "2025-01-12T03:36:29.630Z"
    },
    {
      "id": "7a42a502-638a-49ad-9d85-8e88562b538e",
      "url": "https://google.com",
      "domain": "google.com",
      "riskScore": 0,
      "threats": {
        "phishing": 0,
        "malware": 0,
        "social": 0
      },
      "blocked": false,
      "source": "whitelist",
      "timestamp": "2025-01-12T03:26:45.598Z"
    }
  ]
}
```

---

## 3. Settings Endpoint

Manages user preferences.

### Get Current Settings
```bash
curl -X GET http://localhost:3001/settings
```

**Expected Response** (first time - creates defaults):
```json
{
  "autoBlock": true,
  "notifications": true,
  "whitelistedDomains": []
}
```

### Update Settings
```bash
curl -X PUT http://localhost:3001/settings \
  -H "Content-Type: application/json" \
  -d '{
    "autoBlock": false,
    "notifications": true,
    "whitelistedDomains": ["example.com", "test.com"]
  }'
```

**Expected Response:**
```json
{
  "autoBlock": false,
  "notifications": true,
  "whitelistedDomains": ["example.com", "test.com"],
  "message": "Settings updated successfully"
}
```

### Verify Updated Settings
```bash
curl -X GET http://localhost:3001/settings
```

---

## 4. Feedback Endpoint

Submits feedback on analysis accuracy.

### Step 1: Get an Analysis ID
First, analyze a URL to get an `analysisId`:
```bash
ANALYSIS_RESPONSE=$(curl -s -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}')

ANALYSIS_ID=$(echo $ANALYSIS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "Analysis ID: $ANALYSIS_ID"
```

### Step 2: Submit Feedback
```bash
curl -X POST http://localhost:3001/feedback \
  -H "Content-Type: application/json" \
  -d "{
    \"analysisId\": \"$ANALYSIS_ID\",
    \"correct\": true,
    \"comment\": \"This analysis was accurate!\"
  }"
```

**Expected Response:**
```json
{
  "id": "feedback-uuid",
  "analysisId": "analysis-uuid",
  "correct": true,
  "actualThreat": null,
  "comment": "This analysis was accurate!",
  "timestamp": "2025-01-12T04:00:00.000Z",
  "message": "Feedback submitted successfully"
}
```

### Test Error Cases

**Missing Analysis ID:**
```bash
curl -X POST http://localhost:3001/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "correct": true
  }'
```
Response: `400 Bad Request` with validation errors

**Non-existent Analysis:**
```bash
curl -X POST http://localhost:3001/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "00000000-0000-0000-0000-000000000000",
    "correct": true
  }'
```
Response: `404 Not Found` - Analysis not found

**Duplicate Feedback:**
```bash
# Try submitting feedback for the same analysis twice
curl -X POST http://localhost:3001/feedback \
  -H "Content-Type: application/json" \
  -d "{
    \"analysisId\": \"$ANALYSIS_ID\",
    \"correct\": false
  }"
```
Response: `409 Conflict` - Feedback already exists

---

## 5. Health Check

Simple endpoint to verify server is running.

```bash
curl -X GET http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "environment": "local"
}
```

---

## Complete Demo Sequence

Run all endpoints in order to demonstrate full functionality:

```bash
#!/bin/bash

echo "=== PufferPhish API Demo ==="
echo

# 1. Health check
echo "1. Health Check"
curl -s http://localhost:3001/health | jq
echo

# 2. Analyze safe URL
echo "2. Analyze Safe URL (google.com)"
curl -s -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}' | jq
echo

# 3. Analyze another safe URL
echo "3. Analyze Another Safe URL (github.com)"
GITHUB_RESPONSE=$(curl -s -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}')
echo $GITHUB_RESPONSE | jq
GITHUB_ANALYSIS_ID=$(echo $GITHUB_RESPONSE | jq -r '.id')
echo

# 4. Get stats
echo "4. Get Statistics"
curl -s http://localhost:3001/stats | jq
echo

# 5. Get settings
echo "5. Get Current Settings"
curl -s http://localhost:3001/settings | jq
echo

# 6. Update settings
echo "6. Update Settings"
curl -s -X PUT http://localhost:3001/settings \
  -H "Content-Type: application/json" \
  -d '{
    "autoBlock": false,
    "notifications": true,
    "whitelistedDomains": ["example.com", "test.com"]
  }' | jq
echo

# 7. Get updated settings
echo "7. Verify Updated Settings"
curl -s http://localhost:3001/settings | jq
echo

# 8. Submit feedback
echo "8. Submit Feedback"
curl -s -X POST http://localhost:3001/feedback \
  -H "Content-Type: application/json" \
  -d "{
    \"analysisId\": \"$GITHUB_ANALYSIS_ID\",
    \"correct\": true,
    \"comment\": \"Excellent detection!\"
  }" | jq
echo

echo "=== Demo Complete ==="
```

Save this as `demo.sh` and run:
```bash
chmod +x demo.sh
./demo.sh
```

---

## Database Verification

Check that data is being stored correctly:

### Query Analyses
```bash
# Using Supabase MCP or psql
SELECT id, url, domain, "riskScore", source, timestamp
FROM "Analysis"
ORDER BY timestamp DESC
LIMIT 10;
```

### Query Settings
```bash
SELECT * FROM "UserSettings" WHERE "userId" = 'demo-user';
```

### Query Feedback
```bash
SELECT f.*, a.url, a.domain
FROM "Feedback" f
JOIN "Analysis" a ON f."analysisId" = a.id
ORDER BY f.timestamp DESC;
```

---

## Demo Tips

1. **Reset Database:** If you want to start fresh, delete the demo user:
   ```sql
   DELETE FROM "User" WHERE id = 'demo-user';
   ```

2. **Monitor Logs:** Watch the server logs in real-time:
   ```bash
   # Server logs show all database queries and operations
   ```

3. **Test Error Handling:** Try invalid inputs:
   - Missing required fields
   - Invalid UUIDs
   - Malformed JSON
   - Non-existent resources

4. **Cache Testing:** Analyze the same URL twice within 24 hours to see caching in action

5. **Performance:** All endpoints should respond in <500ms for local dev

---

## What to Demo Tomorrow

Recommended flow for your demo presentation:

1. **Show the running server** - `npm run dev` output
2. **Analyze a URL** - Show instant whitelisted response
3. **Check stats** - Show aggregated data
4. **Update settings** - Demonstrate CRUD operations
5. **Submit feedback** - Complete the feedback loop
6. **Show database** - Verify persistence in Supabase

**Key Points to Highlight:**
- ✅ Full CRUD API implementation
- ✅ Database persistence (Supabase/PostgreSQL)
- ✅ 24-hour intelligent caching
- ✅ Input validation with Zod
- ✅ Comprehensive error handling
- ✅ ML Lambda integration (with fallback)
- ✅ Production-ready architecture

**What's Not Demo-Ready:**
- ⚠️ Authentication (skipped for MVP)
- ⚠️ ML Model (returns placeholder score)
- ⚠️ Frontend Dashboard
- ⚠️ Chrome Extension
