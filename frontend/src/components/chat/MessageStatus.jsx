import React from 'react';
import { View, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

/**
 * MessageStatus — shows sent/delivered/seen tick marks
 * Only shown on outgoing (self) messages
 */
const MessageStatus = ({ status, size = 14 }) => {
  const color =
    status === 'seen'
      ? Colors.seen
      : status === 'delivered'
      ? Colors.textSecondary
      : Colors.textMuted;

  if (status === 'sent') {
    return <SingleTick size={size} color={color} />;
  }

  if (status === 'delivered') {
    return <DoubleTick size={size} color={color} />;
  }

  if (status === 'seen') {
    return <DoubleTick size={size} color={color} />;
  }

  return null;
};

const SingleTick = ({ size, color }) => (
  <View style={styles.tickRow}>
    <View
      style={[
        styles.tick,
        { width: size * 0.4, height: size * 0.7, borderColor: color },
      ]}
    />
  </View>
);

const DoubleTick = ({ size, color }) => (
  <View style={styles.tickRow}>
    <View
      style={[
        styles.tick,
        styles.tick1,
        { width: size * 0.35, height: size * 0.65, borderColor: color },
      ]}
    />
    <View
      style={[
        styles.tick,
        { width: size * 0.35, height: size * 0.65, borderColor: color },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  tickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: 3,
  },
  tick: {
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '45deg' }],
    marginBottom: 2,
  },
  tick1: {
    marginRight: -6,
  },
});

export default MessageStatus;
