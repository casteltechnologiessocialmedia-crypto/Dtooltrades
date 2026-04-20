# Deriv API Reference - Quick Lookup

**App ID**: 11383  
**Version**: 1.0  
**Last Updated**: April 20, 2026

---

## Quick Links

### OAuth
- **Authorization**: https://oauth.deriv.com/oauth2/authorize?app_id=11383
- **Token Exchange**: https://oauth.deriv.com/oauth2/token
- **Callback**: `/api/auth/oauth-callback`

### WebSocket
- **Endpoint**: `wss://api.derivws.com/trading/v1/options/ws/public`
- **Manager**: `DerivWebSocketManager.getInstance()`

### Documentation
- **Getting Started**: https://legacy-docs.deriv.com/docs/getting-started
- **Authentication**: https://legacy-docs.deriv.com/docs/authentication
- **OAuth**: https://legacy-docs.deriv.com/docs/oauth
- **API Understanding**: https://legacy-docs.deriv.com/docs/understanding-apis
- **WebSockets**: https://legacy-docs.deriv.com/docs/websockets

---

## Common Code Patterns

### Login with Deriv
```typescript
import { useDerivAuth } from '@/hooks/use-deriv-auth'

export function LoginComponent() {
  const { requestLogin } = useDerivAuth()
  
  return (
    <button onClick={requestLogin}>
      Login with Deriv
    </button>
  )
}
```

### Get Auth State
```typescript
const { 
  isLoggedIn,      // boolean
  token,           // string (API token)
  balance,         // { amount: number, currency: string }
  accountType,     // "Demo" | "Real"
  accounts,        // Account[]
  activeLoginId,   // string (current account)
  isInitializing   // boolean
} = useDerivAuth()
```

### Switch Accounts
```typescript
const { switchAccount } = useDerivAuth()

switchAccount('CR1234567') // Login ID of other account
```

### Logout
```typescript
const { logout } = useDerivAuth()

logout() // Clears tokens and resets state
```

### Connect WebSocket
```typescript
import { DerivWebSocketManager } from '@/lib/deriv-websocket-manager'

const manager = DerivWebSocketManager.getInstance()
await manager.connect()
manager.send({ authorize: token })
```

### Subscribe to Balance
```typescript
manager.send({
  balance: 1,
  subscribe: 1
})

manager.on('balance', (data) => {
  console.log('Balance:', data.balance.balance)
  console.log('Currency:', data.balance.currency)
})
```

### Get Market Symbols
```typescript
manager.send({
  active_symbols: 'brief',
  product_type: 'basic'
})

manager.on('active_symbols', (data) => {
  data.active_symbols.forEach(symbol => {
    console.log(symbol.symbol, symbol.display_name)
  })
})
```

### Subscribe to Ticks
```typescript
manager.send({
  ticks: 'R_10',  // Symbol
  subscribe: 1
})

manager.on('tick', (tick) => {
  console.log('Price:', tick.quote)
  console.log('Last Digit:', tick.lastDigit)
})
```

### Place a Trade (Example)
```javascript
manager.send({
  proposal: 1,
  contract_type: 'DIGITEVEN',
  currency: 'USD',
  amount: 100,
  basis: 'stake',
  duration: 5,
  duration_unit: 't',  // 't' = ticks
  symbol: 'R_10',
  barrier: 4
})

manager.on('proposal', (data) => {
  // Get proposal ID for contract purchase
  const proposalId = data.proposal.id
  console.log('Proposal ID:', proposalId)
  
  // Buy the contract
  manager.send({
    buy: proposalId,
    price: data.proposal.ask_price
  })
})
```

---

## Storage & State

### localStorage Keys
```javascript
// Primary account token
localStorage.getItem('deriv_api_token')

// All account tokens (JSON)
JSON.parse(localStorage.getItem('deriv_auth_tokens'))
// Returns: { "CR1234567": "token1", "CR7654321": "token2" }

// Currently active account
localStorage.getItem('active_login_id')
```

