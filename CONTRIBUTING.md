# Contributing

This repo is subdivided into 3 parts using yarn workspaces:

- The base repo (workspace name = `checkout-kit-react-native`)
- The `react-native-shopify-checkout-kit` Native Module (workspace name = `module`)
- The sample application (workspace name = `sample`)

Each of the worksapces contains a separate `package.json` to manage tasks specific to each workspace.

## Base repo

## Install dependencies

Run `yarn` to install the dependencies for all workspaces in the repo.

---

## `react-native-shopify-checkout-kit` Module

### Clean the modules folder

```bash
yarn module clean
```

### Build the `react-native-shopify-checkout-kit` module

```sh
yarn module build
```

### Lint the module

```sh
yarn module lint
```

---

## Sample application

## Start the sample application

### For Android

```bash
# Start the Metro server
yarn sample start

# Start the Metro server and run the Android sample application
yarn sample android

# Start the Metro server and run the iOS sample application
yarn sample android
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Lint the sample application

```sh
yarn sample lint
```
