import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const columnWidth = (width - 40) / 3;

// 1. Cập nhật Interface khớp với DB mới
interface Story {
  id: number;
  title: string;
  thumbnail_url: string;
  description: string;
  status: string; // 'Đang ra' hoặc 'Hoàn thành'
}

export default function HomeScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_URL = "http://localhost:8080/api/stories"; 

  useEffect(() => {
    axios.get(API_URL)
      .then(response => {
        setStories(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi kết nối:", error);
        setLoading(false);
      });
  }, []);

  // 2. Component Header (Banner và Tiêu đề mục)
  const renderHeader = () => (
    <View>
      {/* Banner giả lập truyện nổi bật */}
      <TouchableOpacity 
        style={styles.bannerContainer}
        onPress={() => stories.length > 0 && router.push({ pathname: "/story/[id]", params: { id: stories[0].id } })}
      >
        <Image 
          source={{ uri: stories[0]?.thumbnail_url || 'https://via.placeholder.com/400x200' }} 
          style={styles.bannerImage}
        />
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerTitle}>TRUYỆN ĐỀ CỬ</Text>
          <Text style={styles.bannerStoryName}>{stories[0]?.title}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>TRUYỆN MỚI CẬP NHẬT</Text>
        <TouchableOpacity><Text style={styles.seeMore}>Xem tất cả {'>'}</Text></TouchableOpacity>
      </View>
    </View>
  );

  // 3. Render từng ô truyện
  const renderStoryItem = ({ item }: { item: Story }) => (
    <TouchableOpacity 
      style={styles.storyCard}
      onPress={() => router.push({ pathname: "/story/[id]", params: { id: item.id } })}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.thumbnail_url }} 
          style={styles.image} 
          resizeMode="cover"
        />
        {/* Hiện nhãn HOT nếu là truyện đang ra */}
        {item.status === 'Đang ra' && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>HOT</Text>
          </View>
        )}
        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.storyTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.chapterText}>Chapter 100+</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f39c12" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListHeaderComponent={renderHeader} // Đưa Banner lên đầu danh sách
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Banner Styles
  bannerContainer: { width: '100%', height: 200, marginBottom: 20, position: 'relative' },
  bannerImage: { width: '100%', height: '100%', opacity: 0.8, backgroundColor: '#000' },
  bannerOverlay: { position: 'absolute', bottom: 20, left: 20 },
  bannerTitle: { color: '#ff4757', fontWeight: 'bold', fontSize: 12 },
  bannerStoryName: { color: '#fff', fontSize: 22, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', borderLeftWidth: 4, borderLeftColor: '#ff4757', paddingLeft: 10 },
  seeMore: { fontSize: 13, color: '#999' },

  listContent: { paddingBottom: 20 },

  storyCard: { width: columnWidth, marginHorizontal: 6, marginBottom: 20 },
  imageContainer: { width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0' },
  image: { width: '100%', height: '100%' },
  
  hotBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#ff4757', paddingHorizontal: 6, paddingVertical: 2, borderBottomLeftRadius: 8 },
  hotText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  timeBadge: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 2 },
  timeText: { color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: '500' },

  storyTitle: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#2d3436', height: 36 },
  chapterText: { fontSize: 12, color: '#b2bec3', marginTop: 4 }
});