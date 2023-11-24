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

export enum ColorScheme {
  automatic = 'automatic',
  light = 'light',
  dark = 'dark',
  web = 'web_default',
}

interface IosConfigurationOptions {
  ios: {
    colors: {
      /**
       * A HEX color value for customizing the color of the loading spinner.
       */
      spinnerColor?: string;
      backgroundColor?: string;
    };
  };
}

interface AndroidColors {
  /**
   * A HEX color value for customizing the color of the loading spinner.
   */
  spinnerColor: string;
  /**
   * A HEX color value for customizing the background color of the webview.
   */
  backgroundColor: string;
  /**
   * A HEX color value for customizing the background color of the webview header.
   */
  headerBackgroundColor: string;
  /**
   * A HEX color value for customizing the text color of the webview header.
   */
  headerTextColor: string;
}

interface AndroidColorSchemeNonAutomatic {
  colorScheme: ColorScheme.web | ColorScheme.light | ColorScheme.dark;
  android: {
    colors: AndroidColors;
  };
}

interface AndroidColorSchemeAutomatic {
  colorScheme: ColorScheme.automatic;
  android: {
    colors: {
      light: AndroidColors;
      dark: AndroidColors;
    };
  };
}

type AndroidConfigurationOptions =
  | AndroidColorSchemeNonAutomatic
  | AndroidColorSchemeAutomatic
  | CommonConfigurationOptions;

interface CommonConfigurationOptions {
  /**
   * The selected color scheme for the checkout. See README.md for more details.
   */
  colorScheme?: ColorScheme;
  /**
   * Enable/disable preloading for checkout. This option must be enabled for `.preload()` to work as expected.
   */
  preloading?: boolean;
}

export type Configuration = CommonConfigurationOptions &
  AndroidConfigurationOptions &
  IosConfigurationOptions;

export interface ShopifyCheckoutKit {
  /**
   * The version number of the Shopify Checkout SDK.
   */
  version: string;
  /**
   * Preload the checkout for faster presentation.
   */
  preload(checkoutURL: string): void;
  /**
   * Present the checkout.
   */
  present(checkoutURL: string): void;
  /**
   * Configure the checkout. See README.md for more details.
   */
  configure(config: Configuration): void;
  /**
   * Return the current config for the checkout. See README.md for more details.
   */
  getConfig(): Promise<Configuration>;
}
