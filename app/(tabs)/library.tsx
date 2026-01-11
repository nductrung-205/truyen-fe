import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { storageService, ReadingHistoryItem } from '@/services/storageService';
import { storyService } from '@/services/storyService';
import { Story } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StoryCard } from '@/components/StoryCard';

type TabType = 'history' | 'favorites';

export default function LibraryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('history');
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [favoriteStories, setFavoriteStories] = useState<Story[]>([]);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadReadingHistory(),
        loadFavorites(),
      ]);
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

      // Load story details for each favorite
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
    await loadData();
    setRefreshing(false);
  };

  const handleRemoveHistory = (storyId: number) => {
    Alert.alert(
      'Xóa lịch sử',
      'Bạn có chắc muốn xóa truyện này khỏi lịch sử đọc?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await storageService.removeFromReadingHistory(storyId);
            await loadReadingHistory();
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Xóa toàn bộ lịch sử',
      'Bạn có chắc muốn xóa toàn bộ lịch sử đọc?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearReadingHistory();
            await loadReadingHistory();
          },
        },
      ]
    );
  };

  const handleRemoveFavorite = async (storyId: number) => {
    await storageService.removeFromFavorites(storyId);
    await loadFavorites();
  };

  const navigateToStory = (storyId: number) => {
    router.push(`/story/${storyId}`);
  };

  const navigateToChapter = (storyId: number, chapterNumber: number) => {
    router.push(`/chapter/${storyId}/${chapterNumber}`);
  };

  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Thư Viện</Text>
        <Text style={styles.headerSubtitle}>Truyện của bạn</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
            🕒 Đã đọc ({readingHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'favorites' && styles.tabActive]}
          onPress={() => setSelectedTab('favorites')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.tabTextActive]}>
            ❤️ Yêu thích ({favoriteStories.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'history' ? (
          <View style={styles.section}>
            {/* Clear History Button */}
            {readingHistory.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearHistory}
              >
                <Text style={styles.clearButtonText}>🗑️ Xóa tất cả</Text>
              </TouchableOpacity>
            )}

            {/* Reading History List */}
            {readingHistory.length > 0 ? (
              readingHistory.map((item) => (
                <View key={item.storyId} style={styles.historyItem}>
                  <TouchableOpacity
                    style={styles.historyContent}
                    onPress={() => navigateToStory(item.storyId)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: item.thumbnailUrl }}
                      style={styles.historyThumbnail}
                    />
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle} numberOfLines={2}>
                        {item.storyTitle}
                      </Text>
                      <Text style={styles.historyAuthor}>{item.authorName}</Text>
                      <Text style={styles.historyChapter}>
                        📖 Đọc đến chương {item.lastReadChapter}
                      </Text>
                      <Text style={styles.historyDate}>
                        {formatDate(item.lastReadAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.historyActions}>
                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={() => navigateToChapter(item.storyId, item.lastReadChapter)}
                    >
                      <Text style={styles.continueButtonText}>Đọc tiếp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveHistory(item.storyId)}
                    >
                      <Text style={styles.removeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📖</Text>
                <Text style={styles.emptyText}>Chưa có lịch sử đọc</Text>
                <Text style={styles.emptySubtext}>
                  Bắt đầu đọc truyện để xem lịch sử ở đây
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {/* Favorites List */}
            {favoriteStories.length > 0 ? (
              favoriteStories.map((story) => (
                <View key={story.id} style={styles.favoriteItem}>
                  <StoryCard
                    story={story}
                    onPress={() => navigateToStory(story.id)}
                  />
                  <TouchableOpacity
                    style={styles.unfavoriteButton}
                    onPress={() => handleRemoveFavorite(story.id)}
                  >
                    <Text style={styles.unfavoriteText}>💔 Bỏ thích</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>❤️</Text>
                <Text style={styles.emptyText}>Chưa có truyện yêu thích</Text>
                <Text style={styles.emptySubtext}>
                  Thêm truyện vào yêu thích để xem ở đây
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#F3E5F5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#9C27B0',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#9C27B0',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginBottom: 16,
  },
  clearButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 14,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyThumbnail: {
    width: 80,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  historyAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  historyChapter: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  historyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: '#D32F2F',
  },
  favoriteItem: {
    marginBottom: 12,
  },
  unfavoriteButton: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  unfavoriteText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});