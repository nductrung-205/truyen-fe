import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Story {
  id: number;
  title: string;
  thumbnail_url: string;
  description: string;
  status: string;
  author?: string;
  views?: number;
  rating?: number;
}

interface Chapter {
  id: number;
  story_id: number;
  chapter_number: number;
  title: string;
  created_at: string;
}

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const API_URL = "http://localhost:8080/api";

  useEffect(() => {
    // Lấy thông tin truyện
    axios.get(`${API_URL}/stories/${id}`)
      .then(response => {
        setStory(response.data);
      })
      .catch(error => console.error("Lỗi tải truyện:", error));

    // Lấy danh sách chapter
    axios.get(`${API_URL}/stories/${id}/chapters`)
      .then(response => {
        setChapters(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi tải chapters:", error);
        setLoading(false);
      });
  }, [id]);

  const handleReadFirst = () => {
    if (chapters.length > 0) {
      router.push({ 
        pathname: "/chapter/[id]", 
        params: { id: chapters[0].id } 
      });
    }
  };

  const handleReadLatest = () => {
    if (chapters.length > 0) {
      router.push({ 
        pathname: "/chapter/[id]", 
        params: { id: chapters[chapters.length - 1].id } 
      });
    }
  };

  const handleChapterPress = (chapterId: number) => {
    router.push({ pathname: "/chapter/[id]", params: { id: chapterId } });
  };

  if (loading || !story) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff4757" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header với nút Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color="#ff4757" 
          />
        </TouchableOpacity>
      </View>

      {/* Thumbnail và Info */}
      <View style={styles.topSection}>
        <Image 
          source={{ uri: story.thumbnail_url }} 
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        <View style={styles.infoSection}>
          <Text style={styles.title}>{story.title}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{story.status}</Text>
            </View>
            {story.rating && (
              <View style={styles.ratingBox}>
                <Ionicons name="star" size={14} color="#f39c12" />
                <Text style={styles.ratingText}>{story.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {story.author && (
            <Text style={styles.author}>Tác giả: {story.author}</Text>
          )}
          
          {story.views && (
            <Text style={styles.views}>
              <Ionicons name="eye-outline" size={14} /> {story.views.toLocaleString()} lượt xem
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={handleReadFirst}
        >
          <Ionicons name="play" size={18} color="#fff" />
          <Text style={styles.buttonText}>Đọc từ đầu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReadLatest}
        >
          <Ionicons name="flash" size={18} color="#ff4757" />
          <Text style={styles.buttonTextSecondary}>Đọc mới nhất</Text>
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giới thiệu</Text>
        <Text style={styles.description}>{story.description}</Text>
      </View>

      {/* Chapter List */}
      <View style={styles.section}>
        <View style={styles.chapterHeader}>
          <Text style={styles.sectionTitle}>
            Danh sách chương ({chapters.length})
          </Text>
          <TouchableOpacity>
            <Ionicons name="filter" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {chapters.map((chapter, index) => (
          <TouchableOpacity 
            key={chapter.id}
            style={styles.chapterItem}
            onPress={() => handleChapterPress(chapter.id)}
          >
            <View style={styles.chapterLeft}>
              <Text style={styles.chapterNumber}>
                Chapter {chapter.chapter_number}
              </Text>
              <Text style={styles.chapterTitle} numberOfLines={1}>
                {chapter.title}
              </Text>
            </View>
            
            <View style={styles.chapterRight}>
              <Text style={styles.chapterDate}>
                {new Date(chapter.created_at).toLocaleDateString('vi-VN')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Top Section
  topSection: {
    flexDirection: 'row',
    padding: 15,
    paddingTop: 90,
    backgroundColor: '#f8f9fa',
  },
  thumbnail: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  infoSection: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3436',
  },
  author: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 4,
  },
  views: {
    fontSize: 12,
    color: '#b2bec3',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#ff4757',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ff4757',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#ff4757',
    fontSize: 15,
    fontWeight: '600',
  },

  // Sections
  section: {
    padding: 15,
    borderTopWidth: 8,
    borderTopColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#636e72',
  },

  // Chapter List
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  chapterLeft: {
    flex: 1,
  },
  chapterNumber: {
    fontSize: 13,
    color: '#ff4757',
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 14,
    color: '#2d3436',
  },
  chapterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterDate: {
    fontSize: 12,
    color: '#b2bec3',
  },
});