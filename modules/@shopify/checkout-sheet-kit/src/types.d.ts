// Global type extensions for React Native compatibility

declare global {
  interface ErrorOptions {
    cause?: unknown;
  }

  interface ErrorConstructor {
    captureStackTrace?(target: object, constructorOpt?: Function): void;
  }
}

export {};
