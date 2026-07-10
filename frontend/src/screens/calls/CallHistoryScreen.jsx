import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import Colors from '../../constants/colors';
import { callApi } from '../../api/callApi';
import useAuthStore from '../../store/useAuthStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

dayjs.extend(relativeTime);

const TABS = ['All', 'Voice', 'Video', 'Missed'];

const CallHistoryScreen = ({ navigation }) => {
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const { user, otherUser } = useAuthStore();

  const fetchCalls = useCallback(async () => {
    try {
      const res = await callApi.getCallHistory();
      if (res.success) setCalls(res.calls);
    } catch (err) {
      console.error('Failed to load calls:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, []);

  const filteredCalls = calls.filter((c) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Voice') return c.type === 'voice';
    if (activeTab === 'Video') return c.type === 'video';
    if (activeTab === 'Missed') return c.status === 'missed';
    return true;
  });

  const isOutgoing = (call) => call.callerId === user?.id;

  const getCallIcon = (call) => {
    if (call.status === 'missed') return '📵';
    if (call.type === 'video') return '🎥';
    return '📞';
  };

  const getCallLabel = (call) => {
    if (call.status === 'missed') return 'Missed';
    if (call.status === 'rejected') return 'Rejected';
    if (isOutgoing(call)) return 'Outgoing';
    return 'Incoming';
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCallBack = useCallback((call) => {
    const type = call.type;
    const targetId = isOutgoing(call) ? call.receiverId : call.callerId;
    const targetName = isOutgoing(call)
      ? call.receiver?.username || 'User'
      : call.caller?.username || 'User';

    navigation.navigate('IncomingCall', {
      callerId: user?.id,
      callerName: user?.username,
      type,
      isOutgoing: true,
      targetId,
      targetName,
    });
  }, [user]);

  const renderCall = ({ item }) => {
    const outgoing = isOutgoing(item);
    const isMissed = item.status === 'missed';
    const otherName = outgoing
      ? item.receiver?.username || 'Unknown'
      : item.caller?.username || 'Unknown';
    const duration = formatDuration(item.duration);

    return (
      <View style={styles.callItem}>
        <View style={styles.callIconWrap}>
          <Text style={styles.callIcon}>{getCallIcon(item)}</Text>
        </View>

        <View style={styles.callInfo}>
          <Text style={styles.callName}>{otherName}</Text>
          <View style={styles.callMeta}>
            <Text
              style={[
                styles.callLabel,
                isMissed && styles.callLabelMissed,
              ]}
            >
              {outgoing ? '↗ ' : '↙ '}
              {getCallLabel(item)}
              {duration ? ` · ${duration}` : ''}
            </Text>
            <Text style={styles.callTime}>
              {dayjs(item.createdAt).fromNow()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.callBackBtn}
          onPress={() => handleCallBack(item)}
        >
          <Text style={styles.callBackIcon}>
            {item.type === 'video' ? '🎥' : '📞'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgSurface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={filteredCalls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCall}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchCalls();
              }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📵</Text>
              <Text style={styles.emptyText}>No call history</Text>
              <Text style={styles.emptySubtext}>
                {activeTab !== 'All'
                  ? `No ${activeTab.toLowerCase()} calls yet`
                  : 'Your call log will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: Colors.bgSurface2,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, gap: 10 },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  callIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bgSurface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIcon: { fontSize: 22 },
  callInfo: { flex: 1 },
  callName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  callMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callLabel: { fontSize: 12, color: Colors.textSecondary },
  callLabelMissed: { color: Colors.danger },
  callTime: { fontSize: 11, color: Colors.textMuted },
  callBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  callBackIcon: { fontSize: 18 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyText: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});

export default CallHistoryScreen;
