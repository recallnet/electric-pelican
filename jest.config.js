/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/index.ts"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "src/app/api/**/*.{ts,tsx}": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "src/lib/**/*.{ts,tsx}": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          jsx: "react-jsx",
          module: "ESNext",
          target: "ES2022",
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(nanoid|@dicebear|jose|better-sqlite3|@neondatabase)/)",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};
