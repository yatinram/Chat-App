import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import Colors from '../../constants/colors';

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯'];

/**
 * ReactionPicker — emoji picker modal for message reactions
 */
const ReactionPicker = ({ visible, onSelect, onClose, currentReaction }) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.picker}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiRow}
          >
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiBtn,
                  currentReaction === emoji && styles.emojiBtnActive,
                ]}
                onPress={() => {
                  // Toggle: if same emoji is selected, remove reaction
                  onSelect(currentReaction === emoji ? null : emoji);
                  onClose();
                }}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  picker: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  emojiRow: {
    paddingHorizontal: 8,
    gap: 4,
  },
  emojiBtn: {
    padding: 8,
    borderRadius: 50,
    marginHorizontal: 2,
  },
  emojiBtnActive: {
    backgroundColor: Colors.primaryGlow,
  },
  emoji: {
    fontSize: 26,
  },
});

export default ReactionPicker;
