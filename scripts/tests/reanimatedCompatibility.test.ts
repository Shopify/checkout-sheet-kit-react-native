import {transformFileSync} from '@babel/core';
import path from 'node:path';
import {runInNewContext} from 'node:vm';

type Worklet = ((value: number) => number) & {
  __closure: {offset: number};
  __workletHash: number;
};

const repositoryRoot = path.resolve(__dirname, '../..');

it.each(['babel.config.js', 'sample/babel.config.js'])(
  'compiles runnable worklets with captured values through %s',
  configFile => {
    const code = transformFileSync(
      path.join(__dirname, 'fixtures/reanimatedWorklet.ts'),
      {
        configFile: path.join(repositoryRoot, configFile),
        babelrc: false,
      },
    )?.code;
    if (!code) {
      throw new Error('Babel did not produce a compiled worklet');
    }
    const testModule = {exports: {} as {addOffset?: Worklet}};

    runInNewContext(
      code,
      {module: testModule, exports: testModule.exports, global: {Error}},
      {timeout: 1000},
    );

    const worklet = testModule.exports.addOffset;
    expect(worklet?.(2)).toBe(7);
    expect(worklet?.__closure).toEqual({offset: 5});
    expect(worklet?.__workletHash).toEqual(expect.any(Number));
  },
);
