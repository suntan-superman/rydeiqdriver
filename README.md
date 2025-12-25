# 🚗 RydeIQ Driver App

[![React Native](https://img.shields.io/badge/React_Native-0.79.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_53-000020?logo=expo)](https://expo.dev/)
[![React Query](https://img.shields.io/badge/React_Query-5.90-FF4154?logo=react-query)](https://tanstack.com/query)

Mobile app for drivers to receive ride requests, submit bids, navigate, and track earnings.

---

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Create environment file
cp .env.example .env
# Edit .env with your credentials

# Start development server
yarn start
```

Scan QR code with Expo Go app.

---

## 📚 Documentation

- **[Complete Documentation](../docs/apps/driver/README.md)** - Full driver app guide
- **[Setup Guide](../docs/apps/driver/setup.md)** - Detailed setup instructions
- **[Hooks API](../docs/apps/driver/hooks.md)** - React Query hooks reference
- **[Components API](../docs/apps/driver/components.md)** - Component reference
- **[Deployment Guide](../docs/apps/driver/deployment.md)** - EAS build & app store submission

---

## ✨ Features

- ✅ Receive ride requests with push notifications
- ✅ Submit competitive bids
- ✅ GPS navigation with turn-by-turn directions
- ✅ Earnings tracking and analytics
- ✅ Video recording capability (optional)
- ✅ Voice commands (hands-free operation)
- ✅ Safety features (emergency SOS, PIN verification)
- ✅ Multi-language support (i18n)
- ✅ Offline-capable with background location tracking

---

## 🏗️ Tech Stack

- **React Native 0.79.5** - Mobile framework
- **Expo SDK 53** - Development platform
- **React Query 5.x** - Server state management (migrated from Redux)
- **React Navigation 6.x** - Navigation
- **Firebase 11.10** - Backend (Auth, Firestore, FCM)
- **Google Maps** - Navigation & routing
- **expo-location** - Background location tracking

---

## 📂 Project Structure

```
src/
├── components/      # UI components (40+)
├── screens/        # Screen components (12+)
├── services/       # Business logic (25+)
├── hooks/          # React Query hooks (60+)
├── store/          # Redux (deprecated, use hooks)
├── navigation/     # Navigation configuration
├── constants/      # Config and constants
├── contexts/       # React Context providers
└── utils/          # Utility functions
```

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start Expo dev server |
| `yarn android` | Run on Android emulator |
| `yarn ios` | Run on iOS simulator (Mac only) |
| `yarn build:android` | Build APK/AAB via EAS |
| `yarn build:ios` | Build IPA via EAS |
| `yarn test` | Run tests (78% coverage) |
| `yarn lint` | Run ESLint |

---

## 🔐 Environment Variables

Required in `.env`:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_API_BASE_URL=...
```

See [Environment Variables Reference](../docs/reference/environment-variables.md).

---

## 🚢 Deployment

### Build with EAS

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Both
eas build --platform all --profile production
```

### Submit to App Stores

```bash
# Google Play
eas submit --platform android

# App Store
eas submit --platform ios
```

See [Deployment Guide](../docs/deployment/mobile-deployment.md).

---

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run with coverage
yarn test --coverage

# Current coverage: 78% ✅
```

**Test Files:**
- 13 hook test files (650+ unit tests)
- 5 component test files (50+ integration tests)
- Total: 112+ tests

---

## 🎯 Key Features

### Bidding System
- Receive ride requests via push notifications
- Submit custom bids or use auto-bid rules
- View estimated costs and earnings
- Accept/reject rides

### Navigation
- GPS turn-by-turn directions
- Multiple map providers (Google Maps, Waze, Apple Maps)
- Traffic alerts and real-time updates
- Multi-stop route optimization

### Earnings
- Real-time earnings tracking
- Daily/weekly/monthly analytics
- Best time and zone insights
- Payout management (instant, daily, weekly)

### Safety
- Emergency SOS button
- Location sharing with emergency contacts
- Video recording (optional with rider consent)
- PIN verification for rider identity

### Voice Commands
- Hands-free operation
- Accept/reject rides by voice
- Navigate to destination
- Multi-language support

---

## 🆘 Need Help?

- **Docs:** [Complete Documentation](../docs/apps/driver/)
- **Troubleshooting:** [Common Issues](../docs/apps/driver/troubleshooting.md)
- **Slack:** #rydeiq-driver

---

## 📊 Project Status

- **Version:** 1.0.0
- **Status:** ✅ Production Ready
- **Test Coverage:** 78% ✅
- **React Query Migration:** ✅ Complete
- **Last Updated:** October 28, 2025

---

## 🔄 Recent Updates

- ✅ **October 2025:** Migrated from Redux to React Query
- ✅ **October 2025:** Achieved 78% test coverage
- ✅ **October 2025:** Production deployment ready
- ✅ Video recording feature completed
- ✅ Reliability scoring system implemented

---

**For detailed documentation, see [/docs/apps/driver/](../docs/apps/driver/)**
