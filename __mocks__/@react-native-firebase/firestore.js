// Mock for @react-native-firebase/firestore
const mockCollection = jest.fn(() => ({
  doc: jest.fn(() => ({
    get: jest.fn().mockResolvedValue({ data: () => ({ xp: 0 }) }),
    set: jest.fn().mockResolvedValue(undefined),
  })),
  orderBy: jest.fn(() => ({
    limit: jest.fn(() => ({
      get: jest.fn().mockResolvedValue({ docs: [] }),
    })),
  })),
}));

const firestore = jest.fn(() => ({ collection: mockCollection }));
firestore.default = firestore;
module.exports = firestore;
