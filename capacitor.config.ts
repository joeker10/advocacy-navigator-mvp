import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.advocacy.app',
  appName: 'Advocacy Platform',
  webDir: 'public',
  server: {
    url: 'http://10.0.2.2:3000', // Default Android emulator local loopback
    cleartext: true
  }
};

export default config;
