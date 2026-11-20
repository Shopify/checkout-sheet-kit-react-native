import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {after, before, test} from 'node:test';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('..', import.meta.url));
const moduleRoot = join(root, 'modules/@shopify/checkout-sheet-kit');
let consumer;
let installed;
let files;

before(async () => {
  consumer = await mkdtemp(join(tmpdir(), 'checkout-sheet-kit-package-'));
  installed = join(consumer, 'package');
  await mkdir(installed);
  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--pack-destination', consumer, '--json'], {
      cwd: moduleRoot,
      encoding: 'utf8',
      env: {...process.env, npm_config_cache: join(consumer, '.npm-cache')},
    }),
  );
  files = packed.files.map(file => file.path);
  execFileSync('tar', [
    '-xzf',
    join(consumer, packed.filename),
    '-C',
    consumer,
  ]);
});

after(async () => {
  if (consumer) await rm(consumer, {recursive: true, force: true});
});

test('packed package supplies its SwiftPM autolinking manifest', async () => {
  const manifest = JSON.parse(
    await readFile(join(installed, 'package.json'), 'utf8'),
  );
  assert.equal(manifest.swiftpmConfig?.name, 'CheckoutSheetKitReactNative');
  assert.match(manifest.checkoutKit?.nativeSdkVersions?.ios, /^3\.\d+\.\d+$/);
  assert.match(
    await readFile(join(installed, 'ios/Package.swift'), 'utf8'),
    /^\/\/ swift-tools-version:/,
  );
});

test('packed native specs generate the existing module and component', async () => {
  const schemaPath = join(consumer, 'schema.json');
  execFileSync(process.execPath, [
    require.resolve(
      '@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
    ),
    schemaPath,
    join(installed, 'src/specs'),
  ]);
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  assert.equal(
    schema.modules.NativeShopifyCheckoutSheetKit.type,
    'NativeModule',
  );
  assert.equal(schema.modules.RCTAcceleratedCheckoutButtons.type, 'Component');
});

test('published files exclude the consumer, generated projects and caches', () => {
  assert.ok(files.includes('RNShopifyCheckoutSheetKit.podspec'));
  for (const path of files) {
    assert.doesNotMatch(
      path,
      /(^|\/)(node_modules|build|test|tests|\.build|\.swiftpm)(\/|$)|\.xcodeproj\//,
    );
  }
});

test('CocoaPods uses the same SDK pin and excludes the SwiftPM manifest', async () => {
  const manifest = JSON.parse(
    await readFile(join(installed, 'package.json'), 'utf8'),
  );
  const result = JSON.parse(
    execFileSync(
      'ruby',
      [
        '-rjson',
        '-e',
        `
      module Pod
        class Spec
          def initialize
            @attributes = {}
            @dependencies = {}
            yield self
            files = Dir.glob(@attributes.fetch('source_files'))
            files -= Dir.glob(@attributes.fetch('exclude_files', []))
            puts JSON.generate(files: files, dependencies: @dependencies)
          end
          def dependency(name, *versions)
            @dependencies[name] = versions
          end
          def method_missing(name, *arguments)
            @attributes[name.to_s.delete_suffix('=')] = arguments.first
          end
        end
      end
      load './RNShopifyCheckoutSheetKit.podspec'
    `,
      ],
      {
        cwd: installed,
        encoding: 'utf8',
        env: {...process.env, RCT_NEW_ARCH_ENABLED: '0'},
      },
    ),
  );
  assert.ok(result.files.includes('ios/ShopifyCheckoutSheetKit.swift'));
  assert.ok(result.files.includes('ios/ShopifyCheckoutSheetKit.mm'));
  assert.ok(!result.files.includes('ios/Package.swift'));
  for (const product of [
    'ShopifyCheckoutSheetKit',
    'ShopifyCheckoutSheetKit/AcceleratedCheckouts',
  ]) {
    assert.deepEqual(result.dependencies[product], [
      `= ${manifest.checkoutKit.nativeSdkVersions.ios}`,
    ]);
  }
});
