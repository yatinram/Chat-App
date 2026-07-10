import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Colors from '../../constants/colors';
import useAuthStore from '../../store/useAuthStore';
import useChatStore from '../../store/useChatStore';
import useSocket from '../../hooks/useSocket';
import useTyping from '../../hooks/useTyping';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import socketService from '../../services/socketService';
import { messageApi } from '../../api/messageApi';

import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ReplyPreview from '../../components/chat/ReplyPreview';
import DateSeparator from '../../components/chat/DateSeparator';
import dayjs from 'dayjs';

/**
 * ChatScreen — main conversation screen
 */
const ChatScreen = ({ navigation }) => {
  const { user, otherUser } = useAuthStore();
  const {
    messages,
    hasMore,
    isLoading,
    isLoadingMore,
    replyTo,
    loadMessages,
    loadMoreMessages,
    updateMessageStatus,
    setReplyTo,
    clearReplyTo,
  } = useChatStore();

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const flatListRef = useRef(null);

  // Set up all socket listeners
  useSocket();

  const { onTyping, onStopTyping } = useTyping(otherUser?.id);

  // Load messages on mount
  useEffect(() => {
    if (otherUser?.id) {
      loadMessages(otherUser.id);
    }
  }, [otherUser?.id]);

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (!messages.length || !user || !otherUser) return;

    const unseenFromOther = messages.filter(
      (m) => m.senderId === otherUser.id && m.status !== 'seen',
    );

    unseenFromOther.forEach((msg) => {
      socketService.emit(SOCKET_EVENTS.MESSAGE_SEEN, {
        messageId: msg.id,
        senderId: otherUser.id,
      });
      updateMessageStatus(msg.id, 'seen');
    });
  }, [messages.length]);

  // Typing events listener
  useEffect(() => {
    const handleTyping = ({ senderId }) => {
      if (senderId === otherUser?.id) setIsOtherTyping(true);
    };
    const handleStopTyping = ({ senderId }) => {
      if (senderId === otherUser?.id) setIsOtherTyping(false);
    };

    socketService.on(SOCKET_EVENTS.TYPING, handleTyping);
    socketService.on(SOCKET_EVENTS.STOP_TYPING, handleStopTyping);

    return () => {
      socketService.off(SOCKET_EVENTS.TYPING, handleTyping);
      socketService.off(SOCKET_EVENTS.STOP_TYPING, handleStopTyping);
    };
  }, [otherUser?.id]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ── Build data with date separators ─────────────────
  const listData = React.useMemo(() => {
    const items = [];
    let lastDate = null;

    messages.forEach((msg) => {
      const msgDate = dayjs(msg.createdAt).format('YYYY-MM-DD');
      if (msgDate !== lastDate) {
        items.push({ type: 'separator', date: msg.createdAt, id: `sep_${msg.createdAt}` });
        lastDate = msgDate;
      }
      items.push({ type: 'message', ...msg });
    });

    return items;
  }, [messages]);

  const renderItem = useCallback(
    ({ item }) => {
      if (item.type === 'separator') {
        return <DateSeparator date={item.date} />;
      }
      const isSelf = item.senderId === user.id;
      return (
        <MessageBubble
          message={item}
          isSelf={isSelf}
          currentUserId={user.id}
          receiverId={otherUser?.id}
          onReply={setReplyTo}
        />
      );
    },
    [user, otherUser],
  );

  const onLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMoreMessages(otherUser?.id);
    }
  }, [hasMore, isLoadingMore, otherUser?.id]);

  // ── Online status label ──────────────────────────────
  const statusText = otherUser?.isOnline
    ? 'Online'
    : otherUser?.lastSeen
    ? `Last seen ${dayjs(otherUser.lastSeen).fromNow()}`
    : 'Offline';

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Delete all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          try {
            await messageApi.deleteFullChat(otherUser.id);
            loadMessages(otherUser.id);
          } catch {
            Alert.alert('Error', 'Failed to clear chat');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgSurface} />

      {/* ── Premium Header ─────────────────────────────────────── */}
      <LinearGradient
        colors={['#121828', '#0F1520']}
        style={styles.header}
      >
        {/* Bottom glow border */}
        <View style={styles.headerGlowLine} />

        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
        </TouchableOpacity>

        {/* Avatar + name + status */}
        <View style={styles.headerLeft}>
          <Avatar name={otherUser?.username || ''} size={42} isOnline={otherUser?.isOnline} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser?.username || 'Chat'}</Text>
            <View style={styles.statusRow}>
              {otherUser?.isOnline && <View style={styles.onlineDot} />}
              <Text
                style={[
                  styles.headerStatus,
                  { color: otherUser?.isOnline ? Colors.online : Colors.textMuted },
                ]}
              >
                {statusText}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons — Zoom/WhatsApp style clean icons */}
        <View style={styles.headerActions}>

          {/* Search */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.75}
          >
            <View style={styles.headerBtnInner}>
              <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Voice call — green tint like WhatsApp */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              navigation.navigate('IncomingCall', {
                callerId: user.id,
                callerName: user.username,
                type: 'voice',
                isOutgoing: true,
                targetId: otherUser?.id,
                targetName: otherUser?.username,
              });
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.headerBtnInner, styles.headerBtnCall]}>
              <Ionicons name="call-outline" size={19} color="#25D366" />
            </View>
          </TouchableOpacity>

          {/* Video call — blue tint like Zoom */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              navigation.navigate('IncomingCall', {
                callerId: user.id,
                callerName: user.username,
                type: 'video',
                isOutgoing: true,
                targetId: otherUser?.id,
                targetName: otherUser?.username,
              });
            }}
            activeOpacity={0.75}
          >
            <View style={[styles.headerBtnInner, styles.headerBtnVideo]}>
              <Ionicons name="videocam-outline" size={21} color="#2D8CFF" />
            </View>
          </TouchableOpacity>

          {/* More / overflow — dots like Instagram */}
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleClearChat}
            activeOpacity={0.75}
          >
            <View style={[styles.headerBtnInner, styles.headerBtnDanger]}>
              <Ionicons name="trash-outline" size={18} color="#FF4D67" />
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Message List ────────────────────────────────── */}
      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={listData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.2}
            ListHeaderComponent={isLoadingMore ? <LoadingSpinner /> : null}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          />

          {/* Typing indicator */}
          <TypingIndicator visible={isOtherTyping} username={otherUser?.username} />

          {/* Reply preview */}
          {replyTo && (
            <ReplyPreview
              replyTo={replyTo}
              currentUserId={user.id}
              onCancel={clearReplyTo}
            />
          )}

          {/* Message input */}
          <MessageInput onTyping={onTyping} onStopTyping={onStopTyping} />
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  flex: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: 'relative',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  headerGlowLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(108,99,255,0.35)',
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.online,
  },
  headerStatus: {
    fontSize: 11.5,
    fontWeight: '400',
  },

  // Header action buttons
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  headerBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2235',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerBtnCall: {
    backgroundColor: 'rgba(37,211,102,0.12)',
    borderColor: 'rgba(37,211,102,0.2)',
  },
  headerBtnVideo: {
    backgroundColor: 'rgba(45,140,255,0.12)',
    borderColor: 'rgba(45,140,255,0.2)',
  },
  headerBtnDanger: {
    backgroundColor: 'rgba(255,77,103,0.12)',
    borderColor: 'rgba(255,77,103,0.2)',
  },

  messageList: {
    paddingVertical: 8,
  },
});

export default ChatScreen;
