# Release

The `@shopify/checkout-sheet-kit` module is published to the NPM package
registry with public access.

In order to publish a new version of the package, you must complete the
following steps:

1. Bump the version in `modules/@shopify/checkout-sheet-kit/package.json` to an
   appropriate value.
2. Add a [Changelog](./CHANGELOG.md) entry.
3. Merge your PR to `main`.
4. Create a [Release](/releases) for your new version.

Creating and publishing a Github release with begin the automated process of
publishing the latest version of the package to NPM. It will clean the module
folder, build a new version, run `npm pack --dry-run` to verify the contents and
publish to the NPM registry.

You can follow the release action process via
https://github.com/Shopify/checkout-sheet-kit-react-native/actions/workflows/publish.yml.
