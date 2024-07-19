# Contributing

The following is a set of guidelines for contributing to the project. Please
take a moment to read through them before submitting your first PR.

## Code of Conduct

This project and everyone participating in it are governed by the
[Code of Conduct](/.github/CODE_OF_CONDUCT.md). By participating, you are
expected to uphold this code. Please report unacceptable behavior to
[opensource@shopify.com](mailto:opensource@shopify.com).

## Welcomed Contributions

- Reporting issues with existing features
- Bug fixes
- Performance improvements
- Documentation
- Usability Improvements

## Things we won't merge

- Additional dependencies that limit sdk use (e.g. swift dependencies)
- Any changes that break existing tests
- Any changes without sufficient tests

## Proposing Features

When in doubt about whether we will be interested in including a new feature in
this project, please open an issue to propose the feature so we can confirm the
feature should be in scope for the project before it is implemented.

**NOTE**: Issues that have not been active for 30 days will be marked as stale,
and subsequently closed after a further 7 days of inactivity.

## How To Contribute

1. Fork the repo and branch off of main
2. Create a feature branch in your fork
3. Make changes and add any relevant relevant tests
4. Verify the changes locally (e.g. via the sample app)
5. Commit your changes and push
6. Ensure all checks (e.g. tests) are passing in GitHub
7. Create a new pull request with a detailed description of what is changing and
   why

## Releasing a new version

Open a pull request with the following changes:

1. Bump the
   [package version](https://github.com/Shopify/checkout-sheet-kit-react-native/blob/main/modules/%40shopify/checkout-sheet-kit/package.json#L4)
   of the `@shopify/checkout-sheet-kit` module.
2. Add an entry to the top of the [CHANGELOG](../CHANGELOG.md)

Once you have merged a pull request with these changes, you will be ready to
publish a new version.

To do so, navigate to
<https://github.com/Shopify/checkout-sheet-kit-react-native/releases> and click
"Draft a new release" then complete the following steps:

1. Create a tag for the new version
2. Use the same tag as the name for the version
3. Document a full list of changes since the previous release, tagging merged
   pull requests where applicable, in the description box.
4. Check "Set as the latest release".
5. When ready, click "Publish release". This will kickstart the
   [CI process](https://github.com/Shopify/checkout-sheet-kit-react-native/actions/workflows/publish.yml)
   to publish a new version of the NPM package.
