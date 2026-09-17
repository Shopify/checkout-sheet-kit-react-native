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

function runGit(commandArguments: string[]) {
  return execFileSync('git', commandArguments, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 5000,
    env: subprocessEnvironment,
  });
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
  runGit(['init', '--quiet', '--template=']);
  writeRepositoryFile('LICENSE', licenseContent);
  writeRepositoryFile(
    '.gitignore',
    'build/\n.cxx/\nPods/\nnode_modules/\nTracked.swift\n',
  );
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
    expect(result.stdout).not.toContain('update');
    for (const ignoredPath of ignoredPaths) {
      expect(readFileSync(ignoredPath, 'utf8')).toBe(sourceContent);
    }
  });

  it('checks and fixes tracked and untracked source files', () => {
    const trackedSourcePath = `${modulePath}/ios/Tracked.swift`;
    const sourcePaths = [
      trackedSourcePath,
      `${modulePath}/android/src/Source.java`,
      `${modulePath}/src/new source.ts`,
    ];
    for (const sourcePath of sourcePaths) {
      writeRepositoryFile(sourcePath, sourceContent);
    }
    runGit(['add', '--force', '--', trackedSourcePath]);

    const checkResult = runCopyLicense(['--check']);

    expect(checkResult.status).toBe(1);
    for (const sourcePath of sourcePaths) {
      expect(checkResult.stdout).toContain(`would update ${sourcePath}`);
      expect(readFileSync(path.join(repositoryRoot, sourcePath), 'utf8')).toBe(
        sourceContent,
      );
    }

    expect(runCopyLicense().status).toBe(0);
    for (const sourcePath of sourcePaths) {
      expect(readFileSync(path.join(repositoryRoot, sourcePath), 'utf8')).toBe(
        `/*\n${licenseContent}*/\n\n${sourceContent}`,
      );
    }
    expect(runCopyLicense(['--check']).status).toBe(0);
  });

  it('leaves unsupported files and sources outside the module roots untouched', () => {
    const excludedPaths = [
      `${modulePath}/src/README.md`,
      'sample/src/App.tsx',
    ].map(relativePath => writeRepositoryFile(relativePath, sourceContent));

    expect(runCopyLicense(['--check']).status).toBe(0);
    expect(runCopyLicense().status).toBe(0);
    for (const excludedPath of excludedPaths) {
      expect(readFileSync(excludedPath, 'utf8')).toBe(sourceContent);
    }
  });

  it('fails instead of reporting compliance when Git cannot list files', () => {
    rmSync(path.join(repositoryRoot, '.git'), {recursive: true});

    const result = runCopyLicense(['--check']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '[copy_license] failed to list source files',
    );
    expect(result.stdout).not.toContain('all files compliant');
  });

  it('continues to fail when a required source directory is missing', () => {
    rmSync(path.join(repositoryRoot, modulePath, 'ios'), {recursive: true});

    const result = runCopyLicense(['--check']);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Errno::ENOENT');
    expect(result.stdout).not.toContain('all files compliant');
  });
});
