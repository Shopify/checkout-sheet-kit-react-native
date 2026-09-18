import {execFileSync, spawnSync} from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {devNull, tmpdir} from 'node:os';
import path from 'node:path';

const scriptPath = path.resolve(__dirname, '../copy_license');
const modulePath = 'modules/@shopify/checkout-sheet-kit';
const licenseContent = 'Test license\n';
const sourceContent = 'class Source {}\n';
const subprocessEnvironment = {
  ...process.env,
  GIT_CONFIG_GLOBAL: devNull,
  GIT_CONFIG_NOSYSTEM: '1',
};

let repositoryRoot: string;

function writeRepositoryFile(relativePath: string, content: string) {
  const filePath = path.join(repositoryRoot, relativePath);
  mkdirSync(path.dirname(filePath), {recursive: true});
  writeFileSync(filePath, content);
  return filePath;
}

function runCopyLicense(commandArguments: string[] = []) {
  const result = spawnSync('ruby', [scriptPath, ...commandArguments], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 5000,
    env: subprocessEnvironment,
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

beforeEach(() => {
  repositoryRoot = mkdtempSync(path.join(tmpdir(), 'copy-license-'));
  execFileSync('git', ['init', '--quiet', '--template='], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 5000,
    env: subprocessEnvironment,
  });
  writeRepositoryFile('LICENSE', licenseContent);
  writeRepositoryFile('.gitignore', 'build/\n.cxx/\nPods/\nnode_modules/\n');
  for (const directory of ['ios', 'android', 'src']) {
    mkdirSync(path.join(repositoryRoot, modulePath, directory), {
      recursive: true,
    });
  }
});

afterEach(() => {
  rmSync(repositoryRoot, {recursive: true, force: true});
});

describe('copy_license', () => {
  it.each([
    {mode: 'check', commandArguments: ['--check']},
    {mode: 'write', commandArguments: []},
  ])('leaves ignored files untouched in $mode mode', ({commandArguments}) => {
    const ignoredPaths = [
      'android/build/generated/BuildConfig.java',
      'android/.cxx/debug/Generated.h',
      'ios/Pods/Dependency.swift',
      'src/node_modules/dependency/index.js',
    ].map(relativePath =>
      writeRepositoryFile(`${modulePath}/${relativePath}`, sourceContent),
    );

    const result = runCopyLicense(commandArguments);

    expect(result.status).toBe(0);
    for (const ignoredPath of ignoredPaths) {
      expect(readFileSync(ignoredPath, 'utf8')).toBe(sourceContent);
    }
  });
});
