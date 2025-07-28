# Migration Example: Updating Mobile App to Use Shared Types

This document shows concrete examples of how to update the mobile app to use the newly migrated shared types.

## 1. Error Types Migration

### Before (mobile-app/types/error.types.ts)
```typescript
// Local error types
export interface StructuredError extends Error {
  key?: string;
  params?: Record<string, any>;
  code?: string;
}
```

### After (using shared types)
```typescript
// Import from shared package
import { StructuredError, APIError, isAPIError } from "@metropolitan/shared";

// Use the shared types directly
function handleError(error: unknown) {
  if (isAPIError(error)) {
    // Handle API error
  }
}
```

## 2. Payment Method Types Migration

### Before (mobile-app/context/PaymentMethodContext.tsx)
```typescript
// Local payment method types
export type PaymentMethod = {
  id: string;
  type: string;
  name: string;
  details: string;
  expiry: string;
  isDefault: boolean;
};

export interface PaymentMethodData {
  type: string;
  name: string;
  details: string;
  expiry: string;
}
```

### After
```typescript
import { 
  SavedPaymentMethod, 
  SavedPaymentMethodData 
} from "@metropolitan/shared";

// Update context to use shared types
export interface PaymentMethodContextType {
  paymentMethods: SavedPaymentMethod[];
  loading: boolean;
  error: string | null;
  addPaymentMethod: (method: SavedPaymentMethodData) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<SavedPaymentMethodData>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  refreshPaymentMethods: () => Promise<void>;
}
```

## 3. User Settings Migration

### Before (mobile-app/context/UserSettings.tsx)
```typescript
// Local settings type
export type UserSettings = {
  theme: "light" | "dark";
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationSoundsEnabled: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  hapticsEnabled: true,
  notificationsEnabled: true,
  notificationSoundsEnabled: true,
};
```

### After
```typescript
import { UserSettings, DEFAULT_USER_SETTINGS } from "@metropolitan/shared";

// Map shared settings to mobile format
const getMobileSettings = (settings: UserSettings): MobileSettings => {
  return {
    theme: settings.theme === "system" ? "light" : settings.theme,
    hapticsEnabled: settings.mobile?.hapticsEnabled ?? true,
    notificationsEnabled: settings.mobile?.notificationsEnabled ?? true,
    notificationSoundsEnabled: settings.mobile?.notificationSoundsEnabled ?? true,
  };
};

// Use default settings from shared
const DEFAULT_MOBILE_SETTINGS = getMobileSettings(DEFAULT_USER_SETTINGS);
```

## 4. Cart Response Types Fix

### Before (mobile-app/types/cart.ts)
```typescript
// Loosely typed responses
export type UserCartResponse = {
  items: any[];
  summary: any;
};

export type GuestCartResponse = {
  success: boolean;
  data: {
    items: any[];
    totalAmount: string | number;
    itemCount: number;
    currency: string;
  };
};
```

### After
```typescript
import { CartItem, CartSummary, ApiResponse } from "@metropolitan/shared";

// Properly typed responses
export type CartResponse = ApiResponse<{
  items: CartItem[];
  summary: CartSummary;
}>;

// No need for separate guest/user types - use the same structure
```

## 5. Update API Error Handling

### Before
```typescript
import { StructuredError } from "@/types/error.types";

const createStructuredError = (key: string, params?: any): StructuredError => {
  const error = new Error() as StructuredError;
  error.key = key;
  error.params = params;
  return error;
};
```

### After
```typescript
import { StructuredError, ErrorCode } from "@metropolitan/shared";

const createStructuredError = (key: string, params?: any): StructuredError => {
  const error = new Error() as StructuredError;
  error.key = key;
  error.params = params;
  error.code = ErrorCode.VALIDATION_ERROR; // Use shared error codes
  return error;
};
```

## Migration Checklist

- [ ] Update all imports from local types to `@metropolitan/shared`
- [ ] Rename `PaymentMethod` to `SavedPaymentMethod` throughout the codebase
- [ ] Update cart response types to use proper typing
- [ ] Test type compatibility with backend responses
- [ ] Remove old type definition files after migration
- [ ] Update any type guards or utility functions
- [ ] Run `bun run type-check` to ensure no type errors

## Common Issues and Solutions

### Issue 1: Type mismatch with backend responses
**Solution**: Ensure backend is also using the shared types. May need to coordinate backend updates.

### Issue 2: Missing optional properties
**Solution**: Use TypeScript's optional chaining and nullish coalescing when accessing properties.

### Issue 3: Different property names
**Solution**: Create mapping functions to transform between API responses and shared types if needed.

## Next Steps

1. Start with error types migration (lowest risk)
2. Test thoroughly in development
3. Migrate payment and settings types
4. Update cart types last (may require backend coordination)