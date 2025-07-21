# 🔌 API Setup Guide for AnyRyde Driver App

This guide walks you through setting up all the required API keys and services for the AnyRyde Driver app to work in production.

## 📋 Required APIs Overview

### 🗺️ **Essential APIs (Required)**
1. **Google Maps APIs** - For navigation, geocoding, and directions
2. **EIA API** - For real-time fuel prices (FREE)

### 🔥 **Optional APIs (Enhanced Features)**
1. **GasBuddy API** - Premium fuel price data (Commercial)
2. **MyGasFeed API** - Alternative fuel station data
3. **Analytics APIs** - For app analytics and monitoring

---

## 🚀 Setup Instructions

### 1. Google Maps API Setup

**Cost**: Pay-per-use (first $200/month free)  
**Required for**: Navigation, geocoding, route planning

#### Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS  
   - Directions API
   - Distance Matrix API
   - Geocoding API
   - Places API
   - Roads API (for route snapping)

4. Create API keys:
   - **Android Key**: Restricted to your Android app package
   - **iOS Key**: Restricted to your iOS bundle identifier  
   - **Web Key**: For testing and web components

#### Security Configuration:
```
Android Key Restrictions:
- Package name: com.rydeiq.driver
- SHA-1 certificate fingerprint: [Your app's fingerprint]

iOS Key Restrictions:
- Bundle identifier: com.rydeiq.driver

Web Key Restrictions:
- HTTP referrer: rydeiq.com/*
```

#### Add to .env file:
```env
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY=AIza...your_key_here
EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY=AIza...your_key_here
EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY=AIza...your_key_here
```

---

### 2. EIA API Setup (FREE - Recommended)

**Cost**: FREE  
**Required for**: Real-time fuel prices  
**Coverage**: US-wide fuel price data

#### Steps:
1. Go to [EIA Open Data Registration](https://www.eia.gov/opendata/register.php)
2. Fill out the registration form
3. Verify your email address
4. Copy your API key from the dashboard

#### Features:
- ✅ US national and regional fuel prices
- ✅ Weekly updates
- ✅ Government-sourced data (reliable)
- ✅ No usage limits
- ✅ Free forever

#### Add to .env file:
```env
EXPO_PUBLIC_EIA_API_KEY=your_eia_key_here
```

---

### 3. GasBuddy API Setup (Optional - Commercial)

**Cost**: Commercial pricing (contact for quote)  
**Required for**: Enhanced fuel station data  
**Coverage**: Real-time station prices

#### Steps:
1. Contact [GasBuddy Business](https://www.gasbuddy.com/business/api)
2. Discuss commercial licensing
3. Get API credentials

#### Features:
- ✅ Real-time station prices
- ✅ Station amenities
- ✅ User-reported prices
- ✅ Higher update frequency

#### Add to .env file:
```env
EXPO_PUBLIC_GASBUDDY_API_KEY=your_gasbuddy_key_here
```

---

### 4. MyGasFeed API Setup (Alternative)

**Cost**: Various plans available  
**Required for**: Alternative fuel station data

#### Steps:
1. Visit [MyGasFeed API](http://www.mygasfeed.com/keys/api)
2. Choose a subscription plan
3. Get your API key

#### Add to .env file:
```env
EXPO_PUBLIC_FUEL_ECONOMY_API_KEY=your_mygasfeed_key_here
```

---

## 🔒 Security Best Practices

### Environment Variables
1. **Never commit .env files** to version control
2. Use different keys for development/staging/production
3. Restrict API keys to specific domains/apps

### Google Maps Security
```javascript
// Restrict keys by:
// 1. Application (Android/iOS bundle)
// 2. API (only enable needed APIs)
// 3. IP address (for server keys)
// 4. HTTP referrer (for web keys)
```

### Key Rotation
- Rotate API keys every 90 days
- Monitor usage in API dashboards
- Set up usage alerts

---

## 💰 Cost Estimation

### Google Maps (Monthly costs for 10,000 active drivers):
- **Map loads**: ~$200-500/month
- **Directions requests**: ~$100-300/month  
- **Geocoding**: ~$50-150/month
- **Total estimated**: ~$350-950/month

### EIA API:
- **Cost**: $0 (FREE)

### Total Estimated Monthly Cost:
- **Minimum setup (EIA only)**: ~$350-950/month
- **Full setup (with GasBuddy)**: Contact for quote

---

## 🧪 Testing Your Setup

### 1. Validate Configuration
```javascript
import { validateConfig } from '@/constants/config';

// Check for missing API keys
const errors = validateConfig();
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}
```

### 2. Test Fuel Price API
```javascript
import { getFuelPrices } from '@/services/api/fuelPriceService';

// Test EIA API
const testLocation = { state: 'CA', city: 'San Francisco' };
const prices = await getFuelPrices(testLocation);
console.log('Fuel prices:', prices);
```

### 3. Test Google Maps
```javascript
// Test in your app's map component
// Verify maps load correctly
// Test directions between two points
```

---

## 🚀 Production Deployment

### 1. Environment Setup
```bash
# Copy template
cp .env.example .env

# Edit with your keys
nano .env

# For Expo/EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY --value "your_key"
```

### 2. Build Configuration
Update `app.json` or `app.config.js`:
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "$EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY"
      }
    }
  }
}
```

---

## 📊 Monitoring & Analytics

### 1. Google Cloud Monitoring
- Set up billing alerts
- Monitor API usage
- Track errors and latency

### 2. EIA API Monitoring
- Track response times
- Monitor data freshness
- Set up fallback strategies

### 3. App Analytics
```javascript
// Optional: Add analytics for API performance
// Track fuel price accuracy
// Monitor user engagement with features
```

---

## 🆘 Troubleshooting

### Common Issues:

#### Google Maps not loading:
- Check API key restrictions
- Verify enabled APIs
- Check billing account status

#### Fuel prices not updating:
- Verify EIA API key
- Check network connectivity
- Review cache settings

#### Performance issues:
- Implement request batching
- Add caching layers
- Optimize API call frequency

---

## 📞 Support Contacts

### Google Maps Support:
- [Google Maps Platform Support](https://developers.google.com/maps/support)
- [Google Cloud Support](https://cloud.google.com/support)

### EIA Support:
- [EIA Open Data Support](https://www.eia.gov/opendata/browser/support)
- Email: APIinfo@eia.gov

### App-Specific Issues:
- Check app logs and error reports
- Review API response formats
- Validate environment configuration

---

## ✅ Pre-Launch Checklist

- [ ] Google Maps APIs enabled and restricted
- [ ] EIA API key obtained and tested
- [ ] Environment variables configured
- [ ] API usage monitoring set up
- [ ] Billing alerts configured
- [ ] Error handling implemented
- [ ] Fallback strategies tested
- [ ] Performance benchmarks established
- [ ] Security review completed
- [ ] Production builds tested

---

**🎯 With these APIs properly configured, your AnyRyde Driver app will have:**
- Real-time navigation and directions
- Live fuel price data
- Station finder functionality  
- Regional price adjustments
- Comprehensive fallback systems

This gives you a significant competitive advantage with features no other ride-sharing platform offers! 