const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const path = require('node:path');
const {test} = require('node:test');
const vm = require('node:vm');

const launcherPath = require.resolve(
  '@react-native-community/cli-platform-apple/build/commands/runCommand/runOnSimulator',
);
const developerDirectory = '/Applications/Xcode.app/Contents/Developer';
const simulatorApp = `${developerDirectory}/Applications/Simulator.app`;
const deviceHubApp = path.join(
  developerDirectory,
  '../Applications/DeviceHub.app',
);

async function launch(availableApps) {
  const calls = [];
  const exports = {};
  const dependencies = {
    child_process: {
      execFileSync(command, args) {
        if (command === 'xcode-select') {
          return developerDirectory;
        }
        if (command === 'open' && args[0].endsWith('.app')) {
          assert.ok(availableApps.includes(args[0]), `Missing app: ${args[0]}`);
        }
        calls.push([command, Array.from(args)]);
      },
    },
    fs: {existsSync: filename => availableApps.includes(filename)},
    path,
    '@react-native-community/cli-tools': {},
    '../buildCommand/buildProject': {
      buildProject: async () => calls.push(['build']),
    },
    './matchingDevice': {},
    './installApp': () => calls.push(['install']),
  };
  vm.runInNewContext(readFileSync(launcherPath, 'utf8'), {
    exports,
    require(name) {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  await exports.runOnSimulator(
    {},
    'ios',
    'Debug',
    'ReactNative',
    {},
    {
      udid: 'test-device',
      state: 'Booted',
    },
  );
  return calls;
}

test('opens Simulator on older Xcode and continues to build and install', async () => {
  assert.deepEqual(await launch([simulatorApp]), [
    ['open', [simulatorApp, '--args', '-CurrentDeviceUDID', 'test-device']],
    ['build'],
    ['install'],
  ]);
});

test('opens the selected device in Device Hub when Simulator is absent', async () => {
  assert.deepEqual(await launch([deviceHubApp]), [
    ['open', ['devices://device/open?id=test-device']],
    ['build'],
    ['install'],
  ]);
});
