import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.silenzio.sweetfinance',
  appName: 'Sweet Finance',
  webDir: 'dist',
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false
    }
  }
};

export default config;
