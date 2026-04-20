# Deriv OAuth Integration - App ID 11383

This document describes the Deriv API OAuth integration using App ID 11383.

## Overview

The trading application is integrated with the **Deriv API** using the official OAuth 2.0 flow. With App ID **11383**, users can:

- Log in directly with their Deriv account credentials
- Access real and demo trading accounts
- Subscribe to live market data and account balance updates
- Execute trades using the WebSocket API
- Switch between multiple accounts seamlessly

## Architecture

### Key Components

1. **OAuth Configuration** (`lib/deriv-config.ts`)
   - App ID: `11383`
   - OAuth Endpoints: `https://oauth.deriv.com/oauth2/authorize`
   - WebSocket: `wss://api.derivws.com/trading/v1/options/ws/public`

2. **Authentication Hook** (`hooks/use-deriv-auth.ts`)
   - Manages OAuth login flow
   - Handles token storage and authorization
   - Manages account switching
   - Subscribes to balance updates

3. **OAuth Callback Route** (`app/api/auth/oauth-callback/route.ts`)
   - Receives redirect from `https://oauth.deriv.com/oauth2/authorize?app_id=11383`
   - Extracts user tokens from URL parameters
   - Stores tokens in cookies and localStorage
   - Redirects back to home with authenticated session

4. **API Token Modal** (`components/api-token-modal.tsx`)
   - Provides "Login with Deriv" button
   - Instructions for OAuth setup
   - Fallback manual API token input method

## OAuth Flow

### 1. User Clicks "Login with Deriv"

User initiates OAuth login via the API Token Modal component.

```typescript
const oauthUrl = new URL('https://oauth.deriv.com/oauth2/authorize')
oauthUrl.searchParams.set('app_id', '11383')
oauthUrl.searchParams.set('l', 'en')
oauthUrl.searchParams.set('brand', 'deriv')

window.location.href = oauthUrl.toString()
```

### 2. Deriv OAuth Authorization

User is redirected to `https://oauth.deriv.com/oauth2/authorize?app_id=11383` where they:
- Log in with their Deriv credentials (or use existing session)
- See the authorization request: "DTrader Tool" app requesting access to their account
- Click "Approve" to authorize the app

### 3. Redirect with Tokens

Deriv redirects back to `/api/auth/oauth-callback` with tokens in the URL:

```
https://yourapp.com/api/auth/oauth-callback?
  acct1=CR1234567
  &token1=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  &cur1=USD
  &acct2=CR7654321
  &token2=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
  &cur2=EUR
```

### 4. Token Processing

The callback route extracts tokens and stores them:

```typescript
// Extract tokens from URL parameters
for (let i = 1; i <= 20; i++) {
  const acct = params.get(`acct${i}`)
  const token = params.get(`token${i}`)
  
  if (acct && token) {
    tokens[acct] = token
    // Store primary token (acct1)
    if (i === 1) {
      primaryToken = token
      primaryAcct = acct
    }
  }
}

// Store in browser and cookies
localStorage.setItem("deriv_auth_tokens", JSON.stringify(tokens))
localStorage.setItem("deriv_api_token", primaryToken)
localStorage.setItem("active_login_id", primaryAcct)
```

### 5. WebSocket Authorization

Once tokens are stored, the auth hook authorizes the WebSocket connection:

```typescript
const manager = DerivWebSocketManager.getInstance()
await manager.connect()
manager.send({ authorize: primaryToken })
```

### 6. Account Status & Balance

After authorization, the app:
- Receives account info (account type, balance, currency)
- Subscribes to balance updates for all accounts
- Enables account switching

## Available Endpoints

### Deriv OAuth
- **Authorization URL**: `https://oauth.deriv.com/oauth2/authorize?app_id=11383`
- **Token Exchange**: `https://oauth.deriv.com/oauth2/token` (for future PKCE flow)

### Deriv WebSocket API
- **Public Endpoint**: `wss://api.derivws.com/trading/v1/options/ws/public`
- **Documentation**: https://legacy-docs.deriv.com/docs/websockets

### Deriv REST API
- **Base URL**: `https://api.derivws.com`
- **Documentation**: https://legacy-docs.deriv.com/docs/understanding-apis

## Key API Requests

### Authorize (Get Account Info)
```javascript
{
  "authorize": "your_api_token_here"
}
```

