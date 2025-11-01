// Load env and export Expo config with extra values
const path = require('path');
const dotenv = require('dotenv');

// Load .env from workspace root if present
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = () => ({
  expo: {
    name: 'altu-mini',
    slug: 'altu-mini',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    },
  },
});
