import Config from 'react-native-config';
import {Platform} from 'react-native';

/**
 * Response from Shopify's access token endpoint
 */
interface AccessTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

/**
 * Configuration for the token client
 */
interface TokenClientConfig {
  clientId: string;
  clientSecret: string;
  authEndpoint: string;
  timeoutMs?: number;
}

/**
 * Error thrown when token fetching fails
 */
export class TokenClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'TokenClientError';
  }
}

/**
 * Client for fetching authentication tokens from Shopify's auth service
 */
export class TokenClient {
  private config: TokenClientConfig;

  constructor(config?: Partial<TokenClientConfig>) {
    this.config = {
      clientId: config?.clientId || Config.SHOPIFY_CLIENT_ID || '',
      clientSecret: config?.clientSecret || Config.SHOPIFY_CLIENT_SECRET || '',
      authEndpoint: config?.authEndpoint || Config.SHOPIFY_AUTH_ENDPOINT || '',
      timeoutMs: config?.timeoutMs || 10000,
    };
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return Boolean(
      this.config.clientId &&
        this.config.clientSecret &&
        this.config.authEndpoint,
    );
  }

  /**
   * Get the appropriate auth endpoint URL based on platform
   */
  private getAuthEndpointUrl(): string {
    let authUrl = this.config.authEndpoint;

    // Handle localhost URLs for Android emulator
    if (Platform.OS === 'android') {
      // Android emulator needs to use 10.0.2.2 to access host machine
      authUrl = authUrl.replace('localhost', '10.0.2.2');
      authUrl = authUrl.replace('127.0.0.1', '10.0.2.2');

      console.log(`[TokenClient] Android platform detected`);
      console.log(`[TokenClient] Original URL: ${this.config.authEndpoint}`);
      console.log(`[TokenClient] Adjusted URL: ${authUrl}`);
    }

    return authUrl;
  }

