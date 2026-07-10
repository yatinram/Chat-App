import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../constants/colors';
import { messageApi } from '../../api/messageApi';
import useAuthStore from '../../store/useAuthStore';
import dayjs from 'dayjs';

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const { otherUser } = useAuthStore();

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !otherUser?.id) return;
    setIsSearching(true);
    setSearched(true);
    try {
      const res = await messageApi.searchMessages(query.trim(), otherUser.id);
      if (res.success) setResults(res.messages);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, otherUser]);

  const renderItem = ({ item }) => (
    <View style={styles.resultItem}>
      <View style={styles.resultMeta}>
        <Text style={styles.resultSender}>
          {item.senderId === otherUser?.id ? otherUser.username : 'You'}
        </Text>
        <Text style={styles.resultTime}>{dayjs(item.createdAt).format('MMM D, h:mm A')}</Text>
      </View>
      <Text style={styles.resultContent} numberOfLines={3}>
        {highlightText(item.content, query)}
      </Text>
    </View>
  );

  const highlightText = (text, keyword) => {
    if (!text || !keyword) return text;
    // Simple highlight — just return text (proper highlight needs custom component)
    return text;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgSurface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search in conversation..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setResults([]);
              setSearched(false);
            }}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
        {isSearching ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.searchBtnText}>Search</Text>
        )}
      </TouchableOpacity>

      {/* Results */}
      {searched && !isSearching && results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No messages found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} found</Text>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgSurface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { color: Colors.textPrimary, fontSize: 20 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface2,
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchIcon: { fontSize: 18 },
  searchInput: {
    flex: 1,
    height: 48,
    color: Colors.textPrimary,
    fontSize: 14.5,
  },
  clearIcon: { color: Colors.textMuted, fontSize: 16, padding: 4 },
  searchBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  resultCount: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '500',
  },
  resultItem: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultSender: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  resultTime: { fontSize: 11, color: Colors.textMuted },
  resultContent: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtext: { fontSize: 13, color: Colors.textMuted },
});

export default SearchScreen;
