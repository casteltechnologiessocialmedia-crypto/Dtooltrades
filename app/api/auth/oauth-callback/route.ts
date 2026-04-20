import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth Callback Handler for Deriv App ID 11383
 * 
 * Handles redirect from https://oauth.deriv.com/oauth2/authorize?app_id=11383
 * 
 * Deriv's OAuth returns user tokens directly in the redirect URL:
 * ?acct1=XXXXX&token1=XXXXX&acct2=YYYYY&token2=YYYYY&cur1=USD&cur2=EUR&...
 * 
 * Reference: https://legacy-docs.deriv.com/docs/oauth
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Extract OAuth error if present
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (error) {
      console.error('[v0] OAuth Error:', error, errorDescription)
      const redirectUrl = new URL('/', request.nextUrl.origin)
      redirectUrl.searchParams.set('error', error)
      redirectUrl.searchParams.set('error_description', errorDescription || 'OAuth authorization failed')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Extract OAuth code (for future PKCE flow)
    const code = searchParams.get('code')
    if (code) {
      console.log('[v0] OAuth code received, processing...')
      // Redirect to home with code for client-side handling
      const redirectUrl = new URL('/', request.nextUrl.origin)
      redirectUrl.searchParams.set('code', code)
      redirectUrl.searchParams.set('state', searchParams.get('state') || '')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Extract legacy token parameters (app_id=11383 returns these directly)
    // Format: ?acct1=XXXXX&token1=XXXXX&cur1=USD&acct2=YYYYY&token2=YYYYY&cur2=EUR...
    const tokens: Record<string, string> = {}
    const accountTypes: Record<string, string> = {}
    let primaryToken = ""
    let primaryAcct = ""
    
    for (let i = 1; i <= 20; i++) {
      const acct = searchParams.get(`acct${i}`)
      const token = searchParams.get(`token${i}`)
      const cur = searchParams.get(`cur${i}`)
      
      if (acct && token) {
        tokens[acct] = token
        if (cur) accountTypes[acct] = cur
        
        if (i === 1) {
          primaryToken = token
          primaryAcct = acct
        }
      }
    }
    
    if (Object.keys(tokens).length === 0) {
      console.warn('[v0] OAuth callback received but no tokens found in parameters')
      return NextResponse.redirect(new URL('/', request.nextUrl.origin))
    }
    
    console.log('[v0] OAuth tokens received for', Object.keys(tokens).length, 'account(s)')
    
    // Redirect to home with tokens in search params
    const redirectUrl = new URL('/', request.nextUrl.origin)
    
    let accountIndex = 1
    for (const [acct, token] of Object.entries(tokens)) {
      redirectUrl.searchParams.set(`acct${accountIndex}`, acct)
      redirectUrl.searchParams.set(`token${accountIndex}`, token)
      if (accountTypes[acct]) {
        redirectUrl.searchParams.set(`cur${accountIndex}`, accountTypes[acct])
      }
      accountIndex++
    }
    
    // Set HTTP-only cookie for primary token (for server-side access if needed)
    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set('deriv_api_token', primaryToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
    
    // Store all tokens in a non-HTTPOnly cookie for client-side access
    response.cookies.set('deriv_auth_tokens', JSON.stringify(tokens), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })
    
    return response
    
  } catch (error) {
    console.error('[v0] OAuth callback error:', error)
    return NextResponse.redirect(new URL('/', request.nextUrl.origin))
  }
}
