// @testing-library/react-native v13 ships jest matchers (toBeVisible, etc.)
// built in — the old separate @testing-library/jest-native package is
// deprecated and no longer needed here.

// Silence the Reanimated / gesture-handler native-module warnings that fire
// under Jest's mocked native environment — they're noise, not signal, here.
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));
