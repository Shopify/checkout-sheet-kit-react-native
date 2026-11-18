import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {cp, mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const root = fileURLToPath(new URL('..', import.meta.url));

test('license checking and repair preserve the Swift tools directive', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'checkout-sheet-kit-license-'));
  try {
    await cp(join(root, 'LICENSE'), join(fixture, 'LICENSE'));
    execFileSync('git', ['init', '--quiet'], {cwd: fixture});
    const moduleRoot = join(fixture, 'modules/@shopify/checkout-sheet-kit');
    await Promise.all(
      ['ios', 'android', 'src'].map(path =>
        mkdir(join(moduleRoot, path), {recursive: true}),
      ),
    );
    const manifestPath = join(moduleRoot, 'ios/Package.swift');
    const directive = '// swift-tools-version: 6.0\n';
    const body = '\nimport PackageDescription\n';
    const run = (...args) =>
      spawnSync('ruby', [join(root, 'scripts/copy_license'), ...args], {
        cwd: fixture,
        encoding: 'utf8',
      });
    await writeFile(manifestPath, directive + body);
    assert.equal(run('--check').status, 1);
    assert.equal(run().status, 0);
    const licensed = await readFile(manifestPath, 'utf8');
    assert.ok(licensed.startsWith(directive));
    assert.match(licensed, /Copyright 2023 - Present, Shopify Inc\./);
    assert.equal(run('--check').status, 0);
    assert.equal(run().status, 0);
    assert.equal(await readFile(manifestPath, 'utf8'), licensed);
  } finally {
    await rm(fixture, {recursive: true, force: true});
  }
});
