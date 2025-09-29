# 🔐 Web SecureStore Implementation Guide

## Overview

**Web SecureStore** provides encrypted localStorage for sensitive data, similar to Expo's SecureStore for mobile-app.

### Features

- ✅ **AES-256-GCM encryption** (Industry standard)
- ✅ **Per-session keys** (Keys cleared when tab closes)
- ✅ **Automatic fallback** (Works even if crypto fails)
- ✅ **Simple API** (Same as Expo SecureStore)
- ✅ **No external dependencies** (Uses Web Crypto API)

### Security Model

```
┌─────────────────────────────────────────┐
│  Web SecureStore Architecture           │
├─────────────────────────────────────────┤
│                                         │
│  1. Generate/Load Encryption Key        │
│     ↓                                   │
│  sessionStorage: encryption_key         │
│  (Cleared when tab closes)              │
│                                         │
│  2. Encrypt Data (AES-256-GCM)          │
│     ↓                                   │
│  3. Store in localStorage               │
│     localStorage: secure_token          │
│     (Encrypted at rest)                 │
│                                         │
│  4. Decrypt on Read                     │
│     ↓                                   │
│  5. Return Plain Data                   │
│                                         │
└─────────────────────────────────────────┘
```

## Usage

### Basic Example

```typescript
import { secureStorage } from '@/lib/secure-storage';

// Save encrypted data
await secureStorage.setItemAsync('access_token', 'eyJhbGci...');

// Retrieve and decrypt
const token = await secureStorage.getItemAsync('access_token');

// Delete
await secureStorage.deleteItemAsync('access_token');

// Check availability
if (secureStorage.isAvailable()) {
  console.log('Encryption is available!');
}
```

### Migrating Existing Data

```typescript
import { migrateToSecureStorage } from '@/lib/secure-storage';

// Migrate from plain localStorage to encrypted
await migrateToSecureStorage('metropolitan_access_token');
await migrateToSecureStorage('metropolitan_refresh_token');
```

### Token Storage Integration

```typescript
// lib/token-storage-secure.ts
import { secureStorage } from './secure-storage';

export class SecureTokenStorage {
  async saveAccessToken(token: string): Promise<void> {
    await secureStorage.setItemAsync('access_token', token);
  }

  async getAccessToken(): Promise<string | null> {
    return await secureStorage.getItemAsync('access_token');
  }

  async clearTokens(): Promise<void> {
    await secureStorage.deleteItemAsync('access_token');
    await secureStorage.deleteItemAsync('refresh_token');
  }
}
```

## Security Considerations

### ✅ What It Protects Against

1. **Physical Access to localStorage**
   - Attacker with access to localStorage sees encrypted data
   - Cannot decrypt without session key

2. **LocalStorage Inspection**
   - DevTools shows encrypted strings
   - Casual inspection reveals nothing

3. **Browser Extensions (Limited)**
   - Extensions reading localStorage see encrypted data
   - But can still access memory if they run in same context

### ❌ What It DOESN'T Protect Against

1. **XSS Attacks**
   - Malicious scripts can access decrypted data in memory
   - Can call `getItemAsync()` just like legitimate code
   - **Primary defense**: CSP headers, input sanitization

2. **Memory Dumps**
   - Decrypted data exists in memory
   - Advanced attacks could capture memory

3. **Browser Extensions with Full Access**
   - Extensions with full page access can intercept everything

### Comparison

| Method | XSS Protection | Physical Security | Ease of Use |
|--------|----------------|-------------------|-------------|
| Plain localStorage | ❌ | ❌ | ✅✅✅ |
| **Web SecureStore** | ❌ | ✅✅ | ✅✅ |
| httpOnly Cookies | ✅✅ | ✅ | ❌ |
| Hardware Keys | ✅✅✅ | ✅✅✅ | ❌❌ |

## Current Implementation

### Session ID Sync (Fixed ✅)

**Problem**: Web-app generated its own session ID, Redis had different one

**Solution**: Extract session ID from JWT token (backend-generated)

```typescript
// Before ❌
sessionId = `sess_${Date.now()}_${random()}`; // Client-generated
sessionStorage.setItem('metropolitan_session_id', sessionId);

// After ✅
sessionId = extractSessionIdFromToken(accessToken); // From JWT
sessionStorage.setItem('metropolitan_session_id', sessionId); // Per-tab, auto-cleared
```

