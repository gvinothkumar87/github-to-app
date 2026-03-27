import { CapacitorConfig } from '@capacitor/cli';

// Use development server only in development, remove for production builds
const isDevelopment = process.env.NODE_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'app.lovable.a9552430852f41e8a662c1d2fbb827ad.mobile',
  appName: 'GRM Sales Mobile',
  webDir: 'dist-mobile',
  ...(isDevelopment && {
    server: {
      url: 'https://a9552430-852f-41e8-a662-c1d2fbb827ad.lovableproject.com?forceHideBadge=true',
      cleartext: true
    }
  }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidDatabaseLocation: 'default'
    }
  }
};

export default config;