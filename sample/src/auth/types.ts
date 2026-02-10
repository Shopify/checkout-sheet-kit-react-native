export const BuyerIdentityMode = {
  Guest: 'guest',
  Hardcoded: 'hardcoded',
  CustomerAccount: 'customerAccount',
} as const;

export type BuyerIdentityMode =
  (typeof BuyerIdentityMode)[keyof typeof BuyerIdentityMode];

export const BuyerIdentityModeDisplayNames: Record<BuyerIdentityMode, string> =
  {
    [BuyerIdentityMode.Guest]: 'Guest',
    [BuyerIdentityMode.Hardcoded]: 'Hardcoded',
    [BuyerIdentityMode.CustomerAccount]: 'Customer Account',
  };

export interface OAuthTokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number;
  expiresAt: number;
  idToken: string | null;
  tokenType: string;
}
