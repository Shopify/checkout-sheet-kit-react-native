import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {cp, mkdir, readFile, realpath, rm, symlink, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const root = fileURLToPath(new URL('..', import.meta.url));
const moduleRoot = join(root, 'modules/@shopify/checkout-sheet-kit');
const manifest = JSON.parse(
  await readFile(join(moduleRoot, 'package.json'), 'utf8'),
);
const {values} = parseArgs({
  options: {
    configuration: {
      type: 'string',
      multiple: true,
      default: ['Debug', 'Release'],
    },
    destination: {type: 'string'},
    'prepare-only': {type: 'boolean', default: false},
  },
});

assert.equal(process.platform, 'darwin', 'The SwiftPM consumer requires Xcode');
for (const configuration of values.configuration) {
  assert.ok(
    ['Debug', 'Release'].includes(configuration),
    'Use Debug or Release',
  );
}

const consumer = join(root, 'build/swiftpm-consumer');
await rm(consumer, {recursive: true, force: true});
await cp(join(root, 'test/swiftpm-consumer'), consumer, {recursive: true});
const installed = join(consumer, 'node_modules', manifest.name);
await rm(installed, {recursive: true, force: true});
await mkdir(installed, {recursive: true});
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--pack-destination', consumer, '--json'], {
    cwd: moduleRoot,
    encoding: 'utf8',
    env: {...process.env, npm_config_cache: join(consumer, '.npm-cache')},
  }),
);
execFileSync('tar', [
  '-xzf',
  join(consumer, packed.filename),
  '--strip-components=1',
  '-C',
  installed,
]);
for (const name of ['react', 'react-native', '@babel/runtime']) {
  const destination = join(consumer, 'node_modules', name);
  await mkdir(dirname(destination), {recursive: true});
  await symlink(await realpath(join(root, 'node_modules', name)), destination);
}
const require = createRequire(import.meta.url);
await writeFile(
  join(consumer, 'package.json'),
  JSON.stringify({
    name: 'checkout-sheet-kit-swiftpm-consumer',
    version: '0.0.0',
    private: true,
    dependencies: {
      [manifest.name]: manifest.version,
      react: require('react/package.json').version,
      'react-native': require('react-native/package.json').version,
    },
  }),
);
await writeFile(
  join(consumer, 'babel.config.cjs'),
  'module.exports = {presets: [' +
    JSON.stringify(require.resolve('@react-native/babel-preset')) +
    ']};\n',
);
await writeFile(join(consumer, 'main.jsbundle'), '');
execFileSync('xcodegen', ['generate', '--spec', 'project.yml'], {
  cwd: consumer,
  stdio: 'inherit',
});
const project = 'CheckoutSheetKitSwiftPMConsumer.xcodeproj';
const resolutionDirectory = join(
  consumer,
  project,
  'project.xcworkspace/xcshareddata/swiftpm',
);
await mkdir(resolutionDirectory, {recursive: true});
await cp(
  join(consumer, 'Package.resolved'),
  join(resolutionDirectory, 'Package.resolved'),
);
execFileSync(
  process.execPath,
  [
    require.resolve('react-native/scripts/setup-apple-spm'),
    'add',
    '--xcodeproj',
    project,
    '--productName',
    'CheckoutSheetKitSwiftPMConsumer',
    '--yes',
  ],
  {cwd: consumer, stdio: 'inherit'},
);
const projectContents = await readFile(
  join(consumer, project, 'project.pbxproj'),
  'utf8',
);
assert.doesNotMatch(
  projectContents,
  /\[CP\]/,
  'The consumer must not contain CocoaPods build phases',
);
const pins = JSON.parse(
  await readFile(join(resolutionDirectory, 'Package.resolved'), 'utf8'),
);
assert.equal(
  pins.pins.find(pin => pin.identity === 'checkout-sheet-kit-swift')?.state
    .version,
  manifest.checkoutKit.nativeSdkVersions.ios,
);
if (values['prepare-only']) process.exit(0);

const devices = JSON.parse(
  execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
    encoding: 'utf8',
  }),
);
const simulators = Object.entries(devices.devices)
  .filter(([runtime]) => runtime.includes('.iOS-'))
  .flatMap(([, entries]) => entries);
const simulator =
  simulators.find(device => device.state === 'Booted') ?? simulators[0];
const destination =
  values.destination ??
  `id=${process.env.CURRENT_SIMULATOR_UUID ?? simulator?.udid}`;
assert.ok(!destination.includes('undefined'), 'No available iOS simulator');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const Metro = require('metro');
for (const configuration of values.configuration) {
  const config = mergeConfig(getDefaultConfig(consumer), {
    projectRoot: consumer,
    watchFolders: [consumer, join(root, 'node_modules')],
    maxWorkers: 2,
    resolver: {useWatchman: false},
    reporter: {update() {}},
  });
  await Metro.runBuild(config, {
    entry: join(consumer, 'index.js'),
    bundleOut: join(consumer, 'main.jsbundle'),
    platform: 'ios',
    dev: configuration === 'Debug',
    minify: configuration === 'Release',
  });
  assert.ok((await readFile(join(consumer, 'main.jsbundle'))).length > 0);
  execFileSync(
    'xcodebuild',
    [
      'test',
      '-quiet',
      '-project',
      project,
      '-scheme',
      'CheckoutSheetKitSwiftPMConsumer',
      '-configuration',
      configuration,
      '-sdk',
      'iphonesimulator',
      '-destination',
      destination,
      '-parallel-testing-enabled',
      'NO',
      '-collect-test-diagnostics',
      'never',
      '-derivedDataPath',
      join(consumer, 'DerivedData'),
      '-resultBundlePath',
      join(consumer, `${configuration}.xcresult`),
      '-disableAutomaticPackageResolution',
      '-onlyUsePackageVersionsFromResolvedFile',
      'CODE_SIGNING_ALLOWED=NO',
    ],
    {cwd: consumer, stdio: 'inherit'},
  );
}
