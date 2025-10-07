# Installation Guide

## Prerequisites

### System Requirements

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher (or Yarn 1.22+)
- **Expo CLI**: Latest version
- **Git**: For version control

### Development Environment

#### macOS
- **Xcode**: Version 14+ (for iOS development)
- **iOS Simulator**: Latest version
- **Android Studio**: Latest version (for Android development)

#### Windows
- **Android Studio**: Latest version
- **Visual Studio**: With C++ build tools (for native dependencies)

#### Linux
- **Android Studio**: Latest version
- **Node.js**: Version 18+

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd rydeIQDriver
```

### 2. Install Dependencies

**Using Yarn (Recommended)**:
```bash
yarn install
```

**Using npm**:
```bash
npm install
```

### 3. Install Expo CLI

```bash
# Global installation
npm install -g @expo/cli

# Or using yarn
yarn global add @expo/cli
```

### 4. Install Development Tools

#### iOS Development (macOS only)
```bash
# Install Xcode from Mac App Store
# Install iOS Simulator through Xcode

# Install CocoaPods for iOS dependencies
sudo gem install cocoapods
```

#### Android Development
```bash
# Install Android Studio from https://developer.android.com/studio
# Set up Android SDK and emulator through Android Studio

# Add Android SDK to PATH (Linux/macOS)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 5. Configure Environment

Create environment file:
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Google Maps API Keys
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=your_android_key_here
EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=your_ios_key_here
EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=your_web_key_here

# Fuel Price API Keys
EXPO_PUBLIC_EIA_API_KEY=your_eia_key_here
EXPO_PUBLIC_GASBUDDY_API_KEY=your_gasbuddy_key_here

# Analytics (Optional)
EXPO_PUBLIC_MIXPANEL_KEY=your_mixpanel_key_here
EXPO_PUBLIC_AMPLITUDE_KEY=your_amplitude_key_here

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `rydeiq-driver`
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firebase Services

#### Authentication
1. Go to **Authentication** > **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (optional)
4. Configure authorized domains

#### Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location close to your users

#### Cloud Messaging
1. Go to **Cloud Messaging**
2. No additional setup required for basic functionality

#### Cloud Storage (Optional)
1. Go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**

### 3. Download Configuration Files

#### Android Configuration
1. Go to **Project Settings** > **General**
2. Add Android app:
   - Package name: `com.rydeiq.driver`
   - App nickname: `RydeIQ Driver Android`
3. Download `google-services.json`
4. Place file in project root

#### iOS Configuration
1. Add iOS app:
   - Bundle ID: `com.rydeiq.driver`
   - App nickname: `RydeIQ Driver iOS`
2. Download `GoogleService-Info.plist`
3. Place file in project root

### 4. Configure Firebase Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Driver applications - drivers can only access their own data
    match /driverApplications/{driverId} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Ride requests - drivers can read requests they're eligible for
    match /rideRequests/{requestId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.availableDrivers;
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.availableDrivers;
    }
    
    // Earnings - drivers can only access their own earnings
    match /earnings/{earningId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.driverId;
    }
    
    // Trip history - drivers can only access their own trips
    match /tripHistory/{tripId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.driverId;
    }
    
    // Notifications - drivers can only access their own notifications
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.driverId;
    }
  }
}
```

## Google Maps API Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable billing (required for Maps API)

### 2. Enable Required APIs

Enable the following APIs:
- Maps SDK for Android
- Maps SDK for iOS
- Directions API
- Distance Matrix API
- Geocoding API
- Places API
- Roads API (optional)

### 3. Create API Keys

#### Android API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Restrict the key:
   - Application restrictions: **Android apps**
   - Package name: `com.rydeiq.driver`
   - SHA-1 certificate fingerprint: Get from your keystore

#### iOS API Key
1. Create another API key
2. Restrict the key:
   - Application restrictions: **iOS apps**
   - Bundle identifier: `com.rydeiq.driver`

#### Web API Key (for development)
1. Create another API Key
2. Restrict the key:
   - Application restrictions: **HTTP referrers**
   - Website restrictions: Add your development domains

### 4. Configure API Key Restrictions

For production, restrict API keys to:
- **Android**: Package name + SHA-1 fingerprint
- **iOS**: Bundle identifier
- **Web**: Specific domains

## Development Setup

### 1. Start Development Server

```bash
# Start Expo development server
yarn start

# Or using npm
npm start
```

### 2. Run on Simulator/Device

#### iOS Simulator
```bash
yarn ios
```

#### Android Emulator
```bash
yarn android
```

#### Physical Device
1. Install **Expo Go** app on your device
2. Scan QR code from terminal
3. App will load on device

### 3. Web Development (Testing)
```bash
yarn web
```

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
# Clear Metro cache
yarn start --clear

# Reset Metro cache completely
npx react-native start --reset-cache
```

#### 2. Node Modules Issues
```bash
# Clean install
rm -rf node_modules
rm yarn.lock  # or package-lock.json
yarn install  # or npm install
```

#### 3. iOS Build Issues
```bash
# Clean iOS build
cd ios
rm -rf build
cd ..
yarn ios
```

#### 4. Android Build Issues
```bash
# Clean Android build
cd android
./gradlew clean
cd ..
yarn android
```

#### 5. Firebase Connection Issues
- Verify `google-services.json` and `GoogleService-Info.plist` are in project root
- Check Firebase project configuration
- Ensure internet connection
- Verify API keys are correct

#### 6. Google Maps Issues
- Verify API keys are correct
- Check API restrictions
- Ensure billing is enabled
- Verify required APIs are enabled

### Environment-Specific Issues

#### macOS Issues
```bash
# Fix CocoaPods issues
cd ios
pod deintegrate
pod install
cd ..
```

#### Windows Issues
```bash
# Fix Android SDK issues
# Ensure ANDROID_HOME is set correctly
# Install Visual Studio C++ build tools
```

#### Linux Issues
```bash
# Fix permission issues
sudo chown -R $USER:$USER node_modules
sudo chown -R $USER:$USER .expo
```

## Verification

### 1. Check Installation

```bash
# Check Node.js version
node --version  # Should be 18+

# Check npm version
npm --version  # Should be 8+

# Check Expo CLI
expo --version

# Check Yarn version (if using)
yarn --version  # Should be 1.22+
```

### 2. Test Firebase Connection

1. Start the app: `yarn start`
2. Try to sign up with a test email
3. Check Firebase Console for new user
4. Verify Firestore rules are working

### 3. Test Google Maps

1. Open the app on device/simulator
2. Navigate to a screen with maps
3. Verify maps load correctly
4. Test location services

### 4. Test Push Notifications

1. Enable notifications in device settings
2. Sign in to the app
3. Send test notification from Firebase Console
4. Verify notification appears

## Next Steps

After successful installation:

1. **Configure API Keys**: Add your actual API keys to `.env`
2. **Set up Firebase**: Configure production Firebase project
3. **Test Features**: Verify all core features work
4. **Read Documentation**: Review [Configuration Guide](./configuration.md)
5. **Start Development**: Follow [Development Workflow](./development.md)

## Support

If you encounter issues:

1. **Check Logs**: Look for error messages in terminal
2. **Review Documentation**: Check relevant documentation sections
3. **Search Issues**: Look for similar issues in GitHub
4. **Create Issue**: Submit detailed bug report if needed

---

**Next**: [Configuration Guide](./configuration.md) - API keys, environment variables, and settings
