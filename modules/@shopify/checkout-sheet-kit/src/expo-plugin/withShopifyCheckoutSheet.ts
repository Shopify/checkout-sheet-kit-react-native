import {
  AndroidConfig,
  ConfigPlugin,
  XML,
  createRunOncePlugin,
  withDangerousMod,
  withStringsXml,
} from '@expo/config-plugins';
import fs from 'node:fs';
import path from 'node:path';

import pkg from '../../package.json';

type PluginProps = {
  androidTitle: {
    default: string;
  } & Record<string, string>;
};

/**
 * Modifies the `android/app/src/main/res/values/strings.xml` file to add the following string:
 *
 * `<string name="shopify_checkout_sheet_title">{props.androidTitle.default}</string>`
 */
const withShopifyCheckoutSheetDefault: ConfigPlugin<PluginProps> = (
  config,
  props,
) => {
  return withStringsXml(config, config => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [
        {
          _: props.androidTitle.default,
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

/**
 * Creates or modifies the `android/app/src/main/res/values-{props.androidTitle.i18n.key}/strings.xml` file to add the following string:
 *
 * `<string name="shopify_checkout_sheet_title">{props.androidTitle.i18n.value}</string>`
 */
const withShopifyCheckoutSheetI18n: ConfigPlugin<PluginProps> = (
  config,
  props,
) => {
  return withDangerousMod(config, [
    'android',
    async config => {
      // get `android/app/src/main/res` folder path
      const resourceFolderPath =
        await AndroidConfig.Paths.getResourceFolderAsync(
          config.modRequest.projectRoot,
        );

      // for each i18n item, create or modify the `values-{props.androidTitle.i18n.key}/strings.xml` file
      for (const [key, value] of Object.entries(props.androidTitle)) {
        // skip the default key
        if (key === 'default') {
          continue;
        }
        // get the `values-{props.androidTitle.i18n.key}` folder path and `strings.xml` file path
        const stringsXmlFolderPath = path.join(
          resourceFolderPath,
          `values-${key}`,
        );
        const stringsXmlFilePath = path.join(
          stringsXmlFolderPath,
          'strings.xml',
        );
        // create the `values-{props.androidTitle.i18n.key}` folder if it doesn't exist
        if (!fs.existsSync(stringsXmlFilePath)) {
          await fs.promises.mkdir(stringsXmlFolderPath, {recursive: true});
        }
        // get the existing content of the `strings.xml` file
        // if not existing, will fallback to an empty object
        const xmlContent = await AndroidConfig.Resources.readResourcesXMLAsync({
          path: stringsXmlFilePath,
        });
        // add or update the `shopify_checkout_sheet_title` string in the xml resource
        const updatedXmlContent = AndroidConfig.Strings.setStringItem(
          [
            {
              _: value,
              $: {
                name: 'shopify_checkout_sheet_title',
              },
            },
          ],
          xmlContent,
        );
        // write the updated xml content to the `strings.xml` file
        await XML.writeXMLAsync({
          path: stringsXmlFilePath,
          xml: updatedXmlContent,
        });
      }
      return config;
    },
  ]);
};

/**
 * Adds or modifies android resources to set `shopify_checkout_sheet_title`.
 */
const withShopifyCheckoutSheet: ConfigPlugin<PluginProps> = (config, props) => {
  // default resource
  config = withShopifyCheckoutSheetDefault(config, props);
  // i18n resources
  config = withShopifyCheckoutSheetI18n(config, props);
  return config;
};

export default createRunOncePlugin(
  withShopifyCheckoutSheet,
  pkg.name,
  pkg.version,
);
