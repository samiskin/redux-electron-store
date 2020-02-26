module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/", "lib"]
};
