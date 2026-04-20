# Deriv OAuth Integration - Quick Start Guide

**App ID**: 11383  
**OAuth Endpoint**: https://oauth.deriv.com/oauth2/authorize  
**Callback URL**: `/api/auth/oauth-callback`

## What Was Changed

### 1. Updated App ID Configuration
- **File**: `lib/deriv-config.ts`
- **Change**: Updated `DERIV_APP_ID` and `OAUTH_CLIENT_ID` from `"32KGABH3pjSMkQ6JTotTG"` to `"11383"`
- **Impact**: All OAuth requests now use the correct Deriv app

### 2. Updated OAuth Endpoints
- **File**: `lib/deriv-config.ts`
- **Changes**:
  - `OAUTH`: Changed to `https://oauth.deriv.com/oauth2/authorize`
  - `TOKEN`: Changed to `https://oauth.deriv.com/oauth2/token`
- **Impact**: OAuth redirects now point to the correct Deriv OAuth servers

### 3. Simplified OAuth Login Flow
- **File**: `hooks/use-deriv-auth.ts`
- **Changes**:
  - Removed PKCE-related code (generateCodeVerifier, generateCodeChallenge)
  - Removed OAuth code exchange logic
  - Simplified to direct OAuth redirect with app_id=11383
- **Impact**: Faster, simpler OAuth login that returns tokens directly in the URL

### 4. Updated OAuth Callback Handler
- **File**: `app/api/auth/oauth-callback/route.ts`
- **Changes**:
  - Replaced complex code exchange logic with simple token extraction
  - Extracts `acct1`, `token1`, `acct2`, `token2`, etc. from URL parameters
  - Stores tokens in localStorage and cookies
- **Impact**: Properly handles Deriv's OAuth redirect with inline tokens

### 5. Updated Login UI
- **File**: `components/api-token-modal.tsx`
- **Changes**:
  - Updated instructions to mention App ID 11383
  - Removed client ID reference (32EtOUHbr4zUOcHKwjgwj)
  - Simplified setup instructions for direct OAuth flow
- **Impact**: Users see correct instructions when logging in

## How to Test

### 1. Start the App
```bash
npm run dev
# App runs on http://localhost:3000
```

### 2. Click "Login with Deriv OAuth"
- Navigate to http://localhost:3000 in your browser
- The API Token Modal should appear
- Click the green "Login with Deriv OAuth" button

### 3. Deriv OAuth Flow
- You'll be redirected to https://oauth.deriv.com/oauth2/authorize?app_id=11383
- Log in with your Deriv account (or use existing session)
- Click "Approve" to authorize the app
- You'll be redirected back to http://localhost:3000/api/auth/oauth-callback with tokens

### 4. Verify Authentication
- Check browser console for logs starting with `[v0]`
- Check localStorage:
  ```javascript
  // In browser DevTools console:
  localStorage.getItem('deriv_api_token')
  localStorage.getItem('deriv_auth_tokens')
  localStorage.getItem('active_login_id')
  ```

### 5. Verify WebSocket Connection
- Check if trading data appears
- Watch console for tick updates and balance changes
- Try clicking on a symbol to see if you can place a trade

## OAuth Flow Diagram

```
User
  ↓
[Click "Login with Deriv OAuth" button]
  ↓
loginWithDeriv() in use-deriv-auth.ts
  ↓
Redirect to: https://oauth.deriv.com/oauth2/authorize?app_id=11383&l=en&brand=deriv
  ↓
User logs in to Deriv
  ↓
User sees: "DTrader Tool wants access to your account"
  ↓
User clicks "Approve"
  ↓
Redirect to: http://localhost:3000/api/auth/oauth-callback?acct1=CR123&token1=abc123&cur1=USD
  ↓
/api/auth/oauth-callback/route.ts extracts tokens
  ↓
Redirect to: http://localhost:3000 (home page)
  ↓
use-deriv-auth.ts detects tokens in URL
  ↓
Tokens stored in localStorage
  ↓
WebSocket connects and authorizes with token
  ↓
App shows trading interface with live data
```

