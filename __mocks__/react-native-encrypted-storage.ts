const store: Record<string, string> = {};

const EncryptedStorage = {
  setItem: jest.fn(async (key: string, value: string) => {
    store[key] = value;
  }),
  getItem: jest.fn(async (key: string) => {
    return store[key] ?? null;
  }),
  removeItem: jest.fn(async (key: string) => {
    delete store[key];
  }),
  clear: jest.fn(async () => {
    Object.keys(store).forEach(key => delete store[key]);
  }),
};

module.exports = {
  __esModule: true,
  default: EncryptedStorage,
};
