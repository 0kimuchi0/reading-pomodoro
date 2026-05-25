import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readingpomodoro.app',
  appName: 'PomoRead',
  webDir: 'dist',
  plugins: {
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;
