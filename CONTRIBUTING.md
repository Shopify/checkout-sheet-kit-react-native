# Contributing

We welcome code contributions, feature requests, and reporting of issues. Please
see [guidelines and instructions](.github/CONTRIBUTING.md).

For information about creating releases and publishing new versions, see the
[Release Documentation](docs/contributing/release.md).

---

This repo is subdivided into 3 parts using yarn workspaces:

- The base repo (workspace name = `checkout-sheet-kit-react-native`)
- The `@shopify/checkout-sheet-kit` Native Module (workspace name = `module`)
- The sample application (workspace name = `sample`)

Each of the workspaces contains a separate `package.json` to manage tasks
specific to each workspace.

## Getting started

If you've cloned the repo and want to run the sample app, you will first need to:

1. Install the NPM dependencies

   ```sh
   yarn
   ```

2. Install iOS dependencies. (N.b. Android dependencies are automatically installed by Gradle)

   ```sh
   yarn pod-install sample/ios
   ```

3. Build the Native Module

   ```sh
   yarn module build
   ```

4. Start the Metro server

   ```sh
   yarn sample start
   ```

5. Run the sample application (in a new terminal / tab)

   ```sh
   yarn sample ios
   # or
   yarn sample android
   ```

## Optional: Speed up builds with ccache

For faster native compilation (especially on incremental builds), you can install [ccache](https://ccache.dev/), a compiler cache:

```sh
# macOS (using Homebrew)
brew install ccache

# Ubuntu/Debian
sudo apt-get install ccache

# Other systems: see https://ccache.dev/download.html
```

The build scripts will automatically detect and use ccache if available. If you encounter any build issues, you can temporarily disable it:

```sh
# Disable ccache for a single build
CCACHE=false yarn sample ios
CCACHE=false yarn sample android
```

## Making changes to the Native Module

If your intentions are to modify the TS code for the Native Module under
`modules/@shopify/checkout-sheet-kit`, note that you will not need to rebuild to
observe your changes in the sample app. This is because the sample app is
importing the TS files directly from the module directory (through symlinking).

However, if you're running the iOS/Android tests against the module, you will
first need to run `yarn module build` each time you change the TS code.

## Cleaning the workspaces

There are a handful of commands to clean the individual workspaces.

```sh
# Clear the current directory from watchman
yarn clean

# Removes the "sample/node_modules" directory
# Removes "ios/pods" directory
# Removes "ios/build" directory
yarn sample clean

# Removes the "lib" directory for the Native Module
yarn module clean
```

## Linting the code

Linting the codespaces will (1) compile the code with TypeScript and (2) run
eslint over the source code.

```sh
# Lint the Native Module TS code
yarn module lint

# Lint the Sample App TS code
yarn sample lint
```

## Testing

There are 3 types of tests in this repo: Typescript, Swift and Java - each for
testing the Native Module.

```sh
# Run Jest tests for "modules/@shopify/checkout-sheet-kit/src/**/*.tsx"
yarn test

# Run swift tests for the Native Module
yarn sample test:ios

# Run Java tests for the Native Module
yarn sample test:android
```

## Running the sample app

To run the sample app in this repo, first clone the repo and run the following
commands at the root of the project directory.

### Install NPM dependencies

```sh
yarn
```

### Install Cocoapods

```sh
yarn pod-install sample/ios
```

### Build the local module

```sh
yarn module build
```

### Update the dotenv file

Replace the details in the `sample/.env.example` file and rename it to
`sample/.env`

```
# Storefront Details
STOREFRONT_DOMAIN="YOUR_STORE.myshopify.com"
STOREFRONT_ACCESS_TOKEN="YOUR_PUBLIC_STOREFRONT_ACCESS_TOKEN"
STOREFRONT_VERSION="2025-07"
```

### Start the sample app

```sh
yarn sample start
```
