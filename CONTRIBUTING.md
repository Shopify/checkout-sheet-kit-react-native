# Contributing

This repo is subdivided into 3 parts using yarn workspaces:

- The base repo (workspace name = `checkout-sheet-kit-react-native`)
- The `@shopify/checkout-sheet-kit` Native Module (workspace name = `module`)
- The sample application (workspace name = `sample`)

Each of the worksapces contains a separate `package.json` to manage tasks
specific to each workspace.

## Getting started

If you've cloned the repo and want to run the sample app, you will first need
to:

1. Install the NPM dependencies
2. Install iOS dependencies (cocoapods)
3. Build the Native Module

```sh
# Install NPM dependencies and link local module
yarn

# Install Cocoapods for iOS
yarn pod-install sample/ios
# Note: Android dependencies are automatically installed by Gradle

# Build the Native Module JS
yarn module build
```

If all of these steps have succeeded, you can now run the sample app with:

```sh
yarn sample start
```

This command will start the Metro server. Follow the steps given by Metro to
open both the iOS and Android simulators/emulators respectively.

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
