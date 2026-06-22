import { config as loadEnv } from 'dotenv'
import type { CapacitorConfig } from '@capacitor/cli'

loadEnv({ path: '.env.local' })

const config: CapacitorConfig = {
  appId: 'com.readingpomodoro.app',
  appName: 'PomoRead',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_SERVER_CLIENT_ID ?? '',
      forceCodeForRefreshToken: true,
    },
  },
}

export default config
