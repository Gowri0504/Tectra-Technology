/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^uuid$': 'uuid'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {}],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
