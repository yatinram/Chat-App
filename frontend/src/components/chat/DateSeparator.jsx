import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';
import dayjs from 'dayjs';

/**
 * DateSeparator — shows date label between messages of different days
 */
const DateSeparator = ({ date }) => {
  const label = formatDateLabel(date);
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
};

const formatDateLabel = (date) => {
  const d = dayjs(date);
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  if (d.isSame(today, 'day')) return 'Today';
  if (d.isSame(yesterday, 'day')) return 'Yesterday';
  return d.format('MMMM D, YYYY');
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  label: {
    marginHorizontal: 10,
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default DateSeparator;