**Flow**:
```
1. User logs in
   ↓
2. Backend creates Redis session → session:sess_xxx
   ↓
3. JWT includes sessionId in payload
   ↓
4. Frontend extracts sessionId from JWT
   ↓
5. Saves to sessionStorage (per-tab)
   ↓
6. Every API request sends X-Session-ID header
   ↓
7. Backend validates against Redis
   ↓
8. On logout: Clear session ID → Redis session expires
```

### Device ID Sync (Already Implemented ✅)

```typescript
// JWT contains deviceId + sessionId
deviceId = extractDeviceIdFromToken(accessToken);
localStorage.setItem('metropolitan_device_id', deviceId);

sessionId = extractSessionIdFromToken(accessToken);
sessionStorage.setItem('metropolitan_session_id', sessionId); // Per-tab

// Every request sends both headers
headers['X-Device-ID'] = deviceId;
headers['X-Session-ID'] = sessionId;

// Backend validates:
// 1. Device ID matches Redis session
// 2. Device ID matches JWT claim
// 3. Session ID matches Redis key
// 4. Session ID matches JWT claim
```

### Logout Flow (Complete ✅)

```typescript
clearAuth() {
  // 1. Clear Zustand store
  set({ user: null, tokens: null });

  // 2. Clear tokenStorage
  await tokenStorage.clearTokens();
  // - Removes access_token
  // - Removes refresh_token
  // - Removes device_id
  // - Removes session_id ✅ NEW

  // 3. Clear storage manually
  localStorage.removeItem('metropolitan-auth-storage');
  sessionStorage.removeItem('metropolitan_session_id'); ✅ NEW (per-tab)

  // 4. Notify backend (blacklist)
  await api.post('/auth/logout');

  // 5. Clear React Query cache
  queryClient.clear();
}
```

## Future: Full SecureStore Migration (Optional)

### Phase 1: Token Encryption (Optional)
```typescript
// Replace tokenStorage with secureStorage
import { secureStorage } from '@/lib/secure-storage';

setTokens(access, refresh) {
  await secureStorage.setItemAsync('access_token', access);
  await secureStorage.setItemAsync('refresh_token', refresh);
}
```

### Phase 2: Zustand Persist with Encryption
```typescript
// Custom storage adapter for Zustand
const secureStorageAdapter = {
  getItem: async (name) => {
    return await secureStorage.getItemAsync(name);
  },
  setItem: async (name, value) => {
    await secureStorage.setItemAsync(name, value);
  },
  removeItem: async (name) => {
    await secureStorage.deleteItemAsync(name);
  },
};

export const useAuthStore = create()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'metropolitan-auth-storage',
      storage: createJSONStorage(() => secureStorageAdapter),
    }
  )
);
```

## Testing

### Browser Console
```javascript
// Test encryption
await secureStorage.setItemAsync('test', 'secret data');

// Check localStorage (should see encrypted string)
localStorage.getItem('secure_test'); 
// → "pQ7xK9zL..." (encrypted, unreadable)

// Retrieve (should decrypt)
await secureStorage.getItemAsync('test');
// → "secret data" (decrypted)
```

### Verify Session ID Sync
```javascript
// 1. Login
// 2. Check console
// → "📋 Session ID synced from token: sess_xxx"

// 3. Check sessionStorage (per-tab)
sessionStorage.getItem('metropolitan_session_id');
// → "sess_fb1d4f69a242369f2170955953c3d697122ec30934bc1dec" ✅

// 4. Check Redis (backend)
// → Key exists: session:sess_fb1d4f69a242369f2170955953c3d697122ec30934bc1dec ✅
```

## Production Checklist

- [x] Session ID extracted from JWT (not client-generated)
- [x] Device ID synced from JWT
- [x] Logout clears all: tokens, device ID, session ID
- [x] API interceptor sends X-Session-ID and X-Device-ID
- [x] Backend validates both against Redis
- [ ] Optional: Migrate to full encrypted storage
- [ ] Optional: Add 2FA for sensitive operations
- [ ] Optional: Implement session management UI

## Conclusion

**Current State**: Production-ready with session/device sync fixes ✅

**Optional Enhancement**: Full SecureStore migration for extra security layer

**Primary Security**: Still relies on CSP headers and XSS prevention (backend + React)

**Recommendation**: Current implementation is sufficient for e-commerce. Consider SecureStore if handling highly sensitive data (medical, financial).
