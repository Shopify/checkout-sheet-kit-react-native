# Expo Config Plugin

This package includes an Expo config plugin that allows you to configure the AcceleratedCheckouts feature for iOS in managed Expo apps.

## Usage

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "@shopify/checkout-sheet-kit",
        {
          "enableAcceleratedCheckouts": true
        }
      ]
    ]
  }
}
```

After adding the plugin, regenerate your native projects:

```sh
npx expo prebuild --clean
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableAcceleratedCheckouts` | `boolean` | `false` | Whether to include the AcceleratedCheckouts subspec for Shop Pay and Apple Pay buttons |

## How It Works

The config plugin uses Expo's `withDangerousMod` to modify your iOS `Podfile` during the prebuild process:

1. **When `enableAcceleratedCheckouts: true`**:
   - Searches for the `RNShopifyCheckoutSheetKit` pod declaration in your Podfile
   - Updates it to use the `AcceleratedCheckouts` subspec
   - Example: `pod 'RNShopifyCheckoutSheetKit/AcceleratedCheckouts', :path => '...'`

2. **When `enableAcceleratedCheckouts: false` (or omitted)**:
   - Ensures the Podfile uses the default Core subspec only
   - Example: `pod 'RNShopifyCheckoutSheetKit', :path => '...'`

## Technical Details

### Plugin Implementation

The plugin (`app.plugin.js`) performs the following operations:

1. Locates the `Podfile` in your iOS project root
2. Uses regex patterns to detect existing pod configurations:
   - Core-only: `pod 'RNShopifyCheckoutSheetKit'`
   - With AcceleratedCheckouts: `pod 'RNShopifyCheckoutSheetKit/AcceleratedCheckouts'`
3. Modifies the Podfile content based on the `enableAcceleratedCheckouts` setting
4. Writes the updated content back to the Podfile

### Why Use a Config Plugin?

Expo's autolinking mechanism doesn't natively support CocoaPods subspecs. Without this plugin, managed Expo apps would always get the default (Core-only) subspec. The config plugin bridges this gap by programmatically modifying the Podfile during the prebuild process.

### Bare Workflow Alternative

If you're using Expo's bare workflow or a standard React Native app, you can skip the config plugin and directly modify your `ios/Podfile`:

```ruby
# ios/Podfile
pod "RNShopifyCheckoutSheetKit/AcceleratedCheckouts", :path => "../node_modules/@shopify/checkout-sheet-kit"
```

## Troubleshooting

### Plugin not taking effect

Make sure to run `npx expo prebuild --clean` after modifying your plugin configuration. The `--clean` flag ensures the iOS project is regenerated from scratch.

### CocoaPods errors after prebuild

If you encounter CocoaPods errors, try:

```sh
cd ios
pod install --repo-update
cd ..
```

### Verifying the configuration

After running prebuild, check your `ios/Podfile` to verify the correct subspec is being used:

```sh
grep "RNShopifyCheckoutSheetKit" ios/Podfile
```

Expected output with AcceleratedCheckouts enabled:
```
pod 'RNShopifyCheckoutSheetKit/AcceleratedCheckouts', :path => '../node_modules/@shopify/checkout-sheet-kit'
```

## Development

To test the plugin locally during development:

1. Make changes to `app.plugin.js`
2. Run `npx expo prebuild --clean` in your test app
3. Verify the Podfile changes are correct
4. Run `pod install` in the iOS directory
5. Build and test the app

## Related Documentation

- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [CocoaPods Subspecs](https://guides.cocoapods.org/syntax/podspec.html#subspec)
- [Shopify Checkout Kit Documentation](https://github.com/Shopify/checkout-sheet-kit-react-native)
