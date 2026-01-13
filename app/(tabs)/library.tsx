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
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

type TabType = 'history' | 'favorites';

// Extended history item với thông tin chi tiết hơn
interface ExtendedHistoryItem extends ReadingHistoryItem {
  allReadChapters?: number[]; // Danh sách tất cả các chương đã đọc
  isExpanded?: boolean; // Trạng thái mở rộng
}

export default function LibraryScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('history');
  const [readingHistory, setReadingHistory] = useState<ExtendedHistoryItem[]>([]);
  const [favoriteStories, setFavoriteStories] = useState<Story[]>([]);

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
    
    // Nhóm các chương theo storyId
    const groupedHistory = history.reduce((acc, item) => {
      if (!acc[item.storyId]) {
        acc[item.storyId] = {
          ...item,
          allReadChapters: [item.lastReadChapter],
          isExpanded: false,
        };
      } else {
        // Thêm chương vào danh sách nếu chưa có
        if (!acc[item.storyId].allReadChapters!.includes(item.lastReadChapter)) {
          acc[item.storyId].allReadChapters!.push(item.lastReadChapter);
        }
        // Cập nhật lastReadAt nếu mới hơn
        if (new Date(item.lastReadAt) > new Date(acc[item.storyId].lastReadAt)) {
          acc[item.storyId].lastReadAt = item.lastReadAt;
          acc[item.storyId].lastReadChapter = item.lastReadChapter;
        }
      }
      return acc;
    }, {} as { [key: number]: ExtendedHistoryItem });

    // Chuyển về array và sắp xếp theo thời gian đọc gần nhất
    const sortedHistory = Object.values(groupedHistory).sort((a, b) => 
      new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime()
    );

    // Sắp xếp các chương đã đọc theo thứ tự tăng dần
    sortedHistory.forEach(item => {
      if (item.allReadChapters) {
        item.allReadChapters.sort((a, b) => a - b);
      }
    });

    setReadingHistory(sortedHistory);
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

  const toggleExpandChapters = (storyId: number) => {
    setReadingHistory(prev => prev.map(item => 
      item.storyId === storyId 
        ? { ...item, isExpanded: !item.isExpanded }
        : item
    ));
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

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#673AB7' }]}>
          <Text style={styles.headerTitle}>📚 Thư Viện</Text>
        </View>
        <View style={styles.notLoggedInContainer}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={[styles.notLoggedInTitle, { color: colors.text }]}>
            Chưa đăng nhập
          </Text>
          <Text style={[styles.notLoggedInText, { color: colors.textSecondary }]}>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Thư Viện</Text>
        <Text style={styles.headerSubtitle}>Tủ sách của {user.username}</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[
            styles.tabText, 
            { color: selectedTab === 'history' ? '#9C27B0' : colors.textSecondary }
          ]}>
            🕒 Đã đọc ({readingHistory.length}) truyện
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'favorites' && styles.tabActive]}
          onPress={() => setSelectedTab('favorites')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'favorites' ? '#9C27B0' : colors.textSecondary }
          ]}>
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
              <TouchableOpacity 
                style={[styles.clearButton, { backgroundColor: colors.dangerLight }]} 
                onPress={handleClearHistory}
              >
                <Text style={[styles.clearButtonText, { color: colors.danger }]}>
                  🗑️ Xóa tất cả
                </Text>
              </TouchableOpacity>
            )}

            {readingHistory.length > 0 ? (
              readingHistory.map((item) => (
                <View key={item.storyId} style={[styles.historyItem, { backgroundColor: colors.card }]}>
                  <TouchableOpacity 
                    style={styles.historyContent} 
                    onPress={() => router.push(`/story/${item.storyId}`)}
                  >
                    <Image source={{ uri: item.thumbnailUrl }} style={styles.historyThumbnail} />
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={2}>
                        {item.storyTitle}
                      </Text>
                      <Text style={[styles.historyChapter, { color: colors.blue }]}>
                        Đọc gần nhất: Chương {item.lastReadChapter}
                      </Text>
                      {item.allReadChapters && item.allReadChapters.length > 1 && (
                        <Text style={[styles.chapterCount, { color: colors.textSecondary }]}>
                          📖 Đã đọc {item.allReadChapters.length} chương
                        </Text>
                      )}
                      <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
                        {formatDate(item.lastReadAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Show all read chapters when expanded */}
                  {item.isExpanded && item.allReadChapters && item.allReadChapters.length > 1 && (
                    <View style={[styles.chaptersListContainer, { backgroundColor: colors.background }]}>
                      <Text style={[styles.chaptersListTitle, { color: colors.text }]}>
                        Các chương đã đọc:
                      </Text>
                      <View style={styles.chaptersList}>
                        {item.allReadChapters.map((chapterNum) => (
                          <TouchableOpacity
                            key={chapterNum}
                            style={[
                              styles.chapterBadge,
                              { backgroundColor: colors.blue + '20', borderColor: colors.blue }
                            ]}
                            onPress={() => router.push(`/chapter/${item.storyId}/${chapterNum}`)}
                          >
                            <Text style={[styles.chapterBadgeText, { color: colors.blue }]}>
                              C{chapterNum}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.historyActions}>
                    <TouchableOpacity 
                      style={[styles.continueButton, { backgroundColor: colors.blue }]} 
                      onPress={() => router.push(`/chapter/${item.storyId}/${item.lastReadChapter}`)}
                    >
                      <Text style={styles.continueButtonText}>Đọc tiếp</Text>
                    </TouchableOpacity>
                    
                    {item.allReadChapters && item.allReadChapters.length > 1 && (
                      <TouchableOpacity 
                        style={[styles.expandButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} 
                        onPress={() => toggleExpandChapters(item.storyId)}
                      >
                        <Text style={[styles.expandButtonText, { color: colors.text }]}>
                          {item.isExpanded ? '▲' : '▼'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[styles.removeButton, { backgroundColor: colors.dangerLight }]} 
                      onPress={() => handleRemoveHistory(item.storyId)}
                    >
                      <Text style={[styles.removeButtonText, { color: colors.danger }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <RenderEmpty icon="📖" text="Chưa có lịch sử đọc" colors={colors} />
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {favoriteStories.length > 0 ? (
              favoriteStories.map((story) => (
                <View key={story.id} style={styles.favoriteItem}>
                  <StoryCard story={story} onPress={() => router.push(`/story/${story.id}`)} />
                  <TouchableOpacity 
                    style={[styles.unfavoriteButton, { backgroundColor: colors.dangerLight }]} 
                    onPress={() => handleRemoveFavorite(story.id)}
                  >
                    <Text style={[styles.unfavoriteText, { color: colors.danger }]}>
                      💔 Bỏ thích
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <RenderEmpty icon="❤️" text="Chưa có truyện yêu thích" colors={colors} />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const RenderEmpty = ({ icon, text, colors }: { icon: string, text: string, colors: any }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{text}</Text>
  </View>
);

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: '#9C27B0', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#F3E5F5', marginTop: 4 },
  notLoggedInContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  notLoggedInTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  notLoggedInText: { fontSize: 15, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  loginPromptButton: { backgroundColor: '#9C27B0', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  loginPromptButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#9C27B0' },
  tabText: { fontSize: 15, fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 16 },
  clearButton: { alignSelf: 'flex-end', padding: 8, borderRadius: 8, marginBottom: 12 },
  clearButtonText: { fontWeight: '600', fontSize: 12 },
  historyItem: { borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  historyContent: { flexDirection: 'row', marginBottom: 12 },
  historyThumbnail: { width: 70, height: 90, borderRadius: 6 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyTitle: { fontSize: 16, fontWeight: '600' },
  historyChapter: { marginTop: 4, fontSize: 13 },
  chapterCount: { marginTop: 4, fontSize: 12 },
  historyDate: { fontSize: 12, marginTop: 4 },
  chaptersListContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  chaptersListTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  chaptersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chapterBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  chapterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyActions: { flexDirection: 'row', gap: 8 },
  continueButton: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  continueButtonText: { color: '#fff', fontWeight: '600' },
  expandButton: {
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: { padding: 10, borderRadius: 8, minWidth: 40, alignItems: 'center' },
  removeButtonText: { fontSize: 16 },
  favoriteItem: { marginBottom: 16 },
  unfavoriteButton: { marginTop: 8, padding: 10, borderRadius: 8, alignItems: 'center' },
  unfavoriteText: { fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 15 }
});