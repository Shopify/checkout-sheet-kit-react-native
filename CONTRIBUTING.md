# Contributing

We welcome code contributions, feature requests, and reporting of issues. Please
see [guidelines and instructions](.github/CONTRIBUTING.md).

---

This repo is subdivided into 3 parts using pnpm workspaces:

- The base repo (workspace name = `checkout-kit-react-native`)
- The `@shopify/checkout-kit` Native Module (workspace name = `module`)
- The sample application (workspace name = `sample`)

Each of the workspaces contains a separate `package.json` to manage tasks
specific to each workspace.

## Getting started

If you've cloned the repo and want to run the sample app, you will first need to:

1. Install the NPM dependencies

   ```sh
   pnpm install
   ```

2. Install iOS dependencies. (N.b. Android dependencies are automatically installed by Gradle)

   ```sh
   pnpm pod-install sample/ios
   ```

3. Build the Native Module

   ```sh
   pnpm module build
   ```

4. Start the Metro server

   ```sh
   pnpm sample start
   ```

5. Run the sample application (in a new terminal / tab)

   ```sh
   pnpm sample ios
   # or
   pnpm sample android
   ```

## Optional: Speed up builds with sccache

For faster native compilation (especially on incremental builds), you can install [sccache](https://github.com/mozilla/sccache), a shared compilation cache:

```sh
# macOS (using Homebrew)
brew install sccache

# Ubuntu/Debian
cargo install sccache

# Other systems: see https://github.com/mozilla/sccache#installation
```

The build scripts will automatically detect and use sccache if available. On Android, React Native's CMake files look for a command named `ccache`, so the sample Android scripts put an sccache-backed compatibility command first on `PATH`. If you encounter any build issues, you can temporarily disable it:

```sh
# Disable sccache for a single build
SCCACHE=false pnpm sample ios
SCCACHE=false pnpm sample android
```

## Making changes to the Native Module

If your intentions are to modify the TS code for the Native Module under
`modules/@shopify/checkout-kit`, note that you will not need to rebuild to
observe your changes in the sample app. This is because the sample app is
importing the TS files directly from the module directory (through symlinking).

However, if you're running the iOS/Android tests against the module, you will
first need to run `pnpm module build` each time you change the TS code.

## Cleaning the workspaces

There are a handful of commands to clean the individual workspaces.

```sh
# Clear the current directory from watchman
pnpm clean

# Removes the "sample/node_modules" directory
# Removes "ios/pods" directory
# Removes "ios/build" directory
pnpm sample clean

# Removes the "lib" directory for the Native Module
pnpm module clean
```

## Linting the code

Linting the codespaces will (1) compile the code with TypeScript and (2) run
eslint over the source code.

```sh
# Lint the Native Module TS code
pnpm module lint

# Lint the Sample App TS code
pnpm sample lint
```

## Testing

There are 3 types of tests in this repo: Typescript, Swift and Java - each for
testing the Native Module.

```sh
# Run Jest tests for "modules/@shopify/checkout-kit/src/**/*.tsx"
pnpm test

# Run swift tests for the Native Module
pnpm sample test:ios

# Run Java tests for the Native Module
pnpm sample test:android
```

## Running the sample app

To run the sample app in this repo, first clone the repo and run the following
commands at the root of the project directory.

### Install NPM dependencies

```sh
pnpm install
```

### Install Cocoapods

```sh
pnpm pod-install sample/ios
```

### Build the local module

```sh
pnpm module build
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
pnpm sample start
```
