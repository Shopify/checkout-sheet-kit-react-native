const {
  withDangerousMod,
  withPlugins,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const pkg = require('./package.json');

const withAcceleratedCheckouts = (config, props = {}) => {
  const enableAcceleratedCheckouts = props.enableAcceleratedCheckouts ?? false;

  return withDangerousMod(config, [
    'ios',
    async config => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      );

      if (!fs.existsSync(podfilePath)) {
        throw new Error(
          `[@shopify/checkout-sheet-kit] Could not find Podfile at ${podfilePath}`,
        );
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');

      const coreSubspecPattern =
        /pod\s+['"]RNShopifyCheckoutSheetKit['"]\s*,\s*:path\s*=>\s*['"][^'"]*['"]/;
      const acceleratedSubspecPattern =
        /pod\s+['"]RNShopifyCheckoutSheetKit\/AcceleratedCheckouts['"]\s*,\s*:path\s*=>\s*['"][^'"]*['"]/;

      const hasCoreSubspec = coreSubspecPattern.test(podfileContent);
      const hasAcceleratedSubspec =
        acceleratedSubspecPattern.test(podfileContent);
      const hasAutolinkedPod =
        !hasCoreSubspec &&
        !hasAcceleratedSubspec &&
        /pod\s+['"]RNShopifyCheckoutSheetKit['"]/.test(podfileContent);

      if (enableAcceleratedCheckouts) {
        if (hasCoreSubspec) {
          podfileContent = podfileContent.replace(
            coreSubspecPattern,
            match => {
              return match.replace(
                'RNShopifyCheckoutSheetKit',
                'RNShopifyCheckoutSheetKit/AcceleratedCheckouts',
              );
            },
          );
          fs.writeFileSync(podfilePath, podfileContent, 'utf8');
          console.log(
            '[@shopify/checkout-sheet-kit] Updated Podfile to use AcceleratedCheckouts subspec',
          );
        } else if (!hasAcceleratedSubspec && hasAutolinkedPod) {
          podfileContent = podfileContent.replace(
            /pod\s+['"]RNShopifyCheckoutSheetKit['"]\s*,\s*:path\s*=>\s*['"]([^'"]*)['"]/,
            `pod 'RNShopifyCheckoutSheetKit/AcceleratedCheckouts', :path => '$1'`,
          );
          fs.writeFileSync(podfilePath, podfileContent, 'utf8');
          console.log(
            '[@shopify/checkout-sheet-kit] Updated Podfile to use AcceleratedCheckouts subspec',
          );
        }
      } else {
        if (hasAcceleratedSubspec) {
          podfileContent = podfileContent.replace(
            acceleratedSubspecPattern,
            match => {
              return match.replace(
                'RNShopifyCheckoutSheetKit/AcceleratedCheckouts',
                'RNShopifyCheckoutSheetKit',
              );
            },
          );
          fs.writeFileSync(podfilePath, podfileContent, 'utf8');
          console.log(
            '[@shopify/checkout-sheet-kit] Updated Podfile to use Core subspec only',
          );
        }
      }

      return config;
    },
  ]);
};

module.exports = createRunOncePlugin(
  withAcceleratedCheckouts,
  pkg.name,
  pkg.version,
);
