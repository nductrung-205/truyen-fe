import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Chapter {
  id: number;
  story_id: number;
  chapter_number: number;
  title: string;
  content: string;
  created_at: string;
}

interface Story {
  id: number;
  title: string;
}

export default function ChapterScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);

  const API_URL = "http://localhost:8080/api";

  useEffect(() => {
    // Lấy thông tin chapter
    axios.get(`${API_URL}/chapters/${id}`)
      .then(response => {
        const chapterData = response.data;
        setChapter(chapterData);
        
        // Lấy thông tin truyện
        return axios.get(`${API_URL}/stories/${chapterData.story_id}`);
      })
      .then(response => {
        setStory(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Lỗi tải chapter:", error);
        setLoading(false);
      });
  }, [id]);

  const handlePrevChapter = () => {
    if (chapter && chapter.chapter_number > 1) {
      // Giả sử bạn có API để lấy chapter trước đó
      axios.get(`${API_URL}/stories/${chapter.story_id}/chapters/${chapter.chapter_number - 1}`)
        .then(response => {
          router.replace({ pathname: "/chapter/[id]", params: { id: response.data.id } });
        })
        .catch(error => console.error("Không có chapter trước:", error));
    }
  };

  const handleNextChapter = () => {
    if (chapter) {
      axios.get(`${API_URL}/stories/${chapter.story_id}/chapters/${chapter.chapter_number + 1}`)
        .then(response => {
          router.replace({ pathname: "/chapter/[id]", params: { id: response.data.id } });
        })
        .catch(error => console.error("Không có chapter tiếp theo:", error));
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 24) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  if (loading || !chapter || !story) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff4757" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2d3436" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.storyTitle} numberOfLines={1}>
            {story.title}
          </Text>
          <Text style={styles.chapterTitle}>
            Chapter {chapter.chapter_number}: {chapter.title}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#2d3436" />
        </TouchableOpacity>
      </View>

      {/* Font Size Control */}
      <View style={styles.fontControl}>
        <TouchableOpacity 
          onPress={decreaseFontSize} 
          style={styles.fontButton}
        >
          <Ionicons name="remove" size={20} color="#636e72" />
          <Text style={styles.fontButtonText}>A</Text>
        </TouchableOpacity>
        
        <Text style={styles.fontSizeText}>{fontSize}px</Text>
        
        <TouchableOpacity 
          onPress={increaseFontSize} 
          style={styles.fontButton}
        >
          <Ionicons name="add" size={20} color="#636e72" />
          <Text style={[styles.fontButtonText, { fontSize: 18 }]}>A</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.chapterHeader}>
          <Text style={styles.chapterHeading}>
            Chapter {chapter.chapter_number}
          </Text>
          <Text style={styles.chapterSubtitle}>{chapter.title}</Text>
          <Text style={styles.chapterDate}>
            {new Date(chapter.created_at).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        <Text style={[styles.content, { fontSize }]}>
          {chapter.content}
        </Text>

        {/* End Chapter Actions */}
        <View style={styles.endActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push({ 
              pathname: "/story/[id]", 
              params: { id: chapter.story_id } 
            })}
          >
            <Ionicons name="list" size={20} color="#ff4757" />
            <Text style={styles.actionButtonText}>Danh sách chương</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navButton, chapter.chapter_number === 1 && styles.navButtonDisabled]}
          onPress={handlePrevChapter}
          disabled={chapter.chapter_number === 1}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={chapter.chapter_number === 1 ? "#ccc" : "#fff"} 
          />
          <Text style={[
            styles.navButtonText,
            chapter.chapter_number === 1 && styles.navButtonTextDisabled
          ]}>
            Chương trước
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navButton}
          onPress={handleNextChapter}
        >
          <Text style={styles.navButtonText}>Chương sau</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  storyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  chapterTitle: {
    fontSize: 12,
    color: '#b2bec3',
    marginTop: 2,
  },

  // Font Control
  fontControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    gap: 20,
  },
  fontButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fontButtonText: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '600',
  },
  fontSizeText: {
    fontSize: 13,
    color: '#2d3436',
    fontWeight: '500',
  },

  // Content
  contentContainer: {
    flex: 1,
  },
  chapterHeader: {
    padding: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#ff4757',
    marginHorizontal: 15,
    marginTop: 20,
  },
  chapterHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
  },
  chapterSubtitle: {
    fontSize: 16,
    color: '#636e72',
    marginBottom: 8,
  },
  chapterDate: {
    fontSize: 12,
    color: '#b2bec3',
  },
  content: {
    padding: 20,
    lineHeight: 28,
    color: '#2d3436',
    textAlign: 'justify',
  },

  // End Actions
  endActions: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    marginHorizontal: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#ff4757',
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#ff4757',
    fontSize: 15,
    fontWeight: '600',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f2f6',
    gap: 10,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ff4757',
    borderRadius: 8,
    gap: 6,
  },
  navButtonDisabled: {
    backgroundColor: '#dfe6e9',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
});