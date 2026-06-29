import { config as loadEnv } from 'dotenv'
import type { CapacitorConfig } from '@capacitor/cli'

loadEnv({ path: '.env.local' })

const config: CapacitorConfig = {
  appId: 'com.readingpomodoro.app',
  appName: 'PomoRead',
  webDir: 'dist',
}

export default config
