// Mock for @react-native-firebase/auth
const auth = jest.fn(() => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
}));
module.exports = auth;
