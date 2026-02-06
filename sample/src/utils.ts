import Config from 'react-native-config';
import type {AppConfig} from './context/Config';
import {BuyerIdentityMode} from './auth/types';

const {
  EMAIL,
  ADDRESS_1,
  ADDRESS_2,
  CITY,
  COMPANY,
  COUNTRY,
  FIRST_NAME,
  LAST_NAME,
  PROVINCE,
  ZIP,
  PHONE,
} = Config;

export function createBuyerIdentityCartInput(
  appConfig: AppConfig,
  customerAccessToken?: string,
) {
  switch (appConfig.buyerIdentityMode) {
    case BuyerIdentityMode.Guest:
      return {};
    case BuyerIdentityMode.Hardcoded:
      return {
        buyerIdentity: {
          email: EMAIL,
          deliveryAddressPreferences: {
            deliveryAddress: {
              address1: ADDRESS_1,
              address2: ADDRESS_2,
              city: CITY,
              company: COMPANY,
              country: COUNTRY,
              firstName: FIRST_NAME,
              lastName: LAST_NAME,
              phone: PHONE,
              province: PROVINCE,
              zip: ZIP,
            },
          },
        },
      };
    case BuyerIdentityMode.CustomerAccount:
      if (!customerAccessToken) {
        return {};
      }
      return {
        buyerIdentity: {
          customerAccessToken,
        },
      };
  }
}

const fallbackLocale = 'en-CA';
export function getLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale ?? fallbackLocale;
}

export function currency(amount?: string, currency?: string): string {
  if (typeof amount === 'undefined' && typeof currency === 'undefined') {
    return '';
  }

  try {
    const locale = getLocale();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(Number(amount ?? 0));
  } catch (error) {
    console.error(error);
    const currencyCode = currency ? ` ${currency}` : '';
    return `${Number(amount ?? 0).toFixed(2)}` + currencyCode;
  }
}

export function debugLog(message: string, data?: any) {
  if (__DEV__) {
    console.log(message, data || '');
  }
}

export function createDebugLogger(name: string) {
  return (message: string, data?: any) =>
    debugLog(`[${name}] ${message}`, data);
}
