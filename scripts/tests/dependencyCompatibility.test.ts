import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../..');
const navigationRequire = createRequire(
  require.resolve('@react-navigation/core'),
);
const queryStringPath = navigationRequire.resolve('query-string');
const iosCliRequire = createRequire(
  require.resolve('@react-native-community/cli-platform-ios'),
);
const iosSchemeParserPath = path.join(
  path.dirname(
    iosCliRequire.resolve('@react-native-community/cli-platform-apple'),
  ),
  'tools/getBuildConfigurationFromXcScheme.js',
);
const androidCliRequire = createRequire(
  require.resolve('@react-native-community/cli-platform-android'),
);
const androidManifestParserPath = path.join(
  path.dirname(
    androidCliRequire.resolve('@react-native-community/cli-config-android'),
  ),
  'config/getMainActivity.js',
);

function runNodeScript(
  script: string,
  scriptArguments: string[] = [],
  input?: string,
) {
  return execFileSync(
    process.execPath,
    ['--eval', script, ...scriptArguments],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      timeout: 5000,
      input,
    },
  );
}

function parseQuery(query: string) {
  return JSON.parse(
    runNodeScript(
      'process.stdout.write(JSON.stringify(require(process.argv[1]).parse(require("node:fs").readFileSync(0, "utf8"))))',
      [queryStringPath],
      query,
    ),
  );
}

describe('dependency compatibility', () => {
  describe('navigation query parsing', () => {
    it('decodes Unicode, spaces, literal plus signs and repeated parameters', () => {
      expect(
        parseQuery(
          'name=caf%C3%A9&payment=Shop+Pay&symbol=%2B&item=one&item=two',
        ),
      ).toEqual({
        name: 'café',
        payment: 'Shop Pay',
        symbol: '+',
        item: ['one', 'two'],
      });
    });

    it('preserves malformed percent encodings', () => {
      expect(parseQuery('value=%E0%A4%A')).toEqual({value: '%E0%A4%A'});
    });

    it('handles long malformed UTF-8 input without blocking navigation', () => {
      const encodedValue = '%FF%E2%82%AC'.repeat(4096);
      const decodedValue = '%FF€'.repeat(4096);

      expect(parseQuery(`value=${encodedValue}`)).toEqual({
        value: decodedValue,
      });
    }, 10000);

    it('preserves query serialization for navigation paths', () => {
      expect(
        runNodeScript(
          'process.stdout.write(require(process.argv[1]).stringify({payment: "Shop Pay", symbol: "+", item: ["one", "two"]}, {sort: false}))',
          [queryStringPath],
        ),
      ).toBe('payment=Shop%20Pay&symbol=%2B&item=one&item=two');
    });
  });

  it('reads the iOS launch configuration through the React Native CLI', () => {
    expect(
      runNodeScript(
        'process.stdout.write(require(process.argv[1]).getBuildConfigurationFromXcScheme("ReactNative", "Release", process.argv[2], {schemes: ["ReactNative"]}))',
        [iosSchemeParserPath, path.join(repositoryRoot, 'sample/ios')],
      ),
    ).toBe('Debug');
  });

  it('reads the Android launch activity through the React Native CLI', () => {
    expect(
      runNodeScript(
        'process.stdout.write(require(process.argv[1]).default(process.argv[2]))',
        [
          androidManifestParserPath,
          path.join(
            repositoryRoot,
            'sample/android/app/src/main/AndroidManifest.template.xml',
          ),
        ],
      ),
    ).toBe('.MainActivity');
  });

  it('resolves the Turbo build task without changing environment forwarding', () => {
    const taskGraph = JSON.parse(
      execFileSync(
        process.execPath,
        [require.resolve('turbo'), 'run', 'build', '--dry=json'],
        {
          cwd: repositoryRoot,
          encoding: 'utf8',
          timeout: 10000,
          env: {...process.env, TURBO_TELEMETRY_DISABLED: '1'},
        },
      ),
    );

    expect(taskGraph.envMode).toBe('loose');
    expect(taskGraph.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taskId: '@shopify/checkout-sheet-kit#build',
          envMode: 'loose',
        }),
      ]),
    );
  });
});
