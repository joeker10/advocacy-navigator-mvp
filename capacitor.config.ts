import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.thespecialeducationnavigator',
  appName: 'SpEd Navigator',
  webDir: 'out',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
    captureInput: true,
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '584515942995-o6cjeqcm3k14jgr3jrkrmro0ash879qs.apps.googleusercontent.com',
      serverClientId: '584515942995-o6cjeqcm3k14jgr3jrkrmro0ash879qs.apps.googleusercontent.com',
    },
  },
};

export default config;