### Clear Session
```javascript
localStorage.removeItem('deriv_api_token')
localStorage.removeItem('deriv_auth_tokens')
localStorage.removeItem('active_login_id')
```

---

## API Request/Response Examples

### Authorize Request
```javascript
{
  "authorize": "your_api_token_here"
}
```

### Authorize Response
```javascript
{
  "msg_type": "authorize",
  "authorize": {
    "loginid": "CR1234567",
    "currency": "USD",
    "balance": 1000.00,
    "is_virtual": true,
    "email": "user@example.com",
    "account_list": [
      {
        "loginid": "CR1234567",
        "currency": "USD",
        "balance": 1000.00,
        "is_virtual": true,
        "account_type": "trading"
      }
    ]
  }
}
```

### Balance Update
```javascript
{
  "msg_type": "balance",
  "balance": {
    "loginid": "CR1234567",
    "balance": 1250.50,
    "currency": "USD"
  }
}
```

### Tick Data
```javascript
{
  "msg_type": "tick",
  "tick": {
    "bid": 0.5234,
    "ask": 0.5235,
    "epoch": 1234567890,
    "pip_size": 4,
    "id": "1d50e1ba-7e14-0c5b-8e13-8f45fb6e1234",
    "quote": 0.52345,
    "symbol": "R_10",
    "exchange_time": 1234567890
  }
}
```

### Active Symbols
```javascript
{
  "msg_type": "active_symbols",
  "active_symbols": [
    {
      "symbol": "R_10",
      "display_name": "Volatility 10",
      "market": "derived",
      "market_display_name": "Derived",
      "submarket": "volidx",
      "submarket_display_name": "Volatility Indices",
      "exchange_is_open": 1,
      "is_trading_suspended": 0,
      "pip": 0.0001,
      "intraday_interval_minutes": 1,
      "spot": 12.5432
    }
  ]
}
```

---

## Error Handling

### Common Errors

```javascript
// Invalid token
{
  "error": {
    "code": "InvalidToken",
    "message": "Invalid token."
  }
}

// Authorization required
{
  "error": {
    "code": "AuthorizationRequired",
    "message": "Authorization is required."
  }
}

// Connection failed
{
  "error": {
    "code": "ConnectionFailed",
    "message": "Connection failed. Please check your internet connection."
  }
}
```

### Error Handling Pattern
```typescript
manager.on('error', (error) => {
  const message = error?.message || 'Unknown error'
  console.error('[v0] API Error:', message)
  
  if (error.code === 'InvalidToken') {
    // Clear token and show login modal
    logout()
  }
})
```

---

## WebSocket Message Types

### Request Messages
```javascript
{ "authorize": string }           // Authenticate
{ "balance": 1, "subscribe": 1 }  // Subscribe to balance
{ "ticks": string, "subscribe": 1 } // Subscribe to ticks
{ "active_symbols": "brief" }     // Get symbols
{ "forget_all": [...] }           // Unsubscribe all
{ "forget": string }              // Unsubscribe single
{ "proposal": 1, "contract_type": string, ... } // Get proposal
{ "buy": string, "price": number } // Buy contract
```

### Response Messages
```javascript
// authorize
{ "msg_type": "authorize", "authorize": {...} }

// balance
{ "msg_type": "balance", "balance": {...} }

// tick
{ "msg_type": "tick", "tick": {...} }

// active_symbols
{ "msg_type": "active_symbols", "active_symbols": [...] }

// proposal
{ "msg_type": "proposal", "proposal": {...} }

// buy
{ "msg_type": "buy", "buy": {...}, "transaction_id": number }

// error
{ "error": {...}, "req_id": number }
```

---

## Config Files Reference

