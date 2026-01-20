import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { categoryService } from '@/services/categoryService';
import { storyService } from '@/services/storyService';
import { Category, Story } from '@/types';
import { CategoryChip } from '@/components/CategoryChip';
import { StoryCard } from '@/components/StoryCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function ExploreScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Story[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Advanced Search States
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [includeCategories, setIncludeCategories] = useState<string[]>([]);
  const [excludeCategories, setExcludeCategories] = useState<string[]>([]);
  const [minChapters, setMinChapters] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory && !isAdvancedSearch) {
      loadStoriesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0 && !isAdvancedSearch) {
        handleSimpleSearch();
      } else if (searchQuery.trim().length === 0 && !isAdvancedSearch) {
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

  const handleSimpleSearch = async () => {
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

  const handleAdvancedSearch = async () => {
    try {
      setIsSearching(true);
      setIsAdvancedSearch(true);
      
      const params: any = {
        sort: sortBy,
      };

      if (includeCategories.length > 0) {
        params.include = includeCategories;
      }
      if (excludeCategories.length > 0) {
        params.exclude = excludeCategories;
      }
      if (minChapters > 0) {
        params.minChapters = minChapters;
      }
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await storyService.advancedSearch(params);
      setSearchResults(response.data.stories || response.data);
      setShowAdvancedModal(false);
      Alert.alert('Thành công', `Tìm thấy ${response.data.stories?.length || response.data.length} truyện`);
    } catch (error) {
      console.error('Error advanced search:', error);
      Alert.alert('Lỗi', 'Không thể thực hiện tìm kiếm nâng cao');
    } finally {
      setIsSearching(false);
    }
  };

  const resetAdvancedSearch = () => {
    setIncludeCategories([]);
    setExcludeCategories([]);
    setMinChapters(0);
    setStatusFilter('all');
    setSortBy('updatedAt');
    setIsAdvancedSearch(false);
    setSearchResults([]);
  };

  const toggleCategoryInclude = (slug: string) => {
    setIncludeCategories(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      }
      return [...prev, slug];
    });
    // Remove from exclude if exists
    setExcludeCategories(prev => prev.filter(s => s !== slug));
  };

  const toggleCategoryExclude = (slug: string) => {
    setExcludeCategories(prev => {
      if (prev.includes(slug)) {
        return prev.filter(s => s !== slug);
      }
      return [...prev, slug];
    });
    // Remove from include if exists
    setIncludeCategories(prev => prev.filter(s => s !== slug));
  };

  const handleCategoryPress = (category: Category) => {
    if (isAdvancedSearch) {
      resetAdvancedSearch();
    }
    
    if (selectedCategory === category.slug) {
      setSelectedCategory(null);
      setStories([]);
    } else {
      setSelectedCategory(category.slug);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const navigateToStory = (storyId: number) => {
    router.push(`/story/${storyId}`);
  };

  const displayStories = isAdvancedSearch || searchQuery.trim().length > 0 
    ? searchResults 
    : stories;

  if (loading) {
    return <LoadingSpinner text="Đang tải..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>🔍 Khám Phá</Text>
        
        {/* Search Bar with Advanced Button */}
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: colors.borderLight }]}>
            <Text style={styles.searchIcon}>🔎</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Tìm kiếm truyện..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              editable={!isAdvancedSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={styles.clearButton}
              >
                <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.advancedButton, { 
              backgroundColor: isAdvancedSearch ? colors.primary : colors.borderLight 
            }]}
            onPress={() => setShowAdvancedModal(true)}
          >
            <Ionicons 
              name="options" 
              size={24} 
              color={isAdvancedSearch ? '#fff' : colors.text} 
            />
          </TouchableOpacity>
        </View>

        {/* Active Advanced Search Indicator */}
        {isAdvancedSearch && (
          <View style={[styles.activeSearchBanner, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.activeSearchText, { color: colors.primary }]}>
              ⚡ Tìm kiếm nâng cao đang hoạt động
            </Text>
            <TouchableOpacity onPress={resetAdvancedSearch}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Đặt lại</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Categories Section */}
        {searchQuery.trim().length === 0 && !isAdvancedSearch && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📚 Thể Loại</Text>
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
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          {isSearching ? (
            <LoadingSpinner size="small" text="Đang tìm kiếm..." />
          ) : (
            <>
              {searchQuery.trim().length > 0 && !isAdvancedSearch && (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  🔎 Kết quả cho {searchQuery} ({searchResults.length})
                </Text>
              )}
              {isAdvancedSearch && (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  ⚡ Kết quả tìm kiếm nâng cao ({searchResults.length})
                </Text>
              )}
              {selectedCategory && !isAdvancedSearch && searchQuery.trim().length === 0 && (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {searchQuery.trim().length > 0 || isAdvancedSearch
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

      {/* Advanced Search Modal */}
      <Modal
        visible={showAdvancedModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdvancedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                🔍 Tìm kiếm nâng cao
              </Text>
              <TouchableOpacity onPress={() => setShowAdvancedModal(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Include Categories */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  ✅ Bao gồm thể loại
                </Text>
                <View style={styles.categoriesGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryTag,
                        {
                          backgroundColor: includeCategories.includes(cat.slug)
                            ? colors.primary
                            : colors.borderLight,
                        },
                      ]}
                      onPress={() => toggleCategoryInclude(cat.slug)}
                    >
                      <Text
                        style={[
                          styles.categoryTagText,
                          {
                            color: includeCategories.includes(cat.slug)
                              ? '#fff'
                              : colors.text,
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Exclude Categories */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  ❌ Loại trừ thể loại
                </Text>
                <View style={styles.categoriesGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryTag,
                        {
                          backgroundColor: excludeCategories.includes(cat.slug)
                            ? '#ff4444'
                            : colors.borderLight,
                        },
                      ]}
                      onPress={() => toggleCategoryExclude(cat.slug)}
                    >
                      <Text
                        style={[
                          styles.categoryTagText,
                          {
                            color: excludeCategories.includes(cat.slug)
                              ? '#fff'
                              : colors.text,
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Min Chapters */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  📚 Số chương tối thiểu
                </Text>
                <Picker
                  selectedValue={minChapters}
                  onValueChange={(value) => setMinChapters(value)}
                  style={[styles.picker, { color: colors.text }]}
                >
                  <Picker.Item label="Tất cả" value={0} />
                  <Picker.Item label=">= 10 chương" value={10} />
                  <Picker.Item label=">= 50 chương" value={50} />
                  <Picker.Item label=">= 100 chương" value={100} />
                  <Picker.Item label=">= 200 chương" value={200} />
                </Picker>
              </View>

              {/* Status */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  📊 Tình trạng
                </Text>
                <Picker
                  selectedValue={statusFilter}
                  onValueChange={(value) => setStatusFilter(value)}
                  style={[styles.picker, { color: colors.text }]}
                >
                  <Picker.Item label="Tất cả" value="all" />
                  <Picker.Item label="Đang ra" value="Đang ra" />
                  <Picker.Item label="Hoàn thành" value="Hoàn thành" />
                </Picker>
              </View>

              {/* Sort By */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.text }]}>
                  🔄 Sắp xếp theo
                </Text>
                <Picker
                  selectedValue={sortBy}
                  onValueChange={(value) => setSortBy(value)}
                  style={[styles.picker, { color: colors.text }]}
                >
                  <Picker.Item label="Mới cập nhật" value="updatedAt" />
                  <Picker.Item label="Mới đăng" value="createdAt" />
                  <Picker.Item label="Lượt xem" value="views" />
                  <Picker.Item label="Đánh giá" value="rating" />
                </Picker>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.resetButton, { backgroundColor: colors.borderLight }]}
                onPress={resetAdvancedSearch}
              >
                <Text style={[styles.resetButtonText, { color: colors.text }]}>
                  Đặt lại
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.primary }]}
                onPress={handleAdvancedSearch}
              >
                <Text style={styles.searchButtonText}>Tìm kiếm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
  },
  advancedButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSearchBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  activeSearchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});