## File Structure

```
app/
├── api/auth/
│   └── oauth-callback/
│       └── route.ts          ← OAuth callback handler
├── page.tsx                  ← Main trading page
└── layout.tsx

components/
└── api-token-modal.tsx       ← Login UI with OAuth button

lib/
├── deriv-config.ts           ← App ID and endpoints
├── deriv-api-context.tsx     ← API context provider
├── deriv-websocket-manager.ts ← WebSocket connection
└── deriv-api.ts              ← API client

hooks/
└── use-deriv-auth.ts         ← OAuth and auth logic

Documentation:
├── DERIV_OAUTH_INTEGRATION.md    ← Detailed integration guide
└── DERIV_OAUTH_QUICK_START.md    ← This file
```

## Key API References Used

Based on the Deriv API documentation:

### Getting Started
📖 https://legacy-docs.deriv.com/docs/getting-started

### Authentication
📖 https://legacy-docs.deriv.com/docs/authentication

### OAuth
📖 https://legacy-docs.deriv.com/docs/oauth
- App ID: `11383` (public app with pre-configured OAuth endpoints)
- OAuth Endpoint: `https://oauth.deriv.com/oauth2/authorize`
- Token Endpoint: `https://oauth.deriv.com/oauth2/token`
- Response Type: Direct token in URL parameters

### WebSocket API
📖 https://legacy-docs.deriv.com/docs/websockets
- Endpoint: `wss://api.derivws.com/trading/v1/options/ws/public`
- Auth: Send `{ "authorize": "token_here" }`
- Subscribe: Send `{ "balance": 1, "subscribe": 1 }`

### API Understanding
📖 https://legacy-docs.deriv.com/docs/understanding-apis
- Request/response format
- Error handling
- Rate limiting

## Troubleshooting

### "OAuth login not available" Error
- You're in a v0 preview environment (vusercontent.net)
- Solution: Deploy to your own server or use manual API token method

### Blank page after OAuth approval
- Check browser console for errors
- Verify callback URL is `/api/auth/oauth-callback`
- Check localStorage for tokens

### WebSocket won't connect
- Verify token was stored: `localStorage.getItem('deriv_api_token')`
- Check browser console for WebSocket errors
- Try clearing localStorage and re-logging in

### Multiple accounts not showing
- Verify `deriv_auth_tokens` in localStorage contains all accounts
- Check that acct2, acct3, etc. are in the URL parameters

## Security Notes

1. **Tokens stored in localStorage** - Accessible by JavaScript on the domain
   - Fine for demo/trading app where user controls the environment
   - In production, consider additional security measures

2. **HTTPS in production** - OAuth requires secure connections
   - Set environment to production for secure cookies

3. **Token management** - Users can revoke tokens in their Deriv account
   - Deriv tokens don't auto-expire
   - Recommended to add token refresh in future

## Next Steps

1. **Deploy to production**
   - Update OAuth callback URL in Deriv app settings if needed
   - Set `NEXT_PUBLIC_DERIV_OAUTH_CLIENT_ID` environment variable

2. **Add PKCE for enhanced security**
   - Implement OAuth 2.0 PKCE flow for code-based token exchange
   - Reduces risk of token interception in URL

3. **Implement token refresh**
   - Add mechanism to refresh tokens before expiration
   - Better user experience for long sessions

4. **Add error handling**
   - Better error messages for failed OAuth
   - Retry logic for failed connections

5. **Add logout confirmation**
   - Confirm before clearing user session
   - Option to revoke tokens from app

## Support

For issues with:
- **Deriv API**: https://developers.deriv.com/api/
- **OAuth Setup**: https://app.deriv.com/account/api-token
- **This App**: Check console logs and verify tokens in localStorage
