import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.thespecialeducationnavigator',
  appName: 'SpEd Navigator',
  webDir: 'out',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '76978043008-5riscv5374dum0a66mamauu2vnsovlb8.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
