import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Text,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Colors from '../../constants/colors';
import { uploadApi } from '../../api/uploadApi';
import socketService from '../../services/socketService';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import useChatStore from '../../store/useChatStore';
import useAuthStore from '../../store/useAuthStore';

const audioRecorderPlayer = new AudioRecorderPlayer();

/**
 * MessageInput — premium input bar with Ionicons (WhatsApp / iMessage style)
 */
const MessageInput = ({ onTyping, onStopTyping }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');

  const { addMessage, replyTo, clearReplyTo } = useChatStore();
  const { user, otherUser } = useAuthStore();
  const inputRef = useRef(null);

  const handleTextChange = useCallback(
    (val) => {
      setText(val);
      if (val.length > 0) {
        onTyping?.();
      } else {
        onStopTyping?.();
      }
    },
    [onTyping, onStopTyping],
  );

  // ── Send text message ────────────────────────────────
  const handleSend = useCallback(() => {
    if (!text.trim() || !otherUser) return;

    const payload = {
      receiverId: otherUser.id,
      type: 'text',
      content: text.trim(),
      repliedToId: replyTo?.id || null,
    };

    onStopTyping?.();

    socketService.emit(SOCKET_EVENTS.SEND_MESSAGE, payload, (res) => {
      if (res?.success) {
        addMessage(res.message);
      }
    });

    setText('');
    clearReplyTo();
  }, [text, otherUser, replyTo]);

  // ── Pick Image ────────────────────────────────────────
  const handlePickImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.85,
      });

      if (result.didCancel || !result.assets?.length) return;
      const asset = result.assets[0];

      setIsUploading(true);
      const uploaded = await uploadApi.uploadMedia({
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.type || 'image/jpeg',
      });

      if (uploaded.success) {
        socketService.emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          {
            receiverId: otherUser.id,
            type: 'image',
            mediaUrl: uploaded.mediaUrl,
            mediaName: uploaded.mediaName,
            mediaMimeType: uploaded.mediaMimeType,
            mediaSize: uploaded.mediaSize,
            repliedToId: replyTo?.id || null,
          },
          (res) => {
            if (res?.success) addMessage(res.message);
          },
        );
        clearReplyTo();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send image');
    } finally {
      setIsUploading(false);
    }
  }, [otherUser, replyTo]);

  // ── Launch Camera ──────────────────────────────────────
  const handleLaunchCamera = useCallback(async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.85,
        saveToPhotos: true,
      });

      if (result.didCancel || !result.assets?.length) return;
      const asset = result.assets[0];

      setIsUploading(true);
      const uploaded = await uploadApi.uploadMedia({
        uri: asset.uri,
        name: asset.fileName || `camera_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });

      if (uploaded.success) {
        socketService.emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          {
            receiverId: otherUser.id,
            type: 'image',
            mediaUrl: uploaded.mediaUrl,
            mediaName: uploaded.mediaName,
            mediaMimeType: uploaded.mediaMimeType,
            mediaSize: uploaded.mediaSize,
            repliedToId: replyTo?.id || null,
          },
          (res) => {
            if (res?.success) addMessage(res.message);
          },
        );
        clearReplyTo();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setIsUploading(false);
    }
  }, [otherUser, replyTo]);

  // ── Pick File ─────────────────────────────────────────
  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const file = result[0];

      setIsUploading(true);
      const uploaded = await uploadApi.uploadMedia({
        uri: file.uri,
        name: file.name || 'file',
        type: file.type || 'application/octet-stream',
      });

      if (uploaded.success) {
        socketService.emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          {
            receiverId: otherUser.id,
            type: 'file',
            mediaUrl: uploaded.mediaUrl,
            mediaName: uploaded.mediaName,
            mediaMimeType: uploaded.mediaMimeType,
            mediaSize: uploaded.mediaSize,
            repliedToId: replyTo?.id || null,
          },
          (res) => {
            if (res?.success) addMessage(res.message);
          },
        );
        clearReplyTo();
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to send file');
      }
    } finally {
      setIsUploading(false);
    }
  }, [otherUser, replyTo]);

  // ── Voice recording ───────────────────────────────────
  const handleStartRecord = useCallback(async () => {
    try {
      setIsRecording(true);
      setRecordTime('00:00');
      await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e) => {
        const current = formatDuration(e.currentPosition);
        setRecordTime(current);
      });
    } catch (err) {
      setIsRecording(false);
      Alert.alert('Error', 'Failed to start recording. Check microphone permission.');
    }
  }, []);

  const handleStopRecord = useCallback(async () => {
    try {
      const resultPath = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);

      setIsUploading(true);
      const uploaded = await uploadApi.uploadMedia({
        uri: resultPath,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      });

      if (uploaded.success) {
        socketService.emit(
          SOCKET_EVENTS.SEND_MESSAGE,
          {
            receiverId: otherUser.id,
            type: 'voice',
            mediaUrl: uploaded.mediaUrl,
            mediaName: uploaded.mediaName,
            mediaMimeType: uploaded.mediaMimeType,
            mediaSize: uploaded.mediaSize,
            repliedToId: replyTo?.id || null,
          },
          (res) => {
            if (res?.success) addMessage(res.message);
          },
        );
        clearReplyTo();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  }, [otherUser, replyTo]);

  const hasText = text.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Top glow border */}
      <View style={styles.topGlow} />

      {/* ── Attachment buttons (image + file) ───────────── */}
      {!isRecording && (
        <>
          {/* Image picker — Instagram camera style */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handlePickImage}
            disabled={isUploading}
            activeOpacity={0.75}
          >
            <View style={styles.iconBtnInner}>
              <Ionicons name="image-outline" size={21} color={Colors.primaryLight} />
            </View>
          </TouchableOpacity>

          {/* Camera picker */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleLaunchCamera}
            disabled={isUploading}
            activeOpacity={0.75}
          >
            <View style={styles.iconBtnInner}>
              <Ionicons name="camera-outline" size={21} color="#00D4AA" />
            </View>
          </TouchableOpacity>

          {/* File picker — paperclip like Telegram */}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handlePickFile}
            disabled={isUploading}
            activeOpacity={0.75}
          >
            <View style={styles.iconBtnInner}>
              <Ionicons name="attach-outline" size={22} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* ── Text input or recording indicator ───────────── */}
      {isRecording ? (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingDot} />
          <Ionicons name="mic" size={16} color={Colors.danger} style={{ marginRight: 4 }} />
          <Text style={styles.recordingText}>{recordTime}</Text>
          <Text style={styles.recordingHint}>  Release to send</Text>
        </View>
      ) : (
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={text}
            onChangeText={handleTextChange}
            placeholder="Message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={4000}
            returnKeyType="default"
          />
        </View>
      )}

      {/* Upload spinner */}
      {isUploading && (
        <ActivityIndicator
          size="small"
          color={Colors.primary}
          style={styles.uploadSpinner}
        />
      )}

      {/* ── Send button or Mic button ─────────────────── */}
      {hasText ? (
        // Send — paper-plane like Telegram/WhatsApp
        <TouchableOpacity
          style={styles.sendBtnWrapper}
          onPress={handleSend}
          disabled={isUploading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#6C63FF', '#9D8DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        // Mic — hold to record like WhatsApp
        <TouchableOpacity
          style={styles.sendBtnWrapper}
          onPressIn={handleStartRecord}
          onPressOut={handleStopRecord}
          disabled={isUploading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isRecording ? ['#FF4D67', '#FF7088'] : ['#6C63FF', '#9D8DFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendBtn}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic'}
              size={20}
              color="#FFFFFF"
            />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const formatDuration = (ms) => {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#0F1520',
    gap: 6,
    position: 'relative',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(108,99,255,0.3)',
  },

  // Attachment icon buttons
  iconBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  iconBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2235',
    borderWidth: 1,
    borderColor: '#2A3A55',
  },

  // Text input
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1A2235',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2A3A55',
    minHeight: 42,
    justifyContent: 'center',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: Colors.textPrimary,
    fontSize: 15,
    maxHeight: 120,
  },

  // Recording state
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2235',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginRight: 6,
  },
  recordingText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  recordingHint: {
    color: Colors.textMuted,
    fontSize: 12,
  },

  uploadSpinner: {
    marginHorizontal: 4,
  },

  // Send / mic button
  sendBtnWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MessageInput;
