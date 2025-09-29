# State Management - Web App

Web uygulamasında **TanStack Query** ve **Zustand** kullanarak modern state management yapısı kurulmuştur.

## 📦 Kullanılan Teknolojiler

- **TanStack Query (React Query)**: Server state ve API çağrıları
- **Zustand**: Client state (auth, cart, favorites)
- **React Query DevTools**: Development sırasında query debugging

## 🗂️ Dosya Yapısı

```
src/
├── stores/                  # Zustand stores
│   ├── auth-store.ts       # Authentication state
│   ├── cart-store.ts       # Shopping cart state
│   ├── favorites-store.ts  # Favorites state
│   └── index.ts            # Export tüm stores
│
├── services/api/           # API service katmanı
│   ├── auth-api.ts         # Auth endpoints
│   ├── products-api.ts     # Product endpoints
│   ├── cart-api.ts         # Cart endpoints
│   ├── favorites-api.ts    # Favorites endpoints
│   ├── orders-api.ts       # Order endpoints
│   └── index.ts            # Export tüm services
│
├── hooks/api/              # TanStack Query hooks
│   ├── use-auth-actions.ts # Auth mutations
│   ├── use-google-auth.ts  # Google sign-in
│   ├── use-user.ts         # User queries
│   ├── use-products.ts     # Product queries
│   ├── use-categories.ts   # Category queries
│   ├── use-cart.ts         # Cart queries/mutations
│   ├── use-favorites.ts    # Favorites queries/mutations
│   ├── use-orders.ts       # Order queries/mutations
│   └── index.ts            # Export tüm hooks
│
└── components/providers/
    └── QueryProvider.tsx   # TanStack Query provider
```

## 🚀 Kullanım Örnekleri

### 1. Products (Server State)

```tsx
import { useProducts, useProduct } from '@/hooks/api';

function ProductsPage() {
  // Tüm ürünleri getir (auto-caching, auto-refetch)
  const { data: products, isLoading, error } = useProducts();
  
  // Kategoriye göre filtrele
  const { data: dairy } = useProducts({ category: 'dairy' });
  
  // Tek ürün getir
  const { data: product } = useProduct(productId);
  
  return <div>...</div>;
}
```

### 2. Categories (Server State)

```tsx
import { useCategories } from '@/hooks/api';

function CategoriesMenu() {
  const { data: categories, isLoading } = useCategories();
  
  return <nav>...</nav>;
}
```

### 3. Cart (Server + Client State)

```tsx
import { useCart, useAddToCart, useRemoveFromCart } from '@/hooks/api';
import { useCartStore } from '@/stores';

function CartPage() {
  // Server'dan cart getir (auto-sync)
  const { data: cartItems } = useCart();
  
  // Local cart state (persist)
  const { getTotalItems, getTotalPrice } = useCartStore();
  
  // Mutations
  const addToCart = useAddToCart();
  const removeFromCart = useRemoveFromCart();
  
  const handleAdd = () => {
    addToCart.mutate({ productId: '123', quantity: 1 });
  };
  
  return <div>...</div>;
}
```

### 4. Auth (Client State + Server Mutations)

```tsx
import { 
  useSendOTP, 
  useVerifyOTP, 
  useLogout,
  useCurrentUser 
} from '@/hooks/api';
import { useAuthStore } from '@/stores';

function LoginPage() {
  // Local auth state
  const { user, isAuthenticated } = useAuthStore();
  
  // Server'dan user getir
  const { data: currentUser } = useCurrentUser();
  
  // Auth mutations
  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();
  const logout = useLogout();
  
  const handleLogin = async () => {
    const result = await sendOTP.mutateAsync({
      phoneNumber: '+48123456789',
      userType: 'individual'
    });
    
    if (result.success) {
      // OTP gönderildi
    }
  };
  
  return <div>...</div>;
}
```

### 5. Favorites (Server + Client State)

```tsx
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/hooks/api';
import { useFavoritesStore } from '@/stores';

function FavoritesButton({ productId }: { productId: string }) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  
  const handleToggle = () => {
    if (isFavorite(productId)) {
      removeFavorite.mutate(productId);
    } else {
      addFavorite.mutate(productId);
    }
  };
  
  return <button onClick={handleToggle}>❤️</button>;
}
```

### 6. Orders (Server State)

```tsx
import { useOrders, useOrder, useCreateOrder } from '@/hooks/api';

function OrdersPage() {
  // Tüm siparişleri getir
  const { data: orders } = useOrders();
  
  // Tek sipariş detayı
  const { data: order } = useOrder(orderId);
  
  // Yeni sipariş oluştur
  const createOrder = useCreateOrder();
  
  const handleCheckout = async () => {
    const order = await createOrder.mutateAsync({
      addressId: 'addr_123',
      paymentMethod: 'card',
    });
    
    // Order oluşturuldu, ödeme sayfasına yönlendir
  };
  
  return <div>...</div>;
}
```

## 🎯 Avantajlar

### TanStack Query
- ✅ Automatic caching (5 dakika default)
- ✅ Automatic refetching (stale queries)
- ✅ Request deduplication (aynı anda 10 istek = 1 API çağrısı)
- ✅ Optimistic updates (UI anında güncellenir)
- ✅ Error handling ve retry logic
- ✅ Loading states (isLoading, isFetching)
- ✅ DevTools support

### Zustand
- ✅ Simple API (Redux'tan 10x daha az boilerplate)
- ✅ Automatic persistence (localStorage)
- ✅ No providers (kullanmak için wrap gerekmez)
- ✅ TypeScript support
- ✅ Computed values (getTotalItems, getTotalPrice)

## 📝 Kurallar

1. **Server state için TanStack Query kullan**
   - Products, Orders, User gibi backend'den gelen data
   
2. **Client state için Zustand kullan**
   - Auth tokens, Cart items, Favorites
   
3. **Dosya boyutu max 150 satır**
   - Her dosya tek bir sorumluluğa sahip
   - Büyük dosyalar bölünmüş
   
4. **API service katmanı kullan**
   - Hooks doğrudan axios çağırmaz
   - Services klasöründe API endpoint'leri tanımlı
   
5. **Query keys standardize et**
   - Her hook kendi key factory'sine sahip
   - Örnek: `productKeys.detail(id)`

## 🔄 Migration Notları

### Eski Context API'den Migration

**Önce:**
```tsx
import { useProducts } from '@/context/ProductContext';

const { products, loadingProducts } = useProducts();
```

**Sonra:**
```tsx
import { useProducts } from '@/hooks/api';

const { data: products, isLoading } = useProducts();
```

### Eski Auth Context'den Migration

**Önce:**
```tsx
import { useAuth } from '@/context/AuthContext';

const { user, sendOTP, logout } = useAuth();
```

**Sonra:**
```tsx
import { useSendOTP, useLogout } from '@/hooks/api';
import { useAuthStore } from '@/stores';

const { user } = useAuthStore();
const sendOTP = useSendOTP();
const logout = useLogout();
```

## 🛠️ Development

React Query DevTools aktif (development mode):
- Sağ alt köşede floating button
- Query inspector
- Mutation tracker
- Cache explorer

## 📚 Dökümantasyon

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
