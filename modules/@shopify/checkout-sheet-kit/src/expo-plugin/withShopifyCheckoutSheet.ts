import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withStringsXml,
} from '@expo/config-plugins';

import pkg from '../../package.json';

type PluginProps = {
  androidTitle: string;
};

/**
 * Modifies the `android/app/src/main/res/values/strings.xml` file to add the following string:
 *
 * <string name="shopify_checkout_sheet_title">{props.androidTitle}</string>
 */
const withShopifyCheckoutSheet: ConfigPlugin<PluginProps> = (config, props) => {
  return withStringsXml(config, config => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          _: props.androidTitle,
          $: {
            name: 'shopify_checkout_sheet_title',
          },
        },
      ],
      config.modResults,
    );
    return config;
  });
};

export default createRunOncePlugin(
  withShopifyCheckoutSheet,
  pkg.name,
  pkg.version,
);
