/**
 * Ensure Jest picks up manual mocks written in TypeScript.
 * Jest resolves __mocks__/react-native automatically when a test calls jest.mock('react-native')
 * or when the module is required and a manual mock exists. No runtime code needed here.
 * This file exists to ensure TypeScript is part of Jest's setupFiles and compiled.
 */

export {};
