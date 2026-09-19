module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Force modules to resolve with the CJS entry point, because Jest does not support ES modules well.
    // You can find more details here: https://jestjs.io/docs/ecmascript-modules
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
