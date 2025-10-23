import React, {useState} from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NavigationProp} from '@react-navigation/native';
import {useMutation} from '@apollo/client';
import {gql} from '@apollo/client';
import Config from 'react-native-config';
import {useConfig} from '../context/Config';
import {useTheme} from '../context/Theme';
import {createBuyerIdentityCartInput, getLocale} from '../utils';
import {buildCartPermalink} from '../utils/cartPermalink';
import type {RootStackParamList} from '../App';

export enum CartDataSource {
  StorefrontAPI = 'StorefrontAPI',
  Permalink = 'Permalink',
}

interface BuyNowButtonProps {
  variantId: string;
  cartDataSource: CartDataSource;
  disabled?: boolean;
}

const CREATE_CART_WITH_LINE_MUTATION = gql`
  mutation CreateCartWithLine($input: CartInput!, $country: CountryCode = CA)
  @inContext(country: $country) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
    }
  }
`;

export function BuyNowButton({
  variantId,
  cartDataSource,
  disabled,
}: BuyNowButtonProps) {
  const {cornerRadius} = useTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {appConfig} = useConfig();
  const [loading, setLoading] = useState(false);
  const [, country] = getLocale().split('-');

  const [createCartWithLine] = useMutation(CREATE_CART_WITH_LINE_MUTATION, {
    variables: {country},
  });

  const handleBuyNow = async () => {
    if (!variantId || disabled) return;

    setLoading(true);

    try {
      let checkoutUrl: string;

      switch (cartDataSource) {
        case CartDataSource.Permalink:
          checkoutUrl = buildCartPermalink(
            Config.DEMO_VARIANT_ID || '2',
            1,
          );
          break;

        case CartDataSource.StorefrontAPI: {
          const cartInput = {
            ...createBuyerIdentityCartInput(appConfig),
            lines: [
              {
                quantity: 1,
                merchandiseId: variantId,
              },
            ],
          };

          const {data} = await createCartWithLine({
            variables: {input: cartInput},
          });

          checkoutUrl = data?.cartCreate?.cart?.checkoutUrl;

          if (!checkoutUrl) {
            throw new Error('No CheckoutURL');
          }
          break;
        }

        default:
          const _exhaustiveCheck: never = cartDataSource;
          throw new Error(`Unknown cart data source: ${_exhaustiveCheck}`);
      }

      navigation.navigate('BuyNow', {url: checkoutUrl});
    } catch (error) {
      console.error('Error creating buy now cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(cornerRadius);

  return (
    <Pressable
      disabled={loading || disabled}
      // eslint-disable-next-line react-native/no-inline-styles
      style={{...styles.buyNowButton, backgroundColor: 'white'}}
      onPress={handleBuyNow}>
      {loading ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        <>
          <Text style={styles.buyNowButtonText}>Buy Now </Text>
        </>
      )}
    </Pressable>
  );
}

function createStyles(cornerRadius: number) {
  return StyleSheet.create({
    buyNowButton: {
      borderRadius: cornerRadius,
      paddingHorizontal: 10,
      paddingVertical: 14,
      height: 48,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    buyNowButtonText: {
      fontSize: 20,
      lineHeight: 20,
      color: 'black',
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });
}
