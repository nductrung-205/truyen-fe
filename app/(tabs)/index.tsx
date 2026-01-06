import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  TextInput,
  ScrollView
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 3;

interface Story {
  id: number;
  title: string;
  thumbnail_url: string;
  description: string;
  status: string;
  views?: number;
  chapters_count?: number;
  updated_at?: string;
  author?: string;
  genres?: string[];
}

export default function HomeScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [featuredStories, setFeaturedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'hot' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const API_URL = "http://localhost:8080/api/stories";

  useEffect(() => {
    loadStories();
  }, [selectedTab]);

  const loadStories = () => {
    setLoading(true);
    let url = API_URL;
    
    if (selectedTab === 'hot') {
      url += '?status=Đang ra';
    } else if (selectedTab === 'completed') {
      url += '?status=Hoàn thành';
    }

    axios.get(url)
      .then(response => {
        const data = response.data;
        setStories(data);
        // Featured: lấy 3 truyện đầu tiên
        setFeaturedStories(data.slice(0, 3));
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi kết nối:", error);
        setLoading(false);
      });
  };

  // Header Component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Logo & Search */}
      <View style={styles.topBar}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Ionicons name="book" size={24} color="#ff6b6b" />
          </View>
          <Text style={styles.logoText}>
            TRUYEN<Text style={styles.logoAccent}>APP</Text>
          </Text>
        </View>
        
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm truyện..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity>
          <Ionicons name="options-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'hot' && styles.tabActive]}
          onPress={() => setSelectedTab('hot')}
        >
          <Text style={[styles.tabText, selectedTab === 'hot' && styles.tabTextActive]}>
            Đang hot
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'completed' && styles.tabActive]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.tabTextActive]}>
            Hoàn thành
          </Text>
        </TouchableOpacity>
      </View>

      {/* Featured Banner */}
      {featuredStories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.bannerScroll}
          contentContainerStyle={styles.bannerContent}
        >
          {featuredStories.map((story, index) => (
            <TouchableOpacity
              key={story.id}
              style={styles.bannerCard}
              onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })}
            >
              <Image 
                source={{ uri: story.thumbnail_url }} 
                style={styles.bannerImage}
              />
              <View style={styles.bannerOverlay}>
                <View style={styles.featuredBadge}>
                  <Ionicons name="star" size={12} color="#ffd700" />
                  <Text style={styles.featuredText}>ĐỀ CỬ</Text>
                </View>
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {story.title}
                </Text>
                <View style={styles.bannerStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={14} color="#fff" />
                    <Text style={styles.statText}>
                      {story.views ? (story.views / 1000).toFixed(1) + 'K' : '0'}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="book-outline" size={14} color="#fff" />
                    <Text style={styles.statText}>
                      {story.chapters_count || 0}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleBox}>
          <View style={styles.sectionDot} />
          <Text style={styles.sectionTitle}>TRUYỆN MỚI CẬP NHẬT</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Xem tất cả →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Story Card Component
  const renderStoryCard = ({ item }: { item: Story }) => {
    const timeAgo = item.updated_at ? getTimeAgo(item.updated_at) : '1 giờ trước';
    
    return (
      <TouchableOpacity 
        style={styles.storyCard}
        onPress={() => router.push({ pathname: "/story/[id]", params: { id: item.id } })}
      >
        <View style={styles.cardImageContainer}>
          <Image 
            source={{ uri: item.thumbnail_url }} 
            style={styles.cardImage}
            resizeMode="cover"
          />
          
          {/* Hot Badge */}
          {item.status === 'Đang ra' && (
            <View style={styles.hotBadge}>
              <Text style={styles.hotText}>HOT</Text>
            </View>
          )}
          
          {/* Time Badge */}
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={10} color="#fff" />
            <Text style={styles.timeText}>{timeAgo}</Text>
          </View>

          {/* Views */}
          <View style={styles.viewsBadge}>
            <Ionicons name="eye" size={10} color="#fff" />
            <Text style={styles.viewsText}>
              {item.views ? formatViews(item.views) : '0'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <Text style={styles.cardChapter}>
          Chapter {item.chapters_count || 0}
        </Text>
      </TouchableOpacity>
    );
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views.toString();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b6b" />
        <Text style={styles.loadingText}>Đang tải truyện...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderStoryCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#999',
  },

  // Header
  headerContainer: {
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 42,
    height: 42,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffe3e3',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  logoAccent: {
    color: '#ff6b6b',
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2d3436',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 15,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  tabActive: {
    backgroundColor: '#ff6b6b',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636e72',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Banner
  bannerScroll: {
    marginTop: 15,
  },
  bannerContent: {
    paddingHorizontal: 15,
    gap: 12,
  },
  bannerCard: {
    width: width * 0.7,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bannerStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionDot: {
    width: 4,
    height: 18,
    backgroundColor: '#ff6b6b',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  seeAll: {
    fontSize: 13,
    color: '#ff6b6b',
    fontWeight: '500',
  },

  // Story Cards
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    paddingHorizontal: 15,
    gap: 8,
  },
  storyCard: {
    width: cardWidth,
    marginBottom: 20,
  },
  cardImageContainer: {
    width: '100%',
    height: cardWidth * 1.4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  hotBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  hotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '500',
  },
  viewsBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },
  viewsText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 8,
    lineHeight: 18,
    height: 36,
  },
  cardChapter: {
    fontSize: 11,
    color: '#b2bec3',
    marginTop: 4,
  },
});