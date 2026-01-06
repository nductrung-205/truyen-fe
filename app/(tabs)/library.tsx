import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 3;

// Mock data
const favoriteStories = [
  {
    id: 1,
    title: 'Tái Sinh Thành Hoàng Tử',
    thumbnail_url: 'https://via.placeholder.com/150',
    lastRead: 'Chapter 45',
    progress: 45,
  },
  {
    id: 2,
    title: 'Tu Tiên Trong Đô Thị',
    thumbnail_url: 'https://via.placeholder.com/150',
    lastRead: 'Chapter 23',
    progress: 23,
  },
  {
    id: 3,
    title: 'Hệ Thống Vô Địch',
    thumbnail_url: 'https://via.placeholder.com/150',
    lastRead: 'Chapter 67',
    progress: 67,
  },
];

const readingHistory = [
  {
    id: 4,
    title: 'Kiếm Đạo Độc Tôn',
    thumbnail_url: 'https://via.placeholder.com/150',
    lastRead: 'Chapter 12',
    readAt: '2 giờ trước',
  },
  {
    id: 5,
    title: 'Linh Vũ Thiên Hạ',
    thumbnail_url: 'https://via.placeholder.com/150',
    lastRead: 'Chapter 89',
    readAt: 'Hôm qua',
  },
];

export default function LibraryScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'reading' | 'history' | 'downloaded'>('reading');

  const renderStoryCard = (item: any) => (
    <TouchableOpacity 
      style={styles.storyCard}
      onPress={() => router.push({ pathname: "/story/[id]", params: { id: item.id } })}
    >
      <Image 
        source={{ uri: item.thumbnail_url }} 
        style={styles.cardImage}
      />
      <View style={styles.cardOverlay}>
        <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardChapter}>{item.lastRead}</Text>
      {item.progress && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(item.progress / 100) * 100}%` }]} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tủ sách</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={22} color="#2d3436" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={22} color="#2d3436" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={24} color="#ff6b6b" />
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Đang đọc</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#4834df" />
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>Lịch sử</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="download" size={24} color="#00d2d3" />
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Đã tải</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'reading' && styles.tabActive]}
          onPress={() => setSelectedTab('reading')}
        >
          <Text style={[styles.tabText, selectedTab === 'reading' && styles.tabTextActive]}>
            Đang đọc
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
            Lịch sử
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'downloaded' && styles.tabActive]}
          onPress={() => setSelectedTab('downloaded')}
        >
          <Text style={[styles.tabText, selectedTab === 'downloaded' && styles.tabTextActive]}>
            Đã tải
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {selectedTab === 'reading' && (
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tiếp tục đọc</Text>
            <TouchableOpacity>
              <Ionicons name="swap-vertical" size={20} color="#636e72" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.storiesGrid}>
            {favoriteStories.map((story) => (
              <View key={story.id}>
                {renderStoryCard(story)}
              </View>
            ))}
          </View>
        </View>
      )}

      {selectedTab === 'history' && (
        <View style={styles.content}>
          {readingHistory.map((story) => (
            <TouchableOpacity 
              key={story.id}
              style={styles.historyItem}
              onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })}
            >
              <Image 
                source={{ uri: story.thumbnail_url }} 
                style={styles.historyImage}
              />
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle} numberOfLines={2}>
                  {story.title}
                </Text>
                <Text style={styles.historyChapter}>{story.lastRead}</Text>
                <Text style={styles.historyTime}>
                  <Ionicons name="time-outline" size={12} /> {story.readAt}
                </Text>
              </View>
              <TouchableOpacity style={styles.historyAction}>
                <Ionicons name="close-circle" size={24} color="#dfe6e9" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedTab === 'downloaded' && (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-download-outline" size={80} color="#dfe6e9" />
          <Text style={styles.emptyText}>Chưa có truyện tải về</Text>
          <Text style={styles.emptySubtext}>
            Tải truyện về để đọc offline
          </Text>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 12,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
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

  // Content
  content: {
    paddingHorizontal: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3436',
  },

  // Stories Grid
  storiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  storyCard: {
    width: cardWidth,
  },
  cardImage: {
    width: '100%',
    height: cardWidth * 1.4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: cardWidth * 1.4 - cardWidth * 1.4 + 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 8,
    lineHeight: 18,
  },
  cardChapter: {
    fontSize: 11,
    color: '#b2bec3',
    marginTop: 4,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
  },

  // History List
  historyItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  historyImage: {
    width: 60,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 6,
  },
  historyChapter: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#b2bec3',
  },
  historyAction: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#636e72',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#b2bec3',
    marginTop: 8,
  },
});