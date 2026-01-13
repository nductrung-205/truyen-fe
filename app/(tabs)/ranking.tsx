import React, { useState, useEffect } from 'react';
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

type RankingType = 'views' | 'rating';

export default function RankingScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<RankingType>('views');
  const [topViewStories, setTopViewStories] = useState<Story[]>([]);
  const [topRatingStories, setTopRatingStories] = useState<Story[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load hot stories (top views)
      const hotResponse = await storyService.getHotStories();
      setTopViewStories(hotResponse.data);

      // Load all stories và sort theo rating
      const allResponse = await storyService.getAllStories(0, 50, 'rating');
      const sortedByRating = allResponse.data.stories.sort((a: Story, b: Story) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;

        // Sắp xếp theo rating trước
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }

        // Nếu rating bằng nhau, sắp xếp theo lượt xem
        return (b.views || 0) - (a.views || 0);

        // Hoặc sắp xếp theo số chapter
        // return (b.chapters?.length || 0) - (a.chapters?.length || 0);

        // Hoặc sắp xếp theo thời gian cập nhật (mới nhất lên đầu)
        // return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setTopRatingStories(sortedByRating);
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

  const navigateToStory = (storyId: number) => {
    router.push(`/story/${storyId}`);
  };

  const displayStories = selectedTab === 'views' ? topViewStories : topRatingStories;

  if (loading) {
    return <LoadingSpinner text="Đang tải xếp hạng..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Bảng Xếp Hạng</Text>
        <Text style={styles.headerSubtitle}>Top truyện được yêu thích nhất</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'views' && styles.tabActive
          ]}
          onPress={() => setSelectedTab('views')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'views' && styles.tabTextActive,
            { color: selectedTab === 'views' ? '#FF9800' : colors.textSecondary }
          ]}>
            👁 Lượt Xem
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'rating' && styles.tabActive
          ]}
          onPress={() => setSelectedTab('rating')}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.tabText,
            selectedTab === 'rating' && styles.tabTextActive,
            { color: selectedTab === 'rating' ? '#FF9800' : colors.textSecondary }
          ]}>
            ⭐ Đánh Giá
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
        <View style={styles.rankingList}>
          {displayStories.length > 0 ? (
            displayStories.map((story, index) => (
              <View key={story.id} style={styles.rankingItem}>
                {/* Rank Badge */}
                <View style={[
                  styles.rankBadge,
                  index === 0 && styles.rankBadgeGold,
                  index === 1 && styles.rankBadgeSilver,
                  index === 2 && styles.rankBadgeBronze,
                  index > 2 && { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border }
                ]}>
                  <Text style={[
                    styles.rankNumber,
                    index > 2 && { color: colors.text }
                  ]}>
                    {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : `${index + 1}`}
                  </Text>
                </View>

                {/* Story Card */}
                <View style={styles.storyCardContainer}>
                  <StoryCard
                    story={story}
                    onPress={() => navigateToStory(story.id)}
                  />

                  {/* Stats Badge */}
                  <View style={[
                    styles.statsBadge,
                    { backgroundColor: activeTheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.7)' }
                  ]}>
                    {selectedTab === 'views' ? (
                      <Text style={styles.statsText}>
                        👁 {formatNumber(story.views)} lượt xem
                      </Text>
                    ) : (
                      <Text style={styles.statsText}>
                        ⭐ {story.rating?.toFixed(1) || 0} / 5.0
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Chưa có dữ liệu xếp hạng
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FF9800',
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
    color: '#FFF3E0',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FF9800',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FF9800',
  },
  content: {
    flex: 1,
  },
  rankingList: {
    padding: 16,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 12,
  },
  rankBadgeGold: {
    backgroundColor: '#FFD700',
  },
  rankBadgeSilver: {
    backgroundColor: '#C0C0C0',
  },
  rankBadgeBronze: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  storyCardContainer: {
    flex: 1,
    position: 'relative',
  },
  statsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
    fontSize: 16,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});