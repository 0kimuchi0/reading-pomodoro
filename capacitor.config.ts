import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.readingpomodoro.app',
  appName: 'Reading Pomodoro',
  webDir: 'dist',
  server: {
    url: 'https://pomread.vercel.app',
    cleartext: false,
  },
};

export default config;
