/*
MIT License

Copyright 2023 - Present, Shopify Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import Config from 'react-native-config';

const {
  APP_API_KEY,
  APP_SHARED_SECRET,
  APP_ACCESS_TOKEN,
} = Config;

/**
 * ⚠️ WARNING: FOR TESTING ONLY ⚠️
 *
 * This configuration is for local testing of authentication flows.
 * DO NOT USE IN PRODUCTION. JWT tokens must be generated server-side.
 *
 * To enable authentication testing:
 * 1. Add your test app credentials to .env file:
 *    APP_API_KEY=your-api-key
 *    APP_SHARED_SECRET=your-shared-secret
 *    APP_ACCESS_TOKEN=your-access-token
 * 2. Run the sample app
 * 3. Go to Settings and toggle "App authentication" ON
 *
 * These values should match what you configure in your Shopify app settings.
 */

export interface AuthConfig {
  /**
   * Your app's API key
   * Found in your Shopify Partner dashboard under app settings
   */
  apiKey: string;

  /**
   * Your app's shared secret
   * Found in your Shopify Partner dashboard under app settings
   */
  sharedSecret: string;

  /**
   * Your app's access token
   * This would typically be obtained during app installation
   */
  accessToken: string;
}

export const authConfig: AuthConfig = {
  apiKey: APP_API_KEY || '',
  sharedSecret: APP_SHARED_SECRET || '',
  accessToken: APP_ACCESS_TOKEN || '',
};

/**
 * Validates that all required auth configuration is present
 */
export function hasAuthCredentials(): boolean {
  return !!(
    authConfig.apiKey &&
    authConfig.sharedSecret &&
    authConfig.accessToken
  );
}

