# RydeIQ Driver App Source Code

## Overview

This directory contains the source code for the RydeIQ Driver mobile application - a React Native app built with Expo featuring an advanced bidding system for ride-sharing services.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   ├── driver/         # Driver-specific components
│   ├── forms/          # Form components
│   └── maps/           # Map-related components
├── constants/          # App constants and configuration
├── contexts/           # React contexts for global state
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── dashboard/     # Dashboard screens
│   ├── driver/        # Driver-specific screens
│   ├── earnings/      # Earnings screens
│   ├── profile/       # Profile screens
│   ├── ride/          # Ride-related screens
│   ├── settings/      # Settings screens
│   └── support/       # Support screens
├── services/           # External service integrations
│   ├── api/           # API services
│   ├── firebase/      # Firebase configuration
│   ├── location/      # Location services
│   └── notifications/ # Push notification services
├── store/              # Redux store configuration
│   ├── slices/        # Redux slices
│   └── middleware/    # Custom middleware
└── utils/              # Utility functions
```

## Key Features

### Core Functionality
- **Advanced Bidding System**: Drivers set custom prices instead of accepting fixed rates
- **Real-time Location Tracking**: GPS tracking with background support
- **Firebase Integration**: Authentication, database, and push notifications
- **Google Maps Integration**: Navigation and location services
- **Fuel Cost Estimation**: AI-powered fuel cost calculations

### Technical Highlights
- **React Native 0.79.5** with Expo 53
- **Redux Toolkit** for state management
- **Firebase Firestore** for real-time database
- **React Navigation 6** for screen routing
- **Expo Location** for GPS services

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Firebase project configured
- Google Maps API keys

### Development
```bash
# Install dependencies
yarn install

# Start development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

### Configuration
1. Copy `.env.example` to `.env`
2. Add your API keys (see [Configuration Guide](../../docs/getting-started/configuration.md))
3. Configure Firebase project
4. Set up Google Maps API

## Architecture

### State Management
- **Redux Store**: Centralized state with Redux Toolkit
- **Redux Persist**: Selective state persistence
- **Slices**: Domain-specific state management
  - `authSlice`: Authentication state
  - `driverSlice`: Driver profile and status
  - `ridesSlice`: Ride requests and history
  - `biddingSlice`: Bidding system state
  - `locationSlice`: Location tracking
  - `earningsSlice`: Earnings and analytics

### Service Layer
- **Authentication**: Firebase Auth integration
- **Database**: Firestore real-time database
- **Location**: GPS tracking and geocoding
- **Notifications**: Push notification handling
- **Maps**: Google Maps integration
- **Analytics**: Performance and usage tracking

### Component Architecture
- **Functional Components**: Modern React with hooks
- **Context Providers**: Global state management
- **Custom Hooks**: Reusable logic extraction
- **Error Boundaries**: Graceful error handling

## Development Guidelines

### Code Style
- **ESLint**: Configured with Expo rules
- **Prettier**: Code formatting
- **TypeScript**: JSDoc comments for type safety
- **Functional Programming**: Prefer hooks over classes

### File Naming
- **Components**: PascalCase (`HomeScreen.js`)
- **Utilities**: camelCase (`formatCurrency.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

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

## Documentation

- **[System Architecture](../../docs/architecture/system-architecture.md)**
- **[Database Schema](../../docs/architecture/database-schema.md)**
- **[API Documentation](../../docs/architecture/api-documentation.md)**
- **[State Management](../../docs/architecture/state-management.md)**

## Contributing

1. Follow the established code style
2. Add tests for new features
3. Update documentation as needed
4. Use meaningful commit messages
5. Create pull requests for changes

## Support

- **Technical Issues**: Create GitHub issue
- **Documentation**: Check `/docs` directory
- **Configuration**: See [Configuration Guide](../../docs/getting-started/configuration.md)
