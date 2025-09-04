# API Reference

## Base URL

```
Development: http://localhost:3002
Production: https://api.pufferphish.com
```

## Authentication

All API requests require JWT authentication except public endpoints.

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Getting a Token
```javascript
// Using AWS Cognito
import { Auth } from 'aws-amplify';

const user = await Auth.signIn(email, password);
const token = user.signInUserSession.idToken.jwtToken;
```

## Endpoints

### Analysis

#### POST /analyze
Analyze a URL for phishing threats.

**Request:**
```json
{
  "url": "https://example.com",
  "metadata": {
    "referrer": "https://email.com",
    "userAction": "click" // click, hover, manual
  }
}
```

**Response:**
```json
{
  "analysisId": "uuid",
  "url": "https://example.com",
  "domain": "example.com",
  "riskScore": 0.85,
  "threats": {
    "phishing": 0.85,
    "malware": 0.10,
    "social": 0.45
  },
  "blocked": true,
  "source": "ml",
  "recommendation": "block",
  "explanation": "High phishing probability detected"
}
```

**Status Codes:**
- `200`: Analysis complete
- `400`: Invalid URL
- `401`: Unauthorized
- `429`: Rate limit exceeded
- `500`: Server error

#### GET /analysis/:id
Get specific analysis details.

**Response:**
```json
{
  "id": "uuid",
  "url": "https://example.com",
  "domain": "example.com",
  "riskScore": 0.85,
  "threats": {
    "phishing": 0.85,
    "malware": 0.10,
    "social": 0.45
  },
  "blocked": true,
  "source": "ml",
  "timestamp": "2025-09-03T10:00:00Z",
  "feedback": {
    "correct": false,
    "comment": "This was actually safe"
  }
}
```

#### GET /analyses
Get user's analysis history.

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)
- `domain` (filter by domain)

**Response:**
```json
{
  "analyses": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

### Feedback

#### POST /feedback
Submit feedback on an analysis.

**Request:**
```json
{
  "analysisId": "uuid",
  "correct": false,
  "actualThreat": "none",
  "comment": "This is my company's website"
}
```

**Response:**
```json
{
  "feedbackId": "uuid",
  "message": "Thank you for your feedback"
}
```

### User Statistics

#### GET /stats
Get user's protection statistics.

**Response:**
```json
{
  "totalScans": 1543,
  "threatsBlocked": 47,
  "timeRange": "all_time",
  "breakdown": {
    "phishing": 35,
    "malware": 8,
    "social": 4
  },
  "recentThreats": [
    {
      "url": "phishing-site.com",
      "timestamp": "2025-09-03T10:00:00Z",
      "riskScore": 0.95
    }
  ],
  "protectionRate": 0.97
}
```

**Query Parameters:**
- `timeRange`: `today`, `week`, `month`, `year`, `all_time`

#### GET /stats/daily
Get daily statistics.

**Response:**
```json
{
  "date": "2025-09-03",
  "scans": 45,
  "threats": 2,
  "uniqueDomains": 38
}
```

### User Settings

#### GET /settings
Get user preferences.

**Response:**
```json
{
  "autoBlock": true,
  "notifications": true,
  "whitelistedDomains": [
    "mycompany.com",
    "trusted-site.org"
  ]
}
```

#### PUT /settings
Update user preferences.

**Request:**
```json
{
  "autoBlock": false,
  "notifications": true
}
```

**Response:**
```json
{
  "message": "Settings updated successfully"
}
```

#### POST /settings/whitelist
Add domain to whitelist.

**Request:**
```json
{
  "domain": "trusted-site.com"
}
```

#### DELETE /settings/whitelist/:domain
Remove domain from whitelist.

### Health & Status

#### GET /health
Health check endpoint (no auth required).

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-09-03T10:00:00Z"
}
```

#### GET /status
Detailed status information.

**Response:**
```json
{
  "api": "operational",
  "database": "operational",
  "ml": "operational",
  "externalApis": {
    "googleSafe": "operational",
    "phishTank": "operational"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "INVALID_URL",
    "message": "The provided URL is not valid",
    "details": {
      "url": "not-a-url",
      "reason": "Invalid protocol"
    }
  },
  "timestamp": "2025-09-03T10:00:00Z",
  "requestId": "req-uuid"
}
```

### Error Codes

| Code                 | Description               |
|----------------------|---------------------------|
| `INVALID_URL`        | URL format is invalid     |
| `UNAUTHORIZED`       | Authentication failed     |
| `FORBIDDEN`          | Insufficient permissions  |
| `NOT_FOUND`          | Resource not found        |
| `RATE_LIMITED`       | Too many requests         |
| `INVALID_INPUT`      | Request validation failed |
| `INTERNAL_ERROR`     | Server error              |
| `SERVICE_UNAVAILABLE`| Temporary outage          |

## Rate Limiting

### Limits
- **Free tier:** 100 requests/hour

### Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693737600
```

### Rate Limit Response
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "retryAfter": 3600
  }
}
```

## Webhooks (Future)

### Event Types
- `analysis.completed`
- `threat.detected`
- `feedback.received`

### Webhook Payload
```json
{
  "event": "threat.detected",
  "timestamp": "2025-09-03T10:00:00Z",
  "data": {
    "analysisId": "uuid",
    "url": "phishing-site.com",
    "riskScore": 0.95
  }
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { PufferPhishClient } from '@pufferphish/sdk';

const client = new PufferPhishClient({
  apiKey: process.env.API_KEY,
  environment: 'production'
});

// Analyze URL
const result = await client.analyze('https://example.com');

// Get stats
const stats = await client.getStats('month');
```

### Python
```python
from pufferphish import Client

client = Client(api_key=os.environ['API_KEY'])

# Analyze URL
result = client.analyze('https://example.com')

# Submit feedback
client.submit_feedback(
    analysis_id=result['analysisId'],
    correct=False,
    comment='False positive'
)
```

### cURL
```bash
# Analyze URL
curl -X POST https://api.pufferphish.com/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Get stats
curl https://api.pufferphish.com/stats \
  -H "Authorization: Bearer $TOKEN"
```
