# 🔒 Token Security - Web App

## Current Implementation

### Storage Method: `localStorage`

- ✅ Persistent across browser sessions
- ✅ Consistent with mobile-app pattern
- ⚠️ Vulnerable to XSS attacks

### Security Measures

#### 1. **Dual Token Storage**

```typescript
// API interceptor reads from tokenStorage
localStorage: metropolitan_access_token;
localStorage: metropolitan_refresh_token;

// UI state managed by Zustand
localStorage: metropolitan - auth - storage;
```

#### 2. **Device ID Sync**

```typescript
// JWT token contains deviceId
// Frontend syncs deviceId to localStorage
// Backend validates deviceId against Redis session
// Prevents token hijacking
```

#### 3. **Token Rotation**

- Access token: 15 minutes (900s)
- Refresh token: 30 days
- Auto-refresh on 401 errors
- Blacklisting on logout

#### 4. **Logout Security**

```typescript
clearAuth() {
  // 1. Clear Zustand store
  // 2. Clear tokenStorage (localStorage keys)
  // 3. Clear device ID
  // 4. Notify backend (blacklist tokens)
  // 5. Clear TanStack Query cache
}
```

## Why Not httpOnly Cookies?

### Pro: httpOnly Cookie

- ✅ Immune to XSS attacks
- ✅ Automatic CSRF protection

### Con: httpOnly Cookie

- ❌ Requires server-side API (Next.js API routes)
- ❌ CORS complexity
- ❌ Different pattern from mobile-app
- ❌ More complex refresh token flow

### Decision: localStorage + Security Headers

- Mobile-app uses SecureStore (similar to localStorage)
- Consistency across platforms
- Simpler architecture
- Protected by CSP headers (backend)

## Backend Security (Required)

### 1. **Content Security Policy (CSP)**

```typescript
// backend/index.ts
app.use((ctx) => {
  ctx.set("Content-Security-Policy", "default-src 'self'");
  ctx.set("X-Content-Type-Options", "nosniff");
  ctx.set("X-Frame-Options", "DENY");
  ctx.set("X-XSS-Protection", "1; mode=block");
});
```

### 2. **Redis Session Validation**

- Device ID must match JWT deviceId
- Session expires after token expiry
- Multiple sessions per user allowed
- Device fingerprinting for anomaly detection

### 3. **Token Blacklisting**

- Logout → Add to Redis blacklist
- Expiry: Same as refresh token TTL
- Checked on every protected route

## Device ID Flow

```
1. User logs in (OTP/Social)
   ↓
2. Backend generates session → deviceId: dev_xxx
   ↓
3. JWT contains deviceId in payload
   ↓
4. Frontend extracts deviceId from JWT
   ↓
5. Saves to localStorage: metropolitan_device_id
   ↓
6. Every API request sends X-Device-ID header
   ↓
7. Backend validates deviceId matches Redis session
   ↓
8. On logout: Clear deviceId → New session next time
```

## Potential Vulnerabilities & Mitigations

### 1. **XSS (Cross-Site Scripting)**

**Risk**: Malicious script can read localStorage
**Mitigation**:

- CSP headers (backend)
- React's built-in XSS protection
- No dangerouslySetInnerHTML usage
- Sanitize user inputs

### 2. **Token Hijacking**

**Risk**: Stolen token used from different device
**Mitigation**:

- Device ID validation
- Device fingerprinting
- IP address monitoring (backend)
- Unusual activity detection

### 3. **CSRF (Cross-Site Request Forgery)**

**Risk**: Unauthorized requests from malicious site
**Mitigation**:

- SameSite cookie policy
- CORS restrictions
- Custom headers (X-Device-ID)
- Device fingerprinting

### 4. **Session Fixation**

**Risk**: Attacker forces victim to use known session
**Mitigation**:

- Regenerate device ID on login
- Token rotation
- Session expiry

## Production Recommendations

### High Security (Banking, Healthcare)

1. Implement httpOnly cookies via Next.js API routes
2. Add 2FA/MFA
3. Hardware security keys
4. Biometric authentication

### Standard Security (E-commerce) ✅ **CURRENT**

1. localStorage + CSP headers
2. Device validation
3. Token rotation
4. Blacklisting

### Development Only

1. No encryption
2. Long-lived tokens
3. Weak validation

## Monitoring & Logging

### Backend (Sentry)

- Failed authentication attempts
- Token validation failures
- Device ID mismatches
- Unusual IP addresses

### Frontend

- Device ID sync success/failure
- Token refresh failures
- Logout completions

## Future Enhancements

### Phase 1 (Optional)

- [ ] Biometric authentication (WebAuthn)
- [ ] Push notification for new device login
- [ ] Email verification on suspicious activity

### Phase 2 (Enterprise)

- [ ] Hardware security keys (FIDO2)
- [ ] Trusted device management
- [ ] Session management dashboard

## Conclusion

Current implementation balances security with usability:

- ✅ Industry-standard for SPA applications
- ✅ Consistent with mobile-app
- ✅ Protected by multiple layers
- ✅ Simpler to maintain

**Risk Level: Medium-Low** (Acceptable for e-commerce)
