import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface Props {
  messages: string[];
}

export function FeedbackBanner({ messages }: Props) {
  if (messages.length === 0) return null;

  return (
    <View style={styles.container}>
      {messages.map((msg, i) => (
        <Text key={i} style={styles.text}>
          {msg}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  text: {
    color: '#FFD54F',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 2,
  },
});
