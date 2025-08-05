# MTA Bus Tracker - Deployment Guide

## 🚀 Production Deployment Steps

### 1. Environment Variables Setup

#### For EAS Build (Mobile App)
1. Copy `.env.example` to `.env` and fill in your actual values
2. Set production environment variables in EAS:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_MTA_API_KEY --value "your_production_mta_api_key"
   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "your_production_firebase_api_key"
   eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "your_production_project_id"
   # ... add all other Firebase config variables
   ```

#### For Backend Deployment
1. Set environment variables in your hosting platform (Vercel, Railway, etc.):
   - `MTA_API_KEY`
   - `NODE_ENV=production`
   - `PORT=8080`

### 2. Firebase Security Rules

✅ **COMPLETED**: Firestore rules have been updated to require authentication

**Deploy the new rules:**
```bash
firebase deploy --only firestore:rules
```

### 3. Backend Infrastructure

#### Option A: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Set environment variables in Vercel dashboard

#### Option B: Deploy to Railway
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

#### Option C: Use Firebase Functions (Recommended)
1. Update `functions/index.js` to include MTA API proxy
2. Deploy: `firebase deploy --only functions`

### 4. Mobile App Deployment

#### Development Build
```bash
eas build --profile development --platform all
```

#### Production Build
```bash
eas build --profile production --platform all
```

#### Submit to App Stores
```bash
eas submit --profile production --platform all
```

### 5. Security Checklist

- ✅ API keys moved to environment variables
- ✅ Firestore rules require authentication
- ✅ Production environment configuration
- ⚠️ **TODO**: Set up production API endpoints
- ⚠️ **TODO**: Configure CORS for production domains
- ⚠️ **TODO**: Set up monitoring and logging

### 6. Testing Production Build

1. **Test Firebase Rules:**
   ```bash
   firebase emulators:start --only firestore
   # Test with authenticated and unauthenticated users
   ```

2. **Test Production Build:**
   ```bash
   eas build --profile preview --platform ios
   # Install and test on device
   ```

### 7. Environment Variables Reference

#### Required for Mobile App (EXPO_PUBLIC_*):
- `EXPO_PUBLIC_MTA_API_KEY`
- `EXPO_PUBLIC_MTA_BASE_URL`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `EXPO_PUBLIC_PRODUCTION_API_URL`

#### Required for Backend:
- `MTA_API_KEY`
- `NODE_ENV`
- `PORT`

### 8. Post-Deployment

1. **Monitor logs** for any errors
2. **Test push notifications** with production build
3. **Verify API endpoints** are working
4. **Check Firestore security** with real users

## 🔧 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| API Keys | Hardcoded (fallback) | Environment variables |
| Firestore Rules | Open (expired) | Authentication required |
| API Endpoints | localhost:3000 | Production URL |
| Error Handling | Console logs | Proper logging service |
| CORS | Allow all | Specific domains |

## 📱 Next Steps

1. Set up production Firebase project (optional)
2. Deploy backend to cloud provider
3. Configure production environment variables
4. Test with production builds
5. Submit to app stores

## 🆘 Troubleshooting

- **Build fails**: Check environment variables are set correctly
- **API not working**: Verify production API URL and CORS settings
- **Auth issues**: Check Firebase configuration and rules
- **Push notifications**: Ensure development client is properly configured