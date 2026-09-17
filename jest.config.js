/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))",
  ],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  // Deliberately low to start — this repo has almost no code yet. Ratchet
  // this up in small steps as real coverage grows; don't let it silently
  // regress, but don't block day-one PRs on a number that assumes a mature
  // codebase either.
  coverageThreshold: {
    global: { lines: 10, statements: 10 },
  },
};
