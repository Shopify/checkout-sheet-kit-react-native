import env from 'react-native-config';
import {NativeModules, Platform} from 'react-native';
import type {AppConfig} from './context/Config';

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
} = env;

export function createBuyerIdentityCartInput(appConfig: AppConfig) {
  if (!appConfig.prefillBuyerInformation) {
    return {};
  }

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
}

export function getLocale(): string {
  const fallbackLocale = 'en_CA';

  return (
    (Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings.AppleLocale ||
        NativeModules.SettingsManager?.settings.AppleLanguages[0]
      : NativeModules.I18nManager?.localeIdentifier) ?? fallbackLocale
  );
}

export function currency(amount?: string, currency?: string): string {
  if (typeof amount === 'undefined' && typeof currency === 'undefined') {
    return '';
  }

  const currencyCode = currency ? ` ${currency}` : '';

  try {
    const locale = getLocale();
    return (
      new Intl.NumberFormat(locale.replace(/_/, '-'), {
        style: 'currency',
        currency: currency,
      }).format(Number(amount ?? 0)) + currencyCode
    );
  } catch (error) {
    return `${Number(amount ?? 0).toFixed(2)}` + currencyCode;
  }
}

/**
 * Optimizes a Shopify image URL by requesting a specific size
 * This significantly reduces bandwidth and improves loading times
 *
 * @param url - Original Shopify CDN image URL
 * @param size - Desired image dimensions
 * @param scale - Pixel density multiplier (default: 2 for retina displays)
 * @returns Optimized image URL with size parameters
 *
 * @example For product thumbnails
 * getOptimizedImageUrl(imageUrl, {width: 150, height: 150})
 *
 * @example For product detail images
 * getOptimizedImageUrl(imageUrl, {width: 400, height: 400})
 *
 * @example For cart item thumbnails
 * getOptimizedImageUrl(imageUrl, {width: 80, height: 80})
 */
export function getOptimizedImageUrl(
  url: string | undefined,
  size: {width: number; height: number},
  scale: number = 2,
): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    // Calculate actual dimensions for device pixel density
    const width = size.width * scale;
    const height = size.height * scale;

    // Shopify CDN image transformation pattern:
    // Original: https://cdn.shopify.com/s/files/1/0001/0002/products/image.jpg
    // Resized:  https://cdn.shopify.com/s/files/1/0001/0002/products/image_600x600.jpg

    if (url.includes('cdn.shopify.com')) {
      // Remove any existing size parameters
      const cleanUrl = url.replace(/_\d+x\d+(\.\w+)/, '$1');

      // Insert new size parameters before file extension
      const lastDot = cleanUrl.lastIndexOf('.');
      if (lastDot > -1) {
        return `${cleanUrl.slice(0, lastDot)}_${width}x${height}${cleanUrl.slice(lastDot)}`;
      }
    }

    // Return original URL if not a Shopify CDN image
    return url;
  } catch {
    // Return original URL if transformation fails
    return url;
  }
}