**Response:**
```javascript
{
  "msg_type": "authorize",
  "authorize": {
    "loginid": "CR1234567",
    "currency": "USD",
    "balance": 1000.00,
    "is_virtual": true,
    "account_list": [
      {
        "loginid": "CR1234567",
        "currency": "USD",
        "balance": 1000.00,
        "is_virtual": true
      },
      {
        "loginid": "CR7654321",
        "currency": "EUR",
        "balance": 500.00,
        "is_virtual": false
      }
    ]
  }
}
```

### Subscribe to Balance Updates
```javascript
{
  "balance": 1,
  "subscribe": 1
}
```

### Get Market Symbols
```javascript
{
  "active_symbols": "brief",
  "product_type": "basic"
}
```

### Get Tick Data
```javascript
{
  "ticks": "R_10",
  "subscribe": 1
}
```

## Environment Setup

### Development
```bash
npm run dev
# Runs on http://localhost:3000
# OAuth callback URL: http://localhost:3000/api/auth/oauth-callback
```

### Production
Set up OAuth redirect URI in Deriv app settings (if needed):
```
https://yourdomain.com/api/auth/oauth-callback
```

## Testing the Integration

### 1. Local Testing
```bash
npm run dev
# Navigate to http://localhost:3000
# Click "Login with Deriv OAuth"
# Use Deriv demo account credentials
```

### 2. Verifying Token Storage
```javascript
// In browser console:
localStorage.getItem('deriv_api_token')
localStorage.getItem('deriv_auth_tokens')
localStorage.getItem('active_login_id')
```

### 3. Testing Account Switching
```javascript
// Switch to a different account:
switchAccount('CR7654321')
```

### 4. Testing WebSocket Connection
```javascript
// Check WebSocket status:
DerivWebSocketManager.getInstance().isConnected()
// Check authorization:
DerivWebSocketManager.getInstance().isAuthorized
```

## Security Considerations

1. **OAuth Tokens**: Stored in `localStorage` for client-side use with the WebSocket API
   - Tokens are long-lived and user-managed in Deriv
   - Users can revoke tokens from their Deriv account settings

2. **CORS**: Deriv's WebSocket API is accessible from any origin
   - App ID 11383 is pre-configured with public CORS access

3. **HTTPS**: Always use HTTPS in production
   - OAuth redirects require secure connections

4. **Token Expiration**: Deriv tokens do not auto-expire
   - Users manually manage token lifecycle in their Deriv account

## References

### Deriv Documentation
- **Getting Started**: https://legacy-docs.deriv.com/docs/getting-started
- **Authentication**: https://legacy-docs.deriv.com/docs/authentication
- **OAuth**: https://legacy-docs.deriv.com/docs/oauth
- **API Understanding**: https://legacy-docs.deriv.com/docs/understanding-apis
- **WebSocket**: https://legacy-docs.deriv.com/docs/websockets

### Code References
- **Auth Hook**: `hooks/use-deriv-auth.ts`
- **Config**: `lib/deriv-config.ts`
- **WebSocket Manager**: `lib/deriv-websocket-manager.ts`
- **OAuth Callback**: `app/api/auth/oauth-callback/route.ts`
- **API Modal**: `components/api-token-modal.tsx`

## Troubleshooting

### OAuth Not Working
- Check App ID: Should be `11383`
- Check redirect URL: Must match `api/auth/oauth-callback`
- Clear browser cookies and localStorage
- Try incognito/private window to avoid cache issues

### WebSocket Connection Failed
- Verify API token is valid in localStorage
- Check browser console for error messages
- Ensure Deriv API endpoint is reachable: `wss://api.derivws.com`

### Balance Not Updating
- Check if balance subscription was sent: `{ balance: 1, subscribe: 1 }`
- Verify account is authorized
- Check WebSocket message logs

### Account Switching Fails
- Verify all tokens are stored in `deriv_auth_tokens`
- Check that account exists in the token list
- Clear session and re-login if issues persist

## Future Enhancements

1. **PKCE Flow**: Implement full OAuth 2.0 PKCE for enhanced security
2. **Token Refresh**: Add automatic token refresh mechanism
3. **Account Management**: Build UI for detailed account management
4. **Advanced Trading**: Add more trading features (multi-leg trades, strategies)
5. **Analytics**: Track trading performance and statistics
