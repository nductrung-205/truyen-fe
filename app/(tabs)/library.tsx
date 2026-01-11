import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storageService, ReadingHistoryItem } from '@/services/storageService';
import { storyService } from '@/services/storyService';
import { authService } from '@/services/authService';
import { Story } from '@/types';
import { UserProfile } from '@/types/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StoryCard } from '@/components/StoryCard';

type TabType = 'history' | 'favorites';

export default function LibraryScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('history');
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [favoriteStories, setFavoriteStories] = useState<Story[]>([]);

  // Kiểm tra trạng thái đăng nhập mỗi khi người dùng quay lại tab này
  useFocusEffect(
    useCallback(() => {
      checkAuthAndLoad();
    }, [])
  );

  const checkAuthAndLoad = async () => {
    try {
      setLoading(true);
      const storedUser = await authService.getStoredUser();
      setUser(storedUser);
      
      if (storedUser) {
        // Chỉ tải dữ liệu nếu đã đăng nhập
        await Promise.all([
          loadReadingHistory(),
          loadFavorites(),
        ]);
      }
    } catch (error) {
      console.error('Error loading library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReadingHistory = async () => {
    const history = await storageService.getReadingHistory();
    setReadingHistory(history);
  };

  const loadFavorites = async () => {
    try {
      const favoriteIds = await storageService.getFavorites();
      if (favoriteIds.length === 0) {
        setFavoriteStories([]);
        return;
      }
      const storyPromises = favoriteIds.map(id => 
        storyService.getStoryDetail(id).catch(() => null)
      );
      const results = await Promise.all(storyPromises);
      const stories = results.filter(result => result !== null).map(result => result!.data);
      setFavoriteStories(stories);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkAuthAndLoad();
    setRefreshing(false);
  };

  const handleRemoveHistory = (storyId: number) => {
    const performRemove = async () => {
        await storageService.removeFromReadingHistory(storyId);
        await loadReadingHistory();
    };

    if (Platform.OS === 'web') {
        if (window.confirm("Xóa truyện này khỏi lịch sử?")) performRemove();
    } else {
        Alert.alert('Xóa lịch sử', 'Bạn có chắc chắn?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa', style: 'destructive', onPress: performRemove },
        ]);
    }
  };

  const handleClearHistory = () => {
    const performClear = async () => {
        await storageService.clearReadingHistory();
        await loadReadingHistory();
    };

    if (Platform.OS === 'web') {
        if (window.confirm("Xóa toàn bộ lịch sử đọc?")) performClear();
    } else {
        Alert.alert('Xóa tất cả', 'Bạn có chắc chắn?', [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Xóa tất cả', style: 'destructive', onPress: performClear },
        ]);
    }
  };

  const handleRemoveFavorite = async (storyId: number) => {
    await storageService.removeFromFavorites(storyId);
    await loadFavorites();
  };

  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  // GIAO DIỆN KHI CHƯA ĐĂNG NHẬP
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: '#673AB7' }]}>
          <Text style={styles.headerTitle}>📚 Thư Viện</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.notLoggedInTitle}>Chưa đăng nhập</Text>
          <Text style={styles.notLoggedInText}>
            Đăng nhập để xem lịch sử đọc và danh sách truyện yêu thích của bạn.
          </Text>
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginPromptButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Thư Viện</Text>
        <Text style={styles.headerSubtitle}>Tủ sách của {user.username}</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
            🕒 Đã đọc ({readingHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'favorites' && styles.tabActive]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.tabTextActive]}>
            ❤️ Yêu thích ({favoriteStories.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'history' ? (
          <View style={styles.section}>
            {readingHistory.length > 0 && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
                <Text style={styles.clearButtonText}>🗑️ Xóa tất cả</Text>
              </TouchableOpacity>
            )}

            {readingHistory.length > 0 ? (
              readingHistory.map((item) => (
                <View key={item.storyId} style={styles.historyItem}>
                  <TouchableOpacity style={styles.historyContent} onPress={() => router.push(`/story/${item.storyId}`)}>
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.historyThumbnail} />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle} numberOfLines={2}>{item.storyTitle}</Text>
                      <Text style={styles.historyChapter}>Chương {item.lastReadChapter}</Text>
                      <Text style={styles.historyDate}>{formatDate(item.lastReadAt)}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.historyActions}>
                    <TouchableOpacity 
                        style={styles.continueButton} 
                        onPress={() => router.push(`/chapter/${item.storyId}/${item.lastReadChapter}`)}
                    >
                      <Text style={styles.continueButtonText}>Đọc tiếp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveHistory(item.storyId)}>
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <RenderEmpty icon="📖" text="Chưa có lịch sử đọc" />
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {favoriteStories.length > 0 ? (
              favoriteStories.map((story) => (
                <View key={story.id} style={styles.favoriteItem}>
                  <StoryCard story={story} onPress={() => router.push(`/story/${story.id}`)} />
                  <TouchableOpacity style={styles.unfavoriteButton} onPress={() => handleRemoveFavorite(story.id)}>
                    <Text style={styles.unfavoriteText}>💔 Bỏ thích</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <RenderEmpty icon="❤️" text="Chưa có truyện yêu thích" />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const RenderEmpty = ({ icon, text }: { icon: string, text: string }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#9C27B0', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#F3E5F5', marginTop: 4 },
  notLoggedInContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  notLoggedInTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 12 },
  notLoggedInText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginPromptButton: { backgroundColor: '#9C27B0', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  loginPromptButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#9C27B0' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#9C27B0' },
  content: { flex: 1 },
  section: { padding: 16 },
  clearButton: { alignSelf: 'flex-end', padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8, marginBottom: 12 },
  clearButtonText: { color: '#D32F2F', fontWeight: '600', fontSize: 12 },
  historyItem: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  historyContent: { flexDirection: 'row', marginBottom: 12 },
  historyThumbnail: { width: 70, height: 90, borderRadius: 6 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyTitle: { fontSize: 16, fontWeight: '600' },
  historyChapter: { color: '#007AFF', marginTop: 4 },
  historyDate: { color: '#999', fontSize: 12, marginTop: 4 },
  historyActions: { flexDirection: 'row', gap: 8 },
  continueButton: { flex: 1, backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontWeight: '600' },
  removeButton: { backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8 },
  removeButtonText: { color: '#D32F2F' },
  favoriteItem: { marginBottom: 16 },
  unfavoriteButton: { marginTop: 8, backgroundColor: '#FFEBEE', padding: 10, borderRadius: 8, alignItems: 'center' },
  unfavoriteText: { color: '#D32F2F', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 10 },
  emptyText: { color: '#999' }
});