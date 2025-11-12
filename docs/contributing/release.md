# Release

The `@shopify/checkout-sheet-kit` module is published to NPM with public access.

## Preparing for a release

Before creating a release, ensure the following version strings are updated and synchronized:

1. Bump the [package version](https://github.com/Shopify/checkout-sheet-kit-react-native/blob/main/modules/%40shopify/checkout-sheet-kit/package.json#L4)

**Important**: The version in `package.json` must match the Git tag exactly, including any pre-release suffixes (e.g., `-alpha.1`, `-beta.1`, `-rc.1`).

### Version format

- **Production releases**: `X.Y.Z` (e.g., `3.5.0`)
- **Pre-releases**: `X.Y.Z-{alpha|beta|rc}.N` (e.g., `3.5.0-alpha.1`, `3.5.0-beta.2`, `3.5.0-rc.1`)

Pre-release suffixes ensure npm users must explicitly opt-in to install pre-release versions.

## Creating a release

Navigate to https://github.com/Shopify/checkout-sheet-kit-react-native/releases and click "Draft a new release", then complete the following steps:

### For production releases (from `main` branch):

1. Ensure you're on the `main` branch
2. Create a tag for the new version (e.g., `3.5.0`)
3. Use the same tag as the release title
4. Document the full list of changes since the previous release, tagging merged pull requests where applicable
5. ✅ Check "Set as the latest release"
6. Click "Publish release"

### For pre-releases (from non-`main` branch):

1. Ensure you're on a feature/release branch (NOT `main`)
2. Create a tag with a pre-release suffix (e.g., `3.5.0-alpha.1`, `3.5.0-beta.1`, `3.5.0-rc.2`)
3. Use the same tag as the release title
4. Document the changes being tested in this pre-release
5. ✅ Check "Set as a pre-release" (NOT "Set as the latest release")
6. Click "Publish release"

## What happens after publishing

When you publish a release (production or pre-release), the [publish workflow](https://github.com/Shopify/checkout-sheet-kit-react-native/actions/workflows/publish.yml) will automatically:

1. **Validate versions**: Ensures `package.json` version matches the git tag
2. **Determine npm tag**: Pre-releases (`-alpha`, `-beta`, `-rc`) publish to `next` tag, production releases publish to `latest` tag
3. **Build and publish**: Publishes the version to npm

## Using pre-releases

For users to install a pre-release version:

**npm** - Must specify the exact version or use the `next` tag:
```bash
npm install @shopify/checkout-sheet-kit@3.5.0-beta.1
# or
npm install @shopify/checkout-sheet-kit@next
```

**CocoaPods** - Must specify the exact version in Podfile:
```ruby
pod 'RNShopifyCheckoutSheetKit', '3.5.0-beta.1'
```

## Troubleshooting

**Version mismatch error**: Update `package.json` to match the git tag, then recreate the release.

**Pre-release not on npm**: Verify version has suffix (`-alpha.1`, `-beta.1`, `-rc.1`) and "Set as a pre-release" was checked.

**Wrong npm tag**: Manually fix with `npm dist-tag add @shopify/checkout-sheet-kit@3.5.0 latest`