### lib/deriv-config.ts
```typescript
// App ID
export const DERIV_APP_ID = "11383"
export const OAUTH_CLIENT_ID = "11383"

// Endpoints
export const DERIV_API = {
  WEBSOCKET: "wss://api.derivws.com/trading/v1/options/ws/public",
  OAUTH: "https://oauth.deriv.com/oauth2/authorize",
  TOKEN: "https://oauth.deriv.com/oauth2/token"
}

// Redirect URL (auto-detected)
export const DERIV_REDIRECT_URL = getOAuthRedirectUrl()
```

---

## Debugging

### Enable Logging
```javascript
// Already enabled with [v0] prefix
// Check browser console for logs like:
// [v0] 🔐 OAuth URL: ...
// [v0] 🔑 OAuth tokens received...
// [v0] ✅ Authorized: CR1234567
// [v0] 💰 Balance update received...
```

### Check WebSocket Status
```javascript
const manager = DerivWebSocketManager.getInstance()
console.log('Connected:', manager.isConnected())
console.log('Authorized:', manager.isAuthorized)
console.log('Status:', manager.connectionStatus)
```

### Check Token Storage
```javascript
// Primary token
console.log('Token:', localStorage.getItem('deriv_api_token'))

// All tokens
console.log('Tokens:', localStorage.getItem('deriv_auth_tokens'))

// Active account
console.log('Active:', localStorage.getItem('active_login_id'))
```

### Test OAuth Flow
```javascript
// Log into console
const { loginWithDeriv } = useDerivAuth()
loginWithDeriv()

// After redirect, check:
const token = localStorage.getItem('deriv_api_token')
const tokens = JSON.parse(localStorage.getItem('deriv_auth_tokens'))
console.log('Tokens:', tokens)
```

---

## Limits & Constraints

### Rate Limiting
- No explicit rate limit documented for App ID 11383
- WebSocket connection maintains keepalive pings (2-minute timeout)
- Multiple subscriptions allowed per connection

### Message Limits
- No documented message size limit
- Keep requests reasonable (< 10KB)

### Account Limits
- Up to 20 accounts supported in OAuth response (acct1-acct20)
- Multiple concurrent connections possible

### Trading Limits
- Minimum stake: Usually 1 USD equivalent
- Maximum stake: Account balance dependent
- Contract duration: 1-1000 ticks for Volatility indices

---

## Performance Tips

1. **Single WebSocket Connection**
   - Use `DerivWebSocketManager.getInstance()` singleton
   - Don't create multiple connections

2. **Batch Subscriptions**
   - Subscribe to multiple ticks in one request
   - Reduces network overhead

3. **Unsubscribe When Done**
   - Use `forget` message to unsubscribe
   - Reduces server load

4. **Cache Symbol Data**
   - Store active_symbols response
   - Don't re-request frequently

5. **Throttle UI Updates**
   - Tick updates may be very frequent
   - Use debouncing/throttling for UI

---

## Troubleshooting Checklist

- [ ] Verify App ID is "11383"
- [ ] Verify OAuth endpoint: https://oauth.deriv.com/oauth2/authorize
- [ ] Verify WebSocket endpoint: wss://api.derivws.com/trading/v1/options/ws/public
- [ ] Check localStorage for tokens after login
- [ ] Check browser console for [v0] logs
- [ ] Verify WebSocket connection status
- [ ] Clear cookies/localStorage and re-login
- [ ] Try incognito/private window
- [ ] Check Deriv account in settings
- [ ] Verify internet connection

---

## Support Resources

### Documentation
- Deriv API Docs: https://developers.deriv.com/api/
- Legacy Docs: https://legacy-docs.deriv.com/docs/

### Deriv Community
- Forum: https://community.deriv.com/
- GitHub: https://github.com/deriv-com/

### This Project
- Integration Guide: See `DERIV_OAUTH_INTEGRATION.md`
- Quick Start: See `DERIV_OAUTH_QUICK_START.md`
- Changes: See `CHANGES_SUMMARY.md`
- Report: See `IMPLEMENTATION_REPORT.md`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-20 | Initial OAuth integration with App ID 11383 |

---

**Last Updated**: April 20, 2026  
**Maintained By**: v0  
**Status**: Active ✅
