# RydeIQ Driver Mobile App

A comprehensive ride-sharing driver application built with React Native and Expo, featuring a unique bidding system that allows drivers to set their own prices and maximize earnings.

## 🚗 Overview

RydeIQ Driver is more than just another ride-sharing app. It's designed to empower independent drivers, taxi operators, and fleet drivers with:

- **Custom Bidding System**: Set your own prices instead of accepting fixed rates
- **Lower Commission**: Keep more of what you earn (10-20% vs industry standard 50-60%)
- **Real-time Competition**: Best bid wins in a fair, transparent system
- **Local Driver Focus**: Support independent and traditional taxi operators
- **Advanced Analytics**: Track performance, earnings, and optimize your driving strategy

## 🎯 Key Features

### Core Differentiator: Bidding System
- **Quick Accept**: One-tap to accept company estimated fare
- **Custom Bidding**: Set your own price with suggested amounts (+$2, +$5, +$10, or custom)
- **Smart Suggestions**: AI-powered optimal bid calculations based on distance, time, and demand
- **Competitive Window**: 45-second bidding period for fair competition
- **Optional Enhancements**: Add messages, service upgrades, or arrival time estimates

### Driver Features
- **Real-time Location Tracking**: High-accuracy GPS with background support
- **Ride Management**: Complete lifecycle from request to completion
- **Multiple Authentication**: Phone, email, Google Sign-In, and biometric options
- **Comprehensive Earnings**: Real-time tracking with instant, daily, or weekly payouts
- **Safety Features**: Emergency button, trip recording, customer verification
- **Offline Capability**: Continue working even with poor connectivity

### Advanced Functionality
- **Push Notifications**: High-priority alerts for ride requests and bid updates
- **Route Optimization**: Traffic-aware navigation with multiple route options
- **Vehicle Integration**: CarPlay and Android Auto support
- **Multi-language Support**: 8 languages with RTL support
- **Gamification**: Achievement system and performance bonuses

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React Native 0.79.5 with Expo 53
- **State Management**: Redux Toolkit with persistence
- **Navigation**: React Navigation 6
- **Maps**: React Native Maps with Google Maps integration
- **Authentication**: Firebase Auth with biometric support
- **Database**: Firebase Firestore with offline persistence
- **Push Notifications**: Expo Notifications with Firebase Cloud Messaging

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (ErrorBoundary, LoadingScreen)
│   ├── driver/         # Driver-specific components
│   ├── maps/           # Map-related components
│   ├── auth/           # Authentication components
│   └── forms/          # Form components
├── screens/            # Screen components
│   ├── auth/           # Login, registration, onboarding
│   ├── driver/         # Driver dashboard, profile
│   ├── rides/          # Ride management screens
│   ├── earnings/       # Earnings and analytics
│   └── settings/       # App settings and preferences
├── services/           # External service integrations
│   ├── api/            # API calls and data fetching
│   ├── firebase/       # Firebase configuration and utilities
│   ├── location/       # GPS and location services
│   └── notifications/  # Push notification handling
├── store/              # Redux store configuration
│   ├── slices/         # Redux slices for different features
│   └── middleware/     # Custom middleware
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # App constants and configuration
└── assets/             # Images, sounds, fonts
```

### State Management (Redux Slices)
- **authSlice**: User authentication and profile management
- **driverSlice**: Driver status, availability, and vehicle information
- **ridesSlice**: Active rides, ride history, and customer information
- **biddingSlice**: Bidding system, active bids, and bid history
- **locationSlice**: GPS tracking and location services
- **earningsSlice**: Revenue tracking, payouts, and analytics
- **notificationSlice**: Push notifications and in-app alerts
- **appSlice**: General app state, settings, and UI management

## 🚀 Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- Expo CLI: `npm install -g @expo/cli`
- Yarn package manager (recommended)
- iOS Simulator (for iOS development) or Android Studio (for Android)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rydeiq-driver
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   ```

4. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication, Firestore, Storage, and Cloud Messaging
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Place them in the root directory

5. **Configure Google Maps**
   - Enable required APIs in Google Cloud Console:
     - Maps SDK for Android
     - Maps SDK for iOS
     - Directions API
     - Distance Matrix API
     - Geocoding API
     - Places API
   - Add API keys to `app.json`

6. **Start the development server**
   ```bash
   yarn start
   ```

### Running on Devices

**iOS:**
```bash
yarn ios
```

**Android:**
```bash
yarn android
```

**Web (for testing):**
```bash
yarn web
```

## 📱 App Configuration

### Required Permissions
- **Location**: Foreground and background location access
- **Camera**: Customer verification and document upload
- **Notifications**: Push notifications for ride requests
- **Microphone**: Emergency calling and voice commands
- **Storage**: Photo and document storage

