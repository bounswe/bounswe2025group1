# Building APK with EAS Build

## Prerequisites

**REQUIRED: Free Expo Account**
- Create a free account at https://expo.dev
- No credit card needed
- Free tier includes 30 builds/month

**System Requirements:**
- Node.js 18+ (you have Node 19 ✓)
- npm or yarn

## One-Time Setup

1. **Install EAS CLI globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login with your Expo account:**
   ```bash
   eas login
   ```

3. **Configure EAS (first time only):**
   ```bash
   cd MOBILE/CommunityGardenApp
   eas build:configure
   ```

## Building APK

### Option 1: Using Build Profiles (Recommended)

The `eas.json` file defines three profiles with different API URLs:

**Development Build** (local development API):
```bash
eas build --platform android --profile development
```
- API URL: `http://192.168.5.206:8001/api`
- Unsigned APK for testing

**Preview Build** (staging environment):
```bash
eas build --platform android --profile preview
```
- API URL: `https://your-staging-api-url.com/api` (edit in `eas.json`)
- Signed APK for internal testing

**Production Build** (production environment):
```bash
eas build --platform android --profile production
```
- API URL: `https://your-production-api-url.com/api` (edit in `eas.json`)
- Signed APK for release/distribution

### Option 2: Custom API URL (Override)

To use a custom API URL without editing `eas.json`:

```bash
eas build --platform android --profile production \
  --env EXPO_PUBLIC_API_URL=https://custom-api-url.com/api
```

## How to Change API URL

### Method 1: Edit eas.json
Open `eas.json` and modify the `EXPO_PUBLIC_API_URL` in the desired profile:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://your-new-api-url.com/api"
  }
}
```

### Method 2: Command Line Override
Pass the URL directly when building:
```bash
eas build --platform android --profile production \
  --env EXPO_PUBLIC_API_URL=https://your-api-url.com/api
```

## After Building

1. EAS Build runs in the cloud (takes ~15-20 minutes)
2. You'll get a link to track progress
3. When done, download the APK from the link provided
4. Install on Android device or upload to Play Store

## Troubleshooting

**"Not logged in"**
- Run `eas login` and sign in with your expo.dev account

**"No credentials found"**
- EAS will automatically generate a keystore on first production build
- Or generate manually: `eas credentials`

**Build fails with "out of builds"**
- Free tier: 30 builds/month
- Check usage: https://expo.dev/accounts/[your-account]/settings/billing

**API URL not changing**
- Make sure you're using `EXPO_PUBLIC_API_URL` (not just `API_URL`)
- The prefix `EXPO_PUBLIC_` is required for environment variables in Expo SDK 50+

## Additional Commands

**Check build status:**
```bash
eas build:list
```

**View build logs:**
```bash
eas build:view [build-id]
```

**Manage credentials:**
```bash
eas credentials
```

## Notes

- First build takes longer (~20-30 min) as it generates keystore
- Subsequent builds are faster (~15-20 min)
- All builds happen in Expo's cloud infrastructure
- APKs are automatically signed for production profiles
- Build artifacts are stored for 30 days on Expo servers
