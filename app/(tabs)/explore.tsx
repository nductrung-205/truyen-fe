import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { categoryService } from '@/services/categoryService';
import { storyService } from '@/services/storyService';
import { Category, Story } from '@/types';
import { CategoryChip } from '@/components/CategoryChip';
import { StoryCard } from '@/components/StoryCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function ExploreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadStoriesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        handleSearch();
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getAllCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thể loại');
    } finally {
      setLoading(false);
    }
  };

  const loadStoriesByCategory = async (slug: string) => {
    try {
      const response = await storyService.getStoriesByCategory(slug);
      setStories(response.data);
    } catch (error) {
      console.error('Error loading stories by category:', error);
      Alert.alert('Lỗi', 'Không thể tải truyện theo thể loại');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length === 0) return;

    try {
      setIsSearching(true);
      const response = await storyService.searchStories(searchQuery.trim());
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching stories:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm truyện');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    if (selectedCategory === category.slug) {
      setSelectedCategory(null);
      setStories([]);
    } else {
      setSelectedCategory(category.slug);
      setSearchQuery(''); // Clear search khi chọn category
      setSearchResults([]);
    }
  };

  const navigateToStory = (storyId: number) => {
    router.push(`/story/${storyId}`);
  };

  const displayStories = searchQuery.trim().length > 0 ? searchResults : stories;

  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Khám Phá</Text>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm truyện..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Categories Section */}
        {searchQuery.trim().length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Thể Loại</Text>
            <View style={styles.categoriesContainer}>
              {categories.map((category) => (
                <CategoryChip
                  key={category.id}
                  category={category}
                  onPress={() => handleCategoryPress(category)}
                  isSelected={selectedCategory === category.slug}
                />
              ))}
            </View>
          </View>
        )}

        {/* Stories List */}
        <View style={styles.section}>
          {isSearching ? (
            <LoadingSpinner size="small" text="Đang tìm kiếm..." />
          ) : (
            <>
              {searchQuery.trim().length > 0 && (
                <Text style={styles.sectionTitle}>
                  🔎 Kết quả tìm kiếm {searchQuery} ({searchResults.length})
                </Text>
              )}
              {selectedCategory && searchQuery.trim().length === 0 && (
                <Text style={styles.sectionTitle}>
                  📖 Truyện {categories.find(c => c.slug === selectedCategory)?.name} ({stories.length})
                </Text>
              )}
              
              {displayStories.length > 0 ? (
                <View style={styles.storiesList}>
                  {displayStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onPress={() => navigateToStory(story.id)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim().length > 0
                      ? 'Không tìm thấy truyện nào'
                      : selectedCategory
                      ? 'Chưa có truyện trong thể loại này'
                      : 'Chọn thể loại để xem truyện'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  storiesList: {
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});