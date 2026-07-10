import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Vibration,
} from 'react-native';
import Colors from '../../constants/colors';
import Avatar from '../../components/common/Avatar';
import socketService from '../../services/socketService';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import useCallStore from '../../store/useCallStore';
import useAuthStore from '../../store/useAuthStore';
import { callApi } from '../../api/callApi';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * IncomingCallScreen — handles both incoming (ringing) and outgoing call UI.
 * For outgoing: shows "Calling..." state.
 * For incoming: shows Accept / Reject buttons.
 */
const IncomingCallScreen = ({ navigation, route }) => {
  const params = route?.params || {};
  const isOutgoing = params.isOutgoing || false;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { incomingCall, clearIncomingCall } = useCallStore();
  const { user, otherUser } = useAuthStore();

  const callerName = isOutgoing
    ? params.targetName || otherUser?.username || 'User'
    : incomingCall?.callerName || 'Unknown';
  const callType = isOutgoing ? params.type : incomingCall?.type || 'voice';

  // Pulse animation for the avatar ring
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    // Vibrate on incoming call
    if (!isOutgoing) {
      Vibration.vibrate([500, 500, 500, 500, 500], true);
    }

    return () => {
      pulse.stop();
      Vibration.cancel();
    };
  }, []);

  // Listen for call accepted/rejected when outgoing
  useEffect(() => {
    if (!isOutgoing) return;

    const handleAccepted = ({ callId }) => {
      navigation.replace('ActiveCall', {
        ...params,
        callId,
      });
    };

    const handleRejected = () => {
      navigation.goBack();
      callApi.createCallRecord({
        receiverId: params.targetId,
        type: callType,
        status: 'rejected',
      }).catch(() => {});
    };

    socketService.on(SOCKET_EVENTS.CALL_ACCEPTED, handleAccepted);
    socketService.on(SOCKET_EVENTS.CALL_REJECTED, handleRejected);

    // Initiate the call
    const callId = `call_${Date.now()}`;
    socketService.emit(
      SOCKET_EVENTS.CALL_INITIATE,
      { receiverId: params.targetId, type: callType, callId },
      () => {},
    );

    return () => {
      socketService.off(SOCKET_EVENTS.CALL_ACCEPTED, handleAccepted);
      socketService.off(SOCKET_EVENTS.CALL_REJECTED, handleRejected);
    };
  }, []);

  // Accept incoming call
  const handleAccept = () => {
    Vibration.cancel();
    if (incomingCall) {
      socketService.emit(SOCKET_EVENTS.CALL_ACCEPT, {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
      });
      clearIncomingCall();
      navigation.replace('ActiveCall', {
        callId: incomingCall.callId,
        targetId: incomingCall.callerId,
        targetName: incomingCall.callerName,
        type: incomingCall.type,
        isOutgoing: false,
      });
    }
  };

  // Reject incoming call
  const handleReject = () => {
    Vibration.cancel();
    if (incomingCall) {
      socketService.emit(SOCKET_EVENTS.CALL_REJECT, {
        callerId: incomingCall.callerId,
        callId: incomingCall.callId,
      });
      callApi.createCallRecord({
        receiverId: user?.id,
        type: incomingCall.type,
        status: 'rejected',
      }).catch(() => {});
      clearIncomingCall();
    }
    navigation.goBack();
  };

  // Cancel outgoing call
  const handleCancel = () => {
    if (params.targetId) {
      socketService.emit(SOCKET_EVENTS.CALL_END, {
        targetId: params.targetId,
        callId: params.callId,
      });
      callApi.createCallRecord({
        receiverId: params.targetId,
        type: callType,
        status: 'missed',
      }).catch(() => {});
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Background glow */}
      <View style={styles.bgGlow} />

      {/* Call type label */}
      <Text style={styles.callTypeLabel}>
        {isOutgoing ? 'Calling...' : `Incoming ${callType} call`}
      </Text>

      {/* Pulsing avatar */}
      <View style={styles.avatarSection}>
        <Animated.View
          style={[styles.pulseRing2, { transform: [{ scale: pulseAnim }] }]}
        />
        <Animated.View
          style={[
            styles.pulseRing1,
            {
              transform: [
                {
                  scale: Animated.multiply(pulseAnim, new Animated.Value(0.88)),
                },
              ],
            },
          ]}
        />
        <View style={styles.avatarWrap}>
          <Avatar name={callerName} size={90} />
        </View>
      </View>

      <Text style={styles.callerName}>{callerName}</Text>
      <Text style={styles.callStatus}>
        {isOutgoing ? `${callType} call` : `Wants to ${callType} call you`}
      </Text>

      {/* Action buttons */}
      {isOutgoing ? (
        <TouchableOpacity style={styles.endCallCard} onPress={handleCancel} activeOpacity={0.85}>
          <View style={styles.iconContainerEnd}>
            <Ionicons name="call-outline" size={26} color="#FF4D67" style={{ transform: [{ rotate: '135deg' }] }} />
          </View>
          <Text style={styles.endCallText}>End call</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.actionRow}>
          {/* Reject Call */}
          <TouchableOpacity style={styles.rejectCallCard} onPress={handleReject} activeOpacity={0.85}>
            <View style={styles.iconContainerReject}>
              <Ionicons name="call-outline" size={26} color="#FF4D67" style={{ transform: [{ rotate: '135deg' }] }} />
            </View>
            <Text style={styles.rejectCallText}>Reject call</Text>
          </TouchableOpacity>

          {/* Receive Call */}
          <TouchableOpacity style={styles.receiveCallCard} onPress={handleAccept} activeOpacity={0.85}>
            <View style={styles.iconContainerReceive}>
              <Ionicons name="call-outline" size={26} color="#25D366" />
            </View>
            <Text style={styles.receiveCallText}>Receive call</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 60,
  },
  bgGlow: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: Colors.primaryGlow,
    top: '20%',
    alignSelf: 'center',
  },
  callTypeLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avatarSection: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.3,
  },
  pulseRing2: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    opacity: 0.15,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  callStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
    paddingHorizontal: 24,
  },
  receiveCallCard: {
    width: 130,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#112217', // dark green tint
    borderWidth: 1,
    borderColor: '#1D3B27',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  receiveCallText: {
    color: '#25D366',
    fontSize: 13,
    fontWeight: '600',
  },
  iconContainerReceive: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectCallCard: {
    width: 130,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#251215', // dark red tint
    borderWidth: 1,
    borderColor: '#3D1B1F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rejectCallText: {
    color: '#FF4D67',
    fontSize: 13,
    fontWeight: '600',
  },
  iconContainerReject: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endCallCard: {
    width: 130,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#251215', // dark red tint
    borderWidth: 1,
    borderColor: '#3D1B1F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endCallText: {
    color: '#FF4D67',
    fontSize: 13,
    fontWeight: '600',
  },
  iconContainerEnd: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 77, 103, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IncomingCallScreen;
