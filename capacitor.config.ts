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
      clientId: '1047508462571-ql85gp42i8218h0rpsqpj8lcn92shjt1.apps.googleusercontent.com',
      serverClientId: '1047508462571-ql85gp42i8218h0rpsqpj8lcn92shjt1.apps.googleusercontent.com',
    },
  },
};

export default config;
