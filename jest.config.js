module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    // Mock firebase modules that require native setup in tests
    '@react-native-firebase/firestore': '<rootDir>/__mocks__/@react-native-firebase/firestore.js',
    '@react-native-firebase/auth': '<rootDir>/__mocks__/@react-native-firebase/auth.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-firebase|@react-navigation)/)',
  ],
};
