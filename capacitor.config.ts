import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readingpomodoro.app',
  appName: 'Reading Pomodoro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
