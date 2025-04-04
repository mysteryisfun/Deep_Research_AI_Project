import { LinkingOptions } from '@react-navigation/native';

export const linking: LinkingOptions<any> = {
  prefixes: ['yourapp://', 'https://yourapp.com'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token: string) => token,
        },
      },
      Login: 'login',
      Home: 'home',
      // ... other screens
    },
  },
  async getInitialURL() {
    // Handle incoming links when app is not running
    return null;
  },
  subscribe(listener) {
    // Handle incoming links when app is running
    return () => {
      // Cleanup subscription if needed
    };
  },
}; 