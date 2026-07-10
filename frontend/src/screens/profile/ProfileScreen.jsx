import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import Colors from '../../constants/colors';
import Avatar from '../../components/common/Avatar';
import useAuthStore from '../../store/useAuthStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const ProfileScreen = ({ navigation }) => {
  const { user, otherUser, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  const infoRow = (icon, label, value) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgSurface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* My Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Avatar name={user?.username || ''} size={80} isOnline={true} />
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Active now</Text>
        </View>
      </View>

      {/* My Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>
        <View style={styles.card}>
          {infoRow('👤', 'Username', user?.username)}
          {infoRow('🆔', 'User ID', `#${user?.id}`)}
          {infoRow('📅', 'Member since', dayjs(user?.createdAt).format('MMMM YYYY'))}
        </View>
      </View>

      {/* Chat Partner */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chatting With</Text>
        <View style={styles.card}>
          <View style={styles.partnerRow}>
            <Avatar name={otherUser?.username || ''} size={48} isOnline={otherUser?.isOnline} />
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{otherUser?.username}</Text>
              <Text
                style={[
                  styles.partnerStatus,
                  { color: otherUser?.isOnline ? Colors.online : Colors.textMuted },
                ]}
              >
                {otherUser?.isOnline
                  ? '● Online'
                  : otherUser?.lastSeen
                  ? `Last seen ${dayjs(otherUser.lastSeen).fromNow()}`
                  : 'Offline'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <View style={styles.card}>
          {infoRow('💬', 'App', 'ChatApp')}
          {infoRow('🔒', 'Messages expire', 'After 24 hours')}
          {infoRow('🔐', 'Encryption', 'JWT secured')}
          {infoRow('📡', 'Calls', 'WebRTC peer-to-peer')}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>ChatApp v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.bgSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrap: { marginBottom: 12 },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentGlow,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  onlineText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 14,
  },
  infoIcon: { fontSize: 20 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  partnerStatus: { fontSize: 12, marginTop: 3 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: Colors.dangerGlow,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.danger,
    gap: 10,
  },
  logoutIcon: { fontSize: 20 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  version: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 20,
  },
});

export default ProfileScreen;
