import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Alert,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { storyService } from '@/services/storyService';
import { Story } from '@/types';
import { StoryCard } from '@/components/StoryCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

type TabType = 'day' | 'week' | 'month' | 'favorite' | 'new' | 'latest' | 'full' | 'random';

interface Tab {
  id: TabType;
  label: string;
  sortBy: string;
}

const TABS: Tab[] = [
  { id: 'day', label: 'Top Ngày', sortBy: 'views' },
  { id: 'week', label: 'Top Tuần', sortBy: 'views' },
  { id: 'month', label: 'Top Tháng', sortBy: 'views' },
  { id: 'favorite', label: 'Yêu Thích', sortBy: 'rating' },
  { id: 'new', label: 'Mới Cập Nhật', sortBy: 'updatedAt' },
  { id: 'latest', label: 'Truyện Mới', sortBy: 'createdAt' },
  { id: 'full', label: 'Truyện Full', sortBy: 'updatedAt' },
  { id: 'random', label: 'Truyện Ngẫu Nhiên', sortBy: 'createdAt' },
];

const ITEMS_PER_PAGE = 10;
const PREVIEW_ITEMS = 5;

export default function IndexScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('day');
  const [stories, setStories] = useState<Story[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadData(0, false);
  }, [activeTab]);

  const loadData = async (pageNum = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const currentTab = TABS.find(t => t.id === activeTab);
      let response: any;

      // Phân luồng API theo Tab
      if (activeTab === 'day' || activeTab === 'week' || activeTab === 'month') {
        response = await storyService.getTopStories(activeTab, pageNum, ITEMS_PER_PAGE);
      } else if (activeTab === 'full') {
        response = await storyService.advancedSearch({
          status: 'Hoàn thành',
          sort: 'updatedAt',
          page: pageNum,
          size: ITEMS_PER_PAGE
        });
      } else if (activeTab === 'random') {
        // Với random, ta lấy trang đầu tiên và shuffle
        response = await storyService.getAllStories(pageNum, ITEMS_PER_PAGE, 'createdAt');
        response.data.stories = [...response.data.stories].sort(() => Math.random() - 0.5);
      } else {
        response = await storyService.getAllStories(
          pageNum,
          ITEMS_PER_PAGE,
          currentTab?.sortBy || 'createdAt'
        );
      }

      const newStories = response.data.stories || [];
      const totalPages = response.data.totalPages || 0;
      const currentPage = response.data.currentPage || 0;

      if (append) {
        setStories(prev => [...prev, ...newStories]);
      } else {
        setStories(newStories);
      }
      
      setPage(currentPage);
      setHasMore(currentPage < totalPages - 1);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    loadData(0, false);
  };

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setStories([]);
    setPage(0);
    setShowAll(false);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore || !showAll) return;
    loadData(page + 1, true);
  };

  const navigateToStory = (storyId: number) => {
    router.push(`/story/${storyId}`);
  };

  // Render Header của FlatList (Gồm Tiêu đề và Tabs)
  const renderHeader = () => (
    <View>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>📚 Truyện Hay</Text>
        <Text style={[styles.headerSubtitle, { color: colors.background }]}>
          Khám phá thế giới truyện tranh
        </Text>
      </View>

      <FlatList
        horizontal
        data={TABS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        style={[styles.tabsContainer, { backgroundColor: colors.card }]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === item.id && [styles.activeTab, { backgroundColor: colors.primary }],
            ]}
            onPress={() => handleTabChange(item.id)}
          >
            <Text
              style={[
                styles.tabText,
                { color: colors.text },
                activeTab === item.id && styles.activeTabText,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {TABS.find(t => t.id === activeTab)?.label}
        </Text>
        {!showAll && stories.length > PREVIEW_ITEMS && (
          <TouchableOpacity onPress={() => setShowAll(true)}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              Xem tất cả ({stories.length}+) →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!showAll) return <View style={styles.bottomSpacing} />;
    if (loadingMore) {
      return <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />;
    }
    if (!hasMore && stories.length > 0) {
      return (
        <View style={styles.noMoreContainer}>
          <Text style={[styles.noMoreText, { color: colors.textSecondary }]}>
            🎉 Đã hiển thị tất cả truyện
          </Text>
        </View>
      );
    }
    return <View style={styles.bottomSpacing} />;
  };

  // Lọc dữ liệu hiển thị (nếu chưa nhấn Xem tất cả thì chỉ hiện 5 cái đầu)
  const displayData = showAll ? stories : stories.slice(0, PREVIEW_ITEMS);

  if (loading && stories.length === 0) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={displayData}
        keyExtractor={(item) => `${item.id}-${activeTab}`}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
            <StoryCard story={item} onPress={() => navigateToStory(item.id)} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Chưa có truyện trong danh mục này
              </Text>
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, opacity: 0.9 },
  tabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 12 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    height: 36,
  },
  activeTab: { elevation: 3, shadowOpacity: 0.1 },
  tabText: { fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#fff', fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, textAlign: 'center' },
  noMoreContainer: { alignItems: 'center', paddingVertical: 30 },
  noMoreText: { fontSize: 14 },
  bottomSpacing: { height: 40 },
});