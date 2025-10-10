# Vehicle Images - Driver App

This directory contains placeholder vehicle images for the driver app.

## Note:
The driver app primarily uses driver-uploaded photos. These placeholders are rarely needed but included for consistency.

## Image Files

### Required Images (PNG format):
- `default-vehicle-icon.png` - Fallback icon for profile display

## Specifications:
- **Format**: PNG
- **Dimensions**: 800x600px (4:3 aspect ratio)
- **Background**: Transparent recommended

## Usage:
Drivers should upload their actual vehicle photos during onboarding. These placeholders are only used if:
1. Driver is viewing their profile before uploading photos
2. System error prevents loading uploaded photos

## See Also:
- `../../services/vehicleImageService.js` - Vehicle photo upload service
- `../../screens/profile/ProfileScreen.js` - Profile management

