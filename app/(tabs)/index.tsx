import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { storyService } from '@/services/storyService';
import { Story } from '@/types';
import { StoryCard } from '@/components/StoryCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectionHeader } from '@/components/SectionHeader';

export default function IndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hotStories, setHotStories] = useState<Story[]>([]);
  const [newStories, setNewStories] = useState<Story[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Gọi song song 2 API
      const [hotRes, newRes] = await Promise.all([
        storyService.getHotStories(),
        storyService.getAllStories(0, 10, 'createdAt'),
      ]);

      setHotStories(hotRes.data);
      setNewStories(newRes.data.stories);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
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

  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Truyện Hay</Text>
        <Text style={styles.headerSubtitle}>Khám phá thế giới truyện tranh</Text>
      </View>

      {/* Hot Stories Section */}
      <View style={styles.section}>
        <SectionHeader 
          title="Truyện Hot" 
          icon="🔥"
          onSeeAll={() => router.push('/ranking')}
        />
        
        {hotStories.length > 0 ? (
          <FlatList
            horizontal
            data={hotStories.slice(0, 5)}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.horizontalCard}>
                <StoryCard 
                  story={item} 
                  onPress={() => navigateToStory(item.id)} 
                />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <Text style={styles.emptyText}>Chưa có truyện hot</Text>
        )}
      </View>

      {/* New Stories Section */}
      <View style={styles.section}>
        <SectionHeader 
          title="Mới Cập Nhật" 
          icon="✨"
          onSeeAll={() => router.push('/explore')}
        />
        
        <View style={styles.verticalList}>
          {newStories.length > 0 ? (
            newStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onPress={() => navigateToStory(story.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>Chưa có truyện mới</Text>
          )}
        </View>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#007AFF',
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
    color: '#E3F2FD',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  horizontalList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  horizontalCard: {
    width: 280,
    marginRight: 8,
  },
  verticalList: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 32,
  },
});