  /**
   * Fetch an access token from the Shopify auth service
   * @returns Access token string, or undefined if not configured or failed
   */
  async fetchToken(): Promise<string | undefined> {
    // Skip if credentials are not configured
    if (!this.isConfigured()) {
      console.warn('TokenClient: Missing credentials - skipping token fetch');
      return undefined;
    }

    const authUrl = this.getAuthEndpointUrl();
    const requestBody = {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: 'client_credentials',
    };

    console.log(`[TokenClient] ========== Token Fetch Debug ==========`);
    console.log(`[TokenClient] Platform: ${Platform.OS}`);
    console.log(`[TokenClient] Auth URL: ${authUrl}`);
    console.log(
      `[TokenClient] Client ID: ${this.config.clientId ? '***' + this.config.clientId.slice(-4) : 'NOT SET'}`,
    );
    console.log(`[TokenClient] Timeout: ${this.config.timeoutMs}ms`);
    console.log(
      `[TokenClient] Request body:`,
      JSON.stringify({...requestBody, client_secret: '***'}),
    );
    console.log(`[TokenClient] =======================================`);

    try {
      const controller = new AbortController();
      // const timeoutId = setTimeout(
      //   () => controller.abort(),
      //   this.config.timeoutMs,
      // );

      console.log(`[TokenClient] Initiating fetch request...`);
      const startTime = Date.now();

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `ReactNative/${Platform.OS}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      console.log(`[TokenClient] Response received in ${elapsed}ms`);
      console.log(
        `[TokenClient] Response status: ${response.status} ${response.statusText}`,
      );
      console.log(
        `[TokenClient] Response headers:`,
        JSON.stringify(response.headers),
      );

      if (!response.ok) {
        throw await this.createHttpError(response);
      }

      const data = await this.parseResponse(response);
      this.validateTokenResponse(data);

      console.log(`[TokenClient] ✅ Token successfully fetched`);
      console.log(
        `[TokenClient] Token type: ${data.token_type || 'not specified'}`,
      );
      console.log(
        `[TokenClient] Expires in: ${data.expires_in || 'not specified'} seconds`,
      );

      return data.access_token;
    } catch (error) {
      console.log(`[TokenClient] ❌ Token fetch failed`, error);
      this.handleError(error);
      return undefined;
    }
  }

  /**
   * Create a descriptive error for HTTP failures
   */
  private async createHttpError(response: Response): Promise<TokenClientError> {
    // Try to get error details from response body
    let errorMessage = `Failed to fetch access token: ${response.status} ${response.statusText}`;

    try {
      const errorBody = await response.text();
      if (errorBody) {
        errorMessage += ` - ${errorBody}`;
      }
    } catch {
      // Ignore errors when trying to read error response
    }

    // Provide more specific error messages for common HTTP status codes
    switch (response.status) {
      case 401:
        errorMessage = 'Authentication failed: Invalid client credentials';
        break;
      case 403:
        errorMessage = 'Access denied: Check client permissions and scopes';
        break;
      case 429:
        errorMessage =
          'Rate limit exceeded: Too many requests, please try again later';
        break;
      default:
        if (response.status >= 500) {
          errorMessage =
            'Server error: Authentication service is temporarily unavailable';
        }
        break;
    }

    return new TokenClientError(errorMessage, response.status);
  }

  /**
   * Parse the JSON response safely
   */
  private async parseResponse(
    response: Response,
  ): Promise<AccessTokenResponse> {
    try {
      return await response.json();
    } catch (jsonError) {
      throw new TokenClientError(
        'Invalid response format: Unable to parse authentication response',
      );
    }
  }

  /**
   * Validate the token response structure
   */
  private validateTokenResponse(data: AccessTokenResponse): void {
    if (!data.access_token || typeof data.access_token !== 'string') {
      throw new TokenClientError(
        'Invalid response: Missing or invalid access token in response',
      );
    }
  }

  /**
   * Handle and log errors appropriately
   */
  private handleError(error: unknown): void {
    let errorMessage =
      'Unknown error occurred while fetching authentication token';
    let errorDetails: any = {};

    if (error instanceof TokenClientError) {
      errorMessage = error.message;
      errorDetails.statusCode = error.statusCode;
    } else if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage =
          'Request timeout: Authentication service took too long to respond';
        errorDetails.timeout = `${this.config.timeoutMs}ms`;
      } else if (
        error.message.includes('Network request failed') ||
        error.message.includes('Failed to fetch')
      ) {
        errorMessage =
          'Network error: Unable to connect to authentication service';
        errorDetails.platform = Platform.OS;
        errorDetails.endpoint = this.getAuthEndpointUrl();
        errorDetails.possibleCauses = [
          'SSL/TLS certificate issues',
          'Android emulator network configuration',
          'Firewall or proxy blocking the request',
          'DNS resolution failure',
          'Invalid or unreachable endpoint URL',
        ];

        if (Platform.OS === 'android') {
          errorDetails.androidTips = [
            'Ensure the auth endpoint is accessible from Android emulator',
            'Try using actual device IP instead of localhost/127.0.0.1',
            'Check if cleartext traffic is allowed in network_security_config.xml',
            'Verify Android emulator has internet access',
            'Test with a public test endpoint like https://httpbin.org/post',
          ];
        }
      } else {
        errorMessage = error.message;
      }
      errorDetails.errorName = error.name;
      errorDetails.errorStack = error.stack;
    }

    console.error(
      'TokenClient: Error fetching auth token:',
      errorMessage,
      error,
    );
    console.error(
      'TokenClient: Error details:',
      JSON.stringify(errorDetails, null, 2),
    );
  }
}

/**
 * Default token client instance using environment configuration
 */
export const defaultTokenClient = new TokenClient();

/**
 * Convenience function for fetching a token with the default client
 */
export const fetchToken = (): Promise<string | undefined> => {
  return defaultTokenClient.fetchToken();
};

/**
 * Test connectivity to various endpoints (for debugging)
 */
export const testConnectivity = async (): Promise<void> => {
  console.log(`[TokenClient] ========== Connectivity Test ==========`);
  console.log(`[TokenClient] Platform: ${Platform.OS}`);

  const endpoints = [
    {name: 'httpbin.org (Public test API)', url: 'https://httpbin.org/post'},
    {name: 'Google', url: 'https://www.google.com'},
    {
      name: 'Configured Auth Endpoint',
      url: Config.SHOPIFY_AUTH_ENDPOINT || 'NOT CONFIGURED',
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`[TokenClient] Testing: ${endpoint.name}`);
      console.log(`[TokenClient] URL: ${endpoint.url}`);

      if (endpoint.url === 'NOT CONFIGURED') {
        console.log(`[TokenClient] ❌ Skipped - not configured`);
        continue;
      }

      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(endpoint.url, {
        method: endpoint.url.includes('httpbin') ? 'POST' : 'HEAD',
        headers: {
          'User-Agent': `ReactNative/${Platform.OS}`,
        },
        body: endpoint.url.includes('httpbin')
          ? JSON.stringify({test: 'connectivity'})
          : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      console.log(
        `[TokenClient] ✅ Success - Status: ${response.status}, Time: ${elapsed}ms`,
      );
    } catch (error) {
      console.log(
        `[TokenClient] ❌ Failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  console.log(`[TokenClient] =======================================`);
};