### Firebase Configuration
Update `app.json` with your Firebase configuration:
```json
{
  "extra": {
    "firebaseConfig": {
      "apiKey": "your-api-key",
      "authDomain": "your-project.firebaseapp.com",
      "projectId": "your-project-id",
      "storageBucket": "your-project.appspot.com",
      "messagingSenderId": "your-sender-id",
      "appId": "your-app-id"
    }
  }
}
```

## 🔧 Development

### Code Style
- **Language**: JavaScript (ES6+)
- **Formatting**: ESLint with Expo configuration
- **File Naming**: kebab-case for files, PascalCase for components
- **Function Style**: Functional components with hooks

### Key Development Patterns
- **Modular Architecture**: Separate concerns into services, components, and utilities
- **Redux Best Practices**: Use Redux Toolkit slices with proper selectors
- **Error Handling**: Comprehensive error boundaries and graceful fallbacks
- **Performance**: Optimized re-renders and lazy loading
- **Type Safety**: JSDoc comments for better IDE support

### Testing
```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run linting
yarn lint

# Fix linting issues
yarn lint:fix
```

## 🔄 Key Workflows

### Ride Request Flow
1. Driver receives push notification for new ride request
2. Driver views ride details (pickup, destination, customer info, company bid)
3. Driver chooses to quick accept or submit custom bid
4. If bid is accepted, driver navigates to pickup location
5. Real-time tracking and status updates throughout ride
6. Trip completion and payment processing

### Bidding System
1. Calculate optimal bid based on distance, duration, demand, and driver rating
2. Present quick options (+$2, +$5, +$10) or custom amount
3. Optional message and service enhancements
4. Submit bid within 45-second window
5. Real-time bid status updates

### Earnings Management
1. Real-time earnings tracking per ride
2. Daily, weekly, and monthly goal tracking
3. Performance analytics and insights
4. Multiple payout options (instant, daily, weekly)
5. Tax reporting and earnings history

## 📊 Performance Optimizations

- **Redux Persist**: Selective state persistence for offline capability
- **Image Optimization**: Compressed assets and lazy loading
- **Network Efficiency**: Request batching and caching strategies
- **Background Processing**: Location tracking with minimal battery impact
- **Memory Management**: Proper cleanup and limited data retention

## 🔒 Security Features

- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Biometric Authentication**: Face ID, Touch ID, and fingerprint support
- **Session Management**: Secure token handling and automatic logout
- **Privacy Protection**: Minimal data collection and automatic cleanup
- **Emergency Features**: Panic button and real-time location sharing

## 🌍 Localization

Supported languages:
- English
- Spanish
- French
- Portuguese
- Chinese
- Arabic (RTL)
- Hindi
- Russian

## 📈 Analytics & Monitoring

- **Performance Tracking**: App launch times, render performance, memory usage
- **Error Reporting**: Comprehensive error boundaries and crash reporting
- **User Analytics**: Feature usage and driver behavior insights
- **Business Metrics**: Bid acceptance rates, earnings per hour, customer satisfaction

## 🚀 Deployment

### Building for Production

**iOS:**
```bash
expo build:ios --release-channel production
```

**Android:**
```bash
expo build:android --release-channel production
```

### App Store Requirements
- Privacy policy and terms of service
- App store screenshots and metadata
- Background location usage description
- Camera and microphone usage descriptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow the established code style and architecture patterns
- Add comprehensive error handling for new features
- Include JSDoc comments for complex functions
- Test on both iOS and Android platforms
- Update documentation for new features

## 📋 Roadmap

### Phase 1: Core MVP ✅
- [x] Basic app structure and navigation
- [x] Redux store with all slices
- [x] Firebase integration
- [x] Location services setup
- [x] Push notifications configuration

### Phase 2: Authentication & Onboarding
- [ ] Phone number authentication
- [ ] Driver registration and verification
- [ ] Document upload and review
- [ ] Onboarding tutorial

### Phase 3: Bidding System
- [ ] Ride request notifications
- [ ] Bidding interface and logic
- [ ] Real-time bid updates
- [ ] Optimal bid calculations

### Phase 4: Ride Management
- [ ] Active ride interface
- [ ] Navigation integration
- [ ] Customer communication
- [ ] Trip completion flow

### Phase 5: Advanced Features
- [ ] Earnings analytics dashboard
- [ ] Performance optimization
- [ ] Vehicle integration (CarPlay/Android Auto)
- [ ] Advanced safety features

## 📞 Support

For technical support or questions:
- Email: support@rydeiq.com
- Documentation: [docs.rydeiq.com](https://docs.rydeiq.com)
- Issues: Use GitHub Issues for bug reports and feature requests

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ for drivers, by drivers**

*RydeIQ - Empowering drivers to earn more, work smarter, and build sustainable businesses in the gig economy.* #   r y d e i q d r i v e r  
 