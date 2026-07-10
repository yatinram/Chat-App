import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../../constants/colors';

/**
 * ReplyPreview — shows quoted message above input bar
 */
const ReplyPreview = ({ replyTo, currentUserId, onCancel }) => {
  if (!replyTo) return null;

  const isOwnMessage = replyTo.senderId === currentUserId;
  const previewText = replyTo.content
    ? replyTo.content.length > 60
      ? replyTo.content.slice(0, 60) + '...'
      : replyTo.content
    : replyTo.type === 'image'
    ? '📷 Photo'
    : replyTo.type === 'file'
    ? '📎 File'
    : replyTo.type === 'voice'
    ? '🎤 Voice message'
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.name}>
          {isOwnMessage ? 'You' : 'Them'}
        </Text>
        <Text style={styles.text} numberOfLines={1}>
          {previewText}
        </Text>
      </View>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
        <Text style={styles.cancelText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryLight,
    marginBottom: 2,
  },
  text: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cancelBtn: {
    padding: 6,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
});

export default ReplyPreview;
