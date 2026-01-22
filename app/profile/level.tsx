import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '@/services/storageService';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

const CHAPTERS_PER_LEVEL = 5;

const getRankName = (level: number) => {
  if (level >= 100) return 'Độc Giả Thần Thánh';
  if (level >= 50) return 'Chí Tôn Truyện';
  if (level >= 20) return 'Đại Hiền Giả';
  if (level >= 10) return 'Bậc Thầy Đọc Truyện';
  if (level >= 2) return 'Mọt Sách Chính Hiệu';
  return 'Tân Thủ';
};

export default function LevelScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [stats, setStats] = useState({
    totalRead: 0,
    totalFavorites: 0,
    totalChapters: 0,
    level: 1,
    expProgress: 0,
    remainingExp: CHAPTERS_PER_LEVEL,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const history = await storageService.getReadingHistory();
    const favorites = await storageService.getFavorites();
    const lifetimeStats = await storageService.getLifetimeStats();
    
    const totalChapters = lifetimeStats.totalChaptersRead;
    const level = Math.floor(totalChapters / CHAPTERS_PER_LEVEL) + 1;
    const currentLevelExp = totalChapters % CHAPTERS_PER_LEVEL;
    
    setStats({
      totalRead: new Set(history.map(h => h.storyId)).size,
      totalFavorites: favorites.length,
      totalChapters,
      level,
      expProgress: currentLevelExp / CHAPTERS_PER_LEVEL,
      remainingExp: CHAPTERS_PER_LEVEL - currentLevelExp,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cấp độ của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Level Display Card */}
        <View style={[styles.levelCard, { backgroundColor: colors.primary }]}>
          <View style={styles.levelCircle}>
            <Text style={styles.levelNumber}>{stats.level}</Text>
            <Text style={styles.levelLabel}>CẤP</Text>
          </View>
          <Text style={styles.rankName}>{getRankName(stats.level)}</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>Tiến trình: {Math.floor(stats.expProgress * 100)}%</Text>
              <Text style={styles.progressText}>{stats.totalChapters % CHAPTERS_PER_LEVEL}/{CHAPTERS_PER_LEVEL}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.expProgress * 100}%` }]} />
            </View>
            <Text style={styles.remainingText}>Còn {stats.remainingExp} chương nữa để lên cấp tiếp theo</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Thống kê chi tiết</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={styles.statIcon}>📚</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalRead}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Truyện đã đọc</Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalFavorites}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yêu thích</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card, width: '100%', marginTop: 12 }]}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalChapters}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tổng số chương đã đọc</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Làm sao để lên cấp?</Text>
          <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
            • Cứ mỗi {CHAPTERS_PER_LEVEL} chương truyện bạn đọc xong, bạn sẽ được tính là 1 mốc kinh nghiệm.{"\n"}
            • Đọc càng nhiều, danh hiệu của bạn càng cao quý.{"\n"}
            • Cấp độ giúp bạn mở khóa các tính năng đặc biệt trong tương lai.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  levelCard: { borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25, elevation: 4 },
  levelCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 3, borderColor: '#FFD700', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  levelNumber: { fontSize: 32, fontWeight: '900', color: '#fff' },
  levelLabel: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  rankName: { fontSize: 20, fontWeight: '800', color: '#FFD700', textTransform: 'uppercase', marginBottom: 20 },
  progressContainer: { width: '100%' },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#fff', fontSize: 13, fontWeight: '600' },
 progressBarBg: { 
    height: 12, 
    backgroundColor: 'rgba(0,0,0,0.15)', // Làm cho nền thanh tiến trình tối hơn một chút để nổi bật phần fill
    borderRadius: 6, 
    overflow: 'hidden' 
  },
  
  progressBarFill: { 
    height: '100%', 
    backgroundColor: '#FFD700', // Đổi từ xanh lá (#4CAF50) sang Vàng Gold để nổi bật trên nền xanh
    borderRadius: 6,
    // Bạn có thể thêm shadow nhẹ nếu muốn
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  remainingText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 10, textAlign: 'center', fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 15, marginLeft: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statBox: { width: '48%', padding: 20, borderRadius: 15, alignItems: 'center', elevation: 2 },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  infoBox: { marginTop: 25, padding: 20, borderRadius: 15 },
  infoTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoDesc: { fontSize: 14, lineHeight: 22 }
});