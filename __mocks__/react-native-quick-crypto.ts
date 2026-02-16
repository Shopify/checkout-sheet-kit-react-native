let callCount = 0;

function randomBytes(size: number) {
  callCount++;
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < size; i++) {
    view[i] = (i + callCount) % 256;
  }
  return {buffer};
}

function createHash(_algorithm: string) {
  return {
    update(_data: string) {
      return {
        digest() {
          const buffer = new ArrayBuffer(32);
          const view = new Uint8Array(buffer);
          for (let i = 0; i < 32; i++) {
            view[i] = (i * 7) % 256;
          }
          return {buffer};
        },
      };
    },
  };
}

function resetCallCount() {
  callCount = 0;
}

module.exports = {
  __esModule: true,
  default: {randomBytes, createHash},
  randomBytes,
  createHash,
  resetCallCount,
};
