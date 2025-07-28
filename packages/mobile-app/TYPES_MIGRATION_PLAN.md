# Types Migration Plan: Mobile App → Shared Package

## Executive Summary

This document outlines the migration plan for moving appropriate types from the mobile-app package to the shared package to improve type consistency across the monorepo.

## Current State Analysis

### Shared Package Structure
```
packages/shared/types/
├── address.ts      # Address-related types
├── cart.ts         # Cart, CartItem, CartSummary
├── checkout.ts     # Checkout flow types
├── misc.ts         # ApiResponse, NIP, logging
├── notification.ts # Notification types
├── order.ts        # Order-related types
├── payment.ts      # Stripe payment types
├── product.ts      # Product catalog types
└── user.ts         # User, profile, company types
```

### Types to Migrate

#### 1. **Error Types** (HIGH PRIORITY)
**Location**: `mobile-app/types/error.types.ts`
**Target**: `shared/types/error.ts` (new file)
**Types**:
- `StructuredError` - Structured error with key, params, code
- `APIError` - Axios error with typed response
- `APIErrorPayload` - Error response payload

**Rationale**: These represent API communication structures used by both backend and frontend for consistent error handling.

#### 2. **Saved Payment Method Types** (HIGH PRIORITY)
**Location**: `mobile-app/context/PaymentMethodContext.tsx`
**Target**: `shared/types/payment.ts` (append to existing)
**Types**:
- `PaymentMethod` → rename to `SavedPaymentMethod`
- `PaymentMethodData` → rename to `SavedPaymentMethodData`

**Rationale**: Backend already has `/me/payment-methods` endpoints. These types represent core business entities.

#### 3. **User Settings Types** (MEDIUM PRIORITY)
**Location**: `mobile-app/context/UserSettings.tsx`
**Target**: `shared/types/settings.ts` (new file)
**Types**:
- `UserSettings` - User preferences (theme, notifications, haptics)

**Rationale**: User preferences need to be persisted on the backend and synced across devices.

### Types to Keep Local

#### 1. **Context Types**
- `AuthContextType`
- `CartContextType`
- `PaymentMethodContextType`
- All other React Context types

**Rationale**: These are React-specific and contain functions, state setters, and other UI concerns.

#### 2. **Component Props**
- `NotificationItemProps`
- `NotificationActionButtonsProps`
- All other component prop types

**Rationale**: UI-specific, only used for React component interfaces.

#### 3. **Mobile-Extended Types**
- `MobileUser` (extends base User with mobile-specific fields)
- `CompleteProfileInput` (just an alias)

**Rationale**: Mobile-specific extensions that may not apply to web or other clients.

### Types to Refactor

#### 1. **Cart Response Types**
**Current**:
```typescript
type UserCartResponse = {
  items: any[];
  summary: any;
};
```

**Action**: Delete these types and use properly typed shared types:
```typescript
import { CartItem, CartSummary } from "@metropolitan/shared";

interface CartResponse {
  items: CartItem[];
  summary: CartSummary;
}
```

## Migration Phases

### Phase 1: Create New Shared Types (Week 1)

1. **Create `shared/types/error.ts`**
   ```typescript
   export interface StructuredError extends Error {
     key?: string;
     params?: Record<string, any>;
     code?: string;
   }

   export interface APIErrorPayload {
     key?: string;
     params?: Record<string, any>;
     message?: string;
   }

   export interface APIError {
     response?: {
       data?: APIErrorPayload;
       status?: number;
     };
     message: string;
     code?: string;
   }
   ```

2. **Update `shared/types/payment.ts`**
   ```typescript
   // Add to existing file
   export interface SavedPaymentMethod {
     id: string;
     type: string;
     name: string;
     details: string;
     expiry: string;
     isDefault: boolean;
   }

   export interface SavedPaymentMethodData {
     type: string;
     name: string;
     details: string;
     expiry: string;
   }
   ```

3. **Create `shared/types/settings.ts`**
   ```typescript
   export interface UserSettings {
     theme: "light" | "dark";
     hapticsEnabled: boolean;
     notificationsEnabled: boolean;
     notificationSoundsEnabled: boolean;
   }
   ```

### Phase 2: Update Mobile App Imports (Week 2)

1. **Update error handling**
   ```typescript
   // Before
   import { StructuredError, APIError } from "@/types/error.types";
   
   // After
   import { StructuredError, APIError } from "@metropolitan/shared";
   ```

2. **Update payment method types**
   ```typescript
   // Before
   export type PaymentMethod = {...}
   
   // After
   import { SavedPaymentMethod, SavedPaymentMethodData } from "@metropolitan/shared";
   ```

3. **Update user settings**
   ```typescript
   // Before
   export type UserSettings = {...}
   
   // After
   import { UserSettings } from "@metropolitan/shared";
   ```

### Phase 3: Backend Integration (Week 3)

1. **Update backend to use shared error types**
2. **Ensure payment method endpoints align with shared types**
3. **Add user settings endpoints if not present**

### Phase 4: Cleanup (Week 4)

1. **Remove migrated types from mobile-app**
2. **Update all imports**
3. **Run type checking across monorepo**
4. **Update documentation**

## Type Organization Guidelines

### What Belongs in Shared

1. **Business Entities**: Core domain objects (User, Product, Order)
2. **API Contracts**: Request/response types, error structures
3. **Shared Constants**: Status enums, error codes
4. **Cross-Platform Data**: Settings, preferences, configurations

### What Stays Local

1. **UI Types**: Component props, style types
2. **Framework Types**: React contexts, hooks, navigation
3. **Platform Extensions**: Mobile-specific or web-specific additions
4. **Internal State**: Local state management types

## Backwards Compatibility

- All migrations will be done additively first
- Old types will be deprecated with warnings
- Final removal only after all consumers updated
- Version bumps for breaking changes

## Testing Strategy

1. **Type Tests**: Ensure all types compile correctly
2. **Integration Tests**: Verify API contracts still work
3. **Runtime Tests**: Check serialization/deserialization
4. **Cross-Package Tests**: Validate monorepo builds

## Success Metrics

- Zero type errors after migration
- Reduced code duplication
- Improved IDE autocomplete
- Easier cross-team collaboration
- Consistent API contracts

## Rollback Plan

If issues arise:
1. Revert shared package changes
2. Re-export from local types temporarily
3. Fix issues in isolation
4. Re-attempt migration

## Next Steps

1. Review and approve this plan
2. Create tracking tickets for each phase
3. Assign team members to tasks
4. Begin Phase 1 implementation