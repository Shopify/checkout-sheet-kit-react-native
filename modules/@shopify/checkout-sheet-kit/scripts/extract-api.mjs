#!/usr/bin/env node

import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Extractor, ExtractorConfig} from '@microsoft/api-extractor';

const moduleRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceDirectory = join(moduleRoot, 'src');
const generatedDeclarationDirectory = join(moduleRoot, 'lib', 'typescript');
const temporaryDirectory = mkdtempSync(
  join(tmpdir(), 'checkout-sheet-kit-api-extractor-'),
);
const declarationOutputRoot = join(temporaryDirectory, 'typescript');
const declarationOutputDirectory = join(declarationOutputRoot, 'src');
const relocatedDeclarationDirectory = join(
  declarationOutputDirectory,
  '_types',
);
const declarationNames = readdirSync(sourceDirectory)
  .filter(entry => entry.endsWith('.d.ts'))
  .map(entry => entry.slice(0, -'.d.ts'.length));

function declarationFiles(directory) {
  return readdirSync(directory).flatMap(entry => {
    const entryPath = join(directory, entry);

    if (statSync(entryPath).isDirectory()) {
      return declarationFiles(entryPath);
    }

    return entryPath.endsWith('.d.ts') ? [entryPath] : [];
  });
}

function relocateDeclarations() {
  mkdirSync(relocatedDeclarationDirectory, {recursive: true});

  for (const declarationName of declarationNames) {
    const sourcePath = join(sourceDirectory, `${declarationName}.d.ts`);
    const destinationPath = join(
      relocatedDeclarationDirectory,
      `${declarationName}.d.ts`,
    );
    const contents = readFileSync(sourcePath, 'utf8').replace(
      /(['"])\.\//g,
      '$1../',
    );

    writeFileSync(destinationPath, contents);
  }
}

function rewriteImports() {
  for (const declarationPath of declarationFiles(declarationOutputDirectory)) {
    let contents = readFileSync(declarationPath, 'utf8');

    for (const declarationName of declarationNames) {
      const relativeTarget = relative(
        dirname(declarationPath),
        join(relocatedDeclarationDirectory, declarationName),
      ).replace(/\\/g, '/');
      const importTarget = relativeTarget.startsWith('.')
        ? relativeTarget
        : `./${relativeTarget}`;
      const importPattern = new RegExp(
        `(['"])\\./${declarationName}\\.d\\1`,
        'g',
      );

      contents = contents.replace(importPattern, `$1${importTarget}$1`);
    }

    writeFileSync(declarationPath, contents);
  }
}

function extractApi() {
  const configPath = join(moduleRoot, 'api-extractor.json');
  const config = ExtractorConfig.loadFile(configPath);

  config.projectFolder = moduleRoot;
  config.mainEntryPointFilePath = join(
    declarationOutputDirectory,
    'index.d.ts',
  );
  config.apiReport.reportFolder = join(moduleRoot, 'api');
  config.apiReport.reportTempFolder = join(temporaryDirectory, 'report');

  const extractorConfig = ExtractorConfig.prepare({
    configObject: config,
    configObjectFullPath: configPath,
    packageJsonFullPath: join(moduleRoot, 'package.json'),
  });
  const result = Extractor.invoke(extractorConfig, {
    localBuild: process.argv.includes('--local'),
    showVerboseMessages: true,
  });

  if (!result.succeeded) {
    process.exitCode = 1;
  }
}

try {
  cpSync(generatedDeclarationDirectory, declarationOutputRoot, {
    recursive: true,
  });
  relocateDeclarations();
  rewriteImports();
  extractApi();
} finally {
  rmSync(temporaryDirectory, {recursive: true, force: true});
}
