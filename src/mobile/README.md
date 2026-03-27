# GRM Sales Mobile App

A separate mobile application with offline functionality for the GRM Sales system.

## Features

### 🔄 Offline-First Architecture
- **SQLite Database**: Local data storage using @capacitor-community/sqlite
- **Sync Queue**: Automatic synchronization when online
- **Network Detection**: Real-time online/offline status monitoring
- **Conflict Resolution**: Handles data conflicts between local and server

### 📱 Mobile-Optimized UI
- **Responsive Design**: Touch-friendly interface optimized for mobile devices
- **Offline Indicator**: Clear visual feedback of connection status
- **Sync Progress**: Real-time sync status and progress indicators
- **Native Performance**: Built with Capacitor for native app capabilities

### ✨ Core Features
- **Transit Logbook**: Create and manage outward entries offline
- **Customer Management**: Add and edit customer information
- **Item Catalog**: Manage items and pricing
- **Receipt Generation**: Create receipts with auto-numbering
- **Sales Recording**: Record sales transactions
- **Load Weight Updates**: Update vehicle weights offline

### 🔧 Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Mobile Framework**: Capacitor
- **Database**: SQLite (offline) + Supabase (sync)
- **State Management**: React Query + Custom hooks
- **UI Components**: Shared with main app (shadcn/ui)

## Setup Instructions

### 1. Install Dependencies
All required dependencies are already added to package.json:
- @capacitor/core, @capacitor/cli
- @capacitor/ios, @capacitor/android
- @capacitor-community/sqlite
- @capacitor/network, @capacitor/camera, @capacitor/geolocation

### 2. Initialize Capacitor
```bash
npx cap init
```
The capacitor.config.ts is already configured with:
- App ID: app.lovable.a9552430852f41e8a662c1d2fbb827ad.mobile
- App Name: GRM Sales Mobile
- Hot reload URL for development

### 3. Add Platforms
```bash
npx cap add ios     # For iOS
npx cap add android # For Android
```

### 4. Build and Sync
```bash
npm run build
npx cap sync
```

### 5. Run on Device/Simulator
```bash
npx cap run ios     # For iOS
npx cap run android # For Android
```

## Architecture

### Services Layer
- **DatabaseService**: SQLite operations and schema management
- **NetworkService**: Network status monitoring and change detection
- **SyncService**: Bidirectional sync between local and remote databases

### Components
- **MobileLayout**: Common layout with offline indicator
- **OfflineIndicator**: Network status and sync progress display
- **Form Components**: Mobile-optimized forms for data entry

### Hooks
- **useOfflineData**: Generic hook for offline-first data operations
- Provides CRUD operations with automatic sync queue management

### Data Flow
```
User Input → Local SQLite → Sync Queue → (When Online) → Supabase → Success
                ↑                                           ↓
            Immediate UI Update                      Background Sync
```

## Development

### Adding New Features
1. Create the mobile component in `/mobile/components/`
2. Add routes in `/mobile/App.tsx`
3. Use `useOfflineData` hook for data operations
4. Implement corresponding sync logic in `SyncService`

### Database Schema
Local SQLite tables mirror Supabase schema with additional fields:
- `sync_status`: 'pending' | 'synced' | 'failed'
- `created_at`, `updated_at`: Timestamps for sync ordering

### Sync Strategy
- **Optimistic Updates**: Immediate local updates with background sync
- **Conflict Resolution**: Server wins for now (can be customized)
- **Batch Operations**: Multiple operations synced together for efficiency
- **Retry Logic**: Failed syncs are retried automatically

## Deployment

### Development Testing
- Use Capacitor Live Reload for quick development
- Test offline scenarios by disabling network

### Production Build
1. Build React app: `npm run build`
2. Sync to native: `npx cap sync`
3. Build native apps in Xcode/Android Studio

### Distribution
- **App Stores**: Publish to Google Play Store / Apple App Store
- **Enterprise**: Direct APK/IPA distribution
- **Updates**: Over-the-air updates for React code

## Benefits

✅ **Zero Impact**: Completely separate from main web app
✅ **Full Offline**: All features work without internet
✅ **Auto Sync**: Seamless data synchronization when online
✅ **Native Performance**: Real mobile app with native capabilities
✅ **Consistent Data**: Shared database ensures data consistency
✅ **Future-Ready**: Extensible for camera, GPS, push notifications

## Future Enhancements

- **Camera Integration**: Photo capture for receipts and lorries
- **GPS Integration**: Auto-fill loading locations
- **Push Notifications**: Sync status and alerts
- **Biometric Auth**: Fingerprint/face unlock
- **Offline Maps**: Route planning and location services
- **Voice Input**: Speech-to-text for data entry