import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const genreWidth = (width - 45) / 2;

const genres = [
  { id: 1, name: 'Tiên Hiệp', icon: '⚔️', color: '#ff6b6b', count: 1234 },
  { id: 2, name: 'Huyền Huyễn', icon: '✨', color: '#4834df', count: 2341 },
  { id: 3, name: 'Đô Thị', icon: '🏙️', color: '#00d2d3', count: 987 },
  { id: 4, name: 'Khoa Huyễn', icon: '🚀', color: '#5f27cd', count: 1567 },
  { id: 5, name: 'Kiếm Hiệp', icon: '🗡️', color: '#ff9ff3', count: 876 },
  { id: 6, name: 'Võng Du', icon: '🎮', color: '#48dbfb', count: 654 },
  { id: 7, name: 'Lịch Sử', icon: '📜', color: '#feca57', count: 432 },
  { id: 8, name: 'Quân Sự', icon: '⚔️', color: '#ee5a6f', count: 765 },
  { id: 9, name: 'Đam Mỹ', icon: '💕', color: '#f368e0', count: 1890 },
  { id: 10, name: 'Ngôn Tình', icon: '💖', color: '#ff6348', count: 2100 },
];

const tags = [
  'Xuyên Không', 'Tu Tiên', 'Hệ Thống', 'Trọng Sinh', 
  'Phản Diện', 'Vô Địch', 'Nữ Cường', 'Sủng Văn',
  'Cung Đấu', 'Học Đường', 'Tổng Tài', 'Dị Giới'
];

export default function ExploreScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#2d3436" />
        </TouchableOpacity>
      </View>

      {/* Popular Tags */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Tags phổ biến</Text>
        </View>
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <TouchableOpacity key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Genres Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📚 Thể loại</Text>
          <Text style={styles.sectionSubtitle}>Tìm truyện theo sở thích</Text>
        </View>
        
        <View style={styles.genresGrid}>
          {genres.map((genre) => (
            <TouchableOpacity 
              key={genre.id}
              style={[styles.genreCard, { backgroundColor: genre.color + '15' }]}
            >
              <View style={[styles.genreIcon, { backgroundColor: genre.color }]}>
                <Text style={styles.genreEmoji}>{genre.icon}</Text>
              </View>
              <Text style={styles.genreName}>{genre.name}</Text>
              <Text style={styles.genreCount}>{genre.count} truyện</Text>
              <View style={[styles.genreCorner, { backgroundColor: genre.color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
  },

  // Section
  section: {
    marginTop: 15,
  },
  sectionHeader: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#95a5a6',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tagText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },

  // Genres Grid
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    gap: 12,
  },
  genreCard: {
    width: genreWidth,
    height: 130,
    borderRadius: 16,
    padding: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  genreIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  genreEmoji: {
    fontSize: 24,
  },
  genreName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  genreCount: {
    fontSize: 12,
    color: '#636e72',
  },
  genreCorner: {
    position: 'absolute',
    bottom: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.3,
  },
});