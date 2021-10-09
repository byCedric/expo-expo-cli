import spawnAsync from '@expo/spawn-async';

import { findSharpInstanceAsync } from '../../src';

jest.setTimeout(1000 * 60 * 5);

describe(findSharpInstanceAsync, () => {
  it(`resolves global sharp-cli path with npm`, async () => {
    await spawnAsync('npm', ['install', '--global', 'sharp-cli@1.15.0']);
    expect(findSharpInstanceAsync()).resolves.toBeInstanceOf(String);
    await spawnAsync('npm', ['uninstall', '--global', 'sharp-cli']);
  });

  it(`resolves global sharp-cli path with yarn`, async () => {
    await spawnAsync('yarn', ['global', 'add', 'sharp-cli@1.15.0']);
    expect(findSharpInstanceAsync()).resolves.toBeInstanceOf(String);
    await spawnAsync('yarn', ['global', 'remove', 'sharp-cli']);
  });
});
