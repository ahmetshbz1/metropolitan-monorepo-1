# 🔧 Environment Setup Guide

## 📁 Environment Files Structure

```
packages/mobile-app/
├── .env                    # Default environment (committed to git)
├── .env.development       # Development environment (committed to git)
├── .env.production        # Production environment (committed to git)
└── .env.local            # Local overrides (NOT committed to git)
```

## 🚀 Quick Setup

### For Development:
1. Copy `.env.local` as your local development file
2. Update `EXPO_PUBLIC_API_BASE_URL` with your local IP:
```bash
# Find your IP
ifconfig | grep "inet " | grep -Fv 127.0.0.1

# Update .env.local
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:3000
```

### For Production:
1. Update `.env.production` with:
   - Production Stripe keys
   - Production API URL
   - Production settings

## 🔐 Environment Variables

### Required Variables:

#### `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Development:** Test key (pk_test_...)
- **Production:** Live key (pk_live_...)

#### `EXPO_PUBLIC_API_BASE_URL`
- **Development:** `http://YOUR_LOCAL_IP:3000`
- **Production:** `https://api.metropolitan.app`

## 🛠️ Usage

### Development Build:
```bash
# Uses .env.development by default
bun run start

# Or explicitly use local overrides
cp .env.local .env
bun run start
```

### Production Build:
```bash
# Copy production environment
cp .env.production .env

# Build for production
bun run build:ios
```

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Update production keys** before App Store submission
3. **Test both environments** before deployment
4. **Use HTTPS in production** - HTTP will be blocked by ATS

## 🔄 Environment Priority

Expo loads environment variables in this order:
1. `.env.local` (highest priority, not committed)
2. `.env.development` or `.env.production`
3. `.env` (lowest priority, fallback)

## 🚨 Security Checklist

- [ ] Production Stripe keys are live keys
- [ ] API URLs use HTTPS in production
- [ ] No hardcoded IPs in production files
- [ ] `.env.local` is in `.gitignore`
- [ ] Test keys removed from production build

## 📞 Need Help?

If you encounter issues:
1. Check your network configuration
2. Verify API server is running
3. Ensure correct IP address in `.env.local`
4. Test with `curl http://YOUR_IP:3000/api/health`