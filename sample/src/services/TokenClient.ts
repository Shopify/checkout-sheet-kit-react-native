import Config from 'react-native-config';

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
  constructor(message: string, public readonly statusCode?: number) {
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
      this.config.authEndpoint
    );
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

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(this.config.authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'client_credentials',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.createHttpError(response);
      }

      const data = await this.parseResponse(response);
      this.validateTokenResponse(data);

      return data.access_token;
    } catch (error) {
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
        errorMessage = 'Rate limit exceeded: Too many requests, please try again later';
        break;
      default:
        if (response.status >= 500) {
          errorMessage = 'Server error: Authentication service is temporarily unavailable';
        }
        break;
    }

    return new TokenClientError(errorMessage, response.status);
  }

  /**
   * Parse the JSON response safely
   */
  private async parseResponse(response: Response): Promise<AccessTokenResponse> {
    try {
      return await response.json();
    } catch (jsonError) {
      throw new TokenClientError('Invalid response format: Unable to parse authentication response');
    }
  }

  /**
   * Validate the token response structure
   */
  private validateTokenResponse(data: AccessTokenResponse): void {
    if (!data.access_token || typeof data.access_token !== 'string') {
      throw new TokenClientError('Invalid response: Missing or invalid access token in response');
    }
  }

  /**
   * Handle and log errors appropriately
   */
  private handleError(error: unknown): void {
    let errorMessage = 'Unknown error occurred while fetching authentication token';

    if (error instanceof TokenClientError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout: Authentication service took too long to respond';
      } else if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to authentication service';
      } else {
        errorMessage = error.message;
      }
    }

    console.error('TokenClient: Error fetching auth token:', errorMessage, error);
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

