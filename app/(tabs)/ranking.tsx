import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { storyService } from '@/services/storyService';
import { Story } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { StoryCard } from '@/components/StoryCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons'; // Đảm bảo bạn đã cài expo-icons

type RankingType = 'views' | 'rating';
type SortOrder = 'desc' | 'asc'; // desc: nhiều nhất, asc: ít nhất

export default function RankingScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<RankingType>('views');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [allStories, setAllStories] = useState<Story[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Lấy danh sách truyện (lấy khoảng 50-100 truyện để xếp hạng cục bộ)
      const response = await storyService.getAllStories(0, 100);
      setAllStories(response.data.stories);
    } catch (error) {
      console.error('Error loading ranking data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu xếp hạng');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Logic sắp xếp dữ liệu dựa trên Tab và Order
  const displayStories = useMemo(() => {
    return [...allStories].sort((a, b) => {
      const valA = selectedTab === 'views' ? a.views : (a.rating || 0);
      const valB = selectedTab === 'views' ? b.views : (b.rating || 0);

      if (sortOrder === 'desc') {
        return valB - valA; // Nhiều nhất lên đầu
      } else {
        return valA - valB; // Ít nhất lên đầu
      }
    });
  }, [allStories, selectedTab, sortOrder]);

  const navigateToStory = (storyId: number) => {
    router.push(`/story/${storyId}`);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  if (loading) {
    return <LoadingSpinner text="Đang tải xếp hạng..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Bảng Xếp Hạng</Text>
        <Text style={styles.headerSubtitle}>Khám phá truyện theo sở thích của bạn</Text>
      </View>

      {/* Tabs & Filter Bar */}
      <View style={[styles.filterBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'views' && styles.tabActive]}
            onPress={() => setSelectedTab('views')}
          >
            <Text style={[styles.tabText, { color: selectedTab === 'views' ? '#FF9800' : colors.textSecondary }]}>
              👁 Lượt Xem
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === 'rating' && styles.tabActive]}
            onPress={() => setSelectedTab('rating')}
          >
            <Text style={[styles.tabText, { color: selectedTab === 'rating' ? '#FF9800' : colors.textSecondary }]}>
              ⭐ Đánh Giá
            </Text>
          </TouchableOpacity>
        </View>

        {/* Nút Toggle Sắp xếp */}
        <TouchableOpacity 
          style={[styles.sortToggle, { backgroundColor: colors.border }]} 
          onPress={toggleSortOrder}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={sortOrder === 'desc' ? "trending-down" : "trending-up"} 
            size={18} 
            color={colors.text} 
          />
          <Text style={[styles.sortToggleText, { color: colors.text }]}>
            {sortOrder === 'desc' ? 'Nhiều nhất' : 'Ít nhất'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.rankingList}>
          {displayStories.length > 0 ? (
            displayStories.map((story, index) => (
              <View key={story.id} style={styles.rankingItem}>
                {/* Rank Badge */}
                <View style={[
                  styles.rankBadge,
                  sortOrder === 'desc' && index === 0 && styles.rankBadgeGold,
                  sortOrder === 'desc' && index === 1 && styles.rankBadgeSilver,
                  sortOrder === 'desc' && index === 2 && styles.rankBadgeBronze,
                  (sortOrder === 'asc' || index > 2) && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
                ]}>
                  <Text style={[styles.rankNumber, (sortOrder === 'asc' || index > 2) && { color: colors.text }]}>
                    {sortOrder === 'desc' && index < 3 
                      ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') 
                      : `${index + 1}`}
                  </Text>
                </View>

                {/* Story Card */}
                <View style={styles.storyCardContainer}>
                  <StoryCard story={story} onPress={() => navigateToStory(story.id)} />

                  {/* Stats Badge */}
                  <View style={[
                    styles.statsBadge,
                    { backgroundColor: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.7)' }
                  ]}>
                    <Text style={styles.statsText}>
                      {selectedTab === 'views' 
                        ? `👁 ${formatNumber(story.views)}` 
                        : `⭐ ${story.rating?.toFixed(1) || 0}`}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không tìm thấy dữ liệu</Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: '#FFF3E0', marginTop: 4 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    height: 60,
  },
  tabWrapper: { flexDirection: 'row', flex: 1 },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#FF9800' },
  tabText: { fontSize: 15, fontWeight: '600' },
  sortToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sortToggleText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  content: { flex: 1 },
  rankingList: { padding: 16 },
  rankingItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 10,
  },
  rankBadgeGold: { backgroundColor: '#FFD700' },
  rankBadgeSilver: { backgroundColor: '#C0C0C0' },
  rankBadgeBronze: { backgroundColor: '#CD7F32' },
  rankNumber: { fontSize: 14, fontWeight: '700' },
  storyCardContainer: { flex: 1, position: 'relative' },
  statsBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statsText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyText: { fontSize: 16 },
  bottomSpacing: { height: 40 },
});