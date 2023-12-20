import {
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
} from '@env';
import {AppConfig} from './context/Config';

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
