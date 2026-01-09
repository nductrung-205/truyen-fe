import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock data
const rankings = [
    {
        id: 1,
        title: 'Tái Sinh Thành Hoàng Tử Quốc Gia Kẻ Thù',
        thumbnail_url: 'https://via.placeholder.com/150',
        views: 2000000,
        chapters: 92,
        genre: 'Tiên Hiệp',
        rating: 4.8,
    },
    {
        id: 2,
        title: 'Bế Út Che Giấu Vô Số Bí Mật',
        thumbnail_url: 'https://via.placeholder.com/150',
        views: 1190000,
        chapters: 12,
        genre: 'Huyền Huyễn',
        rating: 4.9,
    },
    {
        id: 3,
        title: 'Linh Cảnh Hành Giả',
        thumbnail_url: 'https://via.placeholder.com/150',
        views: 284000,
        chapters: 156,
        genre: 'Khoa Huyễn',
        rating: 4.7,
    },
    {
        id: 4,
        title: 'Kiếm Đạo Độc Tôn',
        thumbnail_url: 'https://via.placeholder.com/150',
        views: 850000,
        chapters: 234,
        genre: 'Kiếm Hiệp',
        rating: 4.6,
    },
    {
        id: 5,
        title: 'Hệ Thống Tu Tiên',
        thumbnail_url: 'https://via.placeholder.com/150',
        views: 720000,
        chapters: 189,
        genre: 'Tu Tiên',
        rating: 4.5,
    },
];

export default function RankingScreen() {
    const router = useRouter();
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

    const getMedalColor = (rank: number) => {
        if (rank === 1) return '#ffd700';
        if (rank === 2) return '#c0c0c0';
        if (rank === 3) return '#cd7f32';
        return '#95a5a6';
    };

    const getMedalIcon = (rank: number) => {
        if (rank <= 3) return 'medal';
        return 'ellipse';
    };

    const formatViews = (views: number) => {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(0) + 'K';
        return views.toString();
    };

    const RankingItem = ({ item, index }: { item: any; index: number }) => {
        const rank = index + 1;
        const isTopThree = rank <= 3;

        return (
            <TouchableOpacity
                style={[styles.rankingItem, isTopThree && styles.topThreeItem]}
                onPress={() => router.push({ pathname: "/story/[id]", params: { id: item.id } })}
            >
                {/* Rank Badge */}
                <View style={[styles.rankBadge, isTopThree && styles.rankBadgeTop]}>
                    {isTopThree ? (
                        <Ionicons
                            name={getMedalIcon(rank)}
                            size={24}
                            color={getMedalColor(rank)}
                        />
                    ) : (
                        <Text style={styles.rankNumber}>{rank}</Text>
                    )}
                </View>

                {/* Thumbnail */}
                <Image
                    source={{ uri: item.thumbnail_url }}
                    style={styles.thumbnail}
                />

                {/* Info */}
                <View style={styles.storyInfo}>
                    <Text style={styles.storyTitle} numberOfLines={2}>
                        {item.title}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={styles.genreBadge}>
                            <Text style={styles.genreText}>{item.genre}</Text>
                        </View>
                        <View style={styles.ratingBox}>
                            <Ionicons name="star" size={12} color="#f39c12" />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Ionicons name="eye" size={14} color="#95a5a6" />
                            <Text style={styles.statText}>{formatViews(item.views)}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Ionicons name="book" size={14} color="#95a5a6" />
                            <Text style={styles.statText}>{item.chapters} chương</Text>
                        </View>
                    </View>
                </View>

                {/* Arrow */}
                <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bảng xếp hạng</Text>
                <TouchableOpacity>
                    <Ionicons name="search" size={24} color="#2d3436" />
                </TouchableOpacity>
            </View>

            {/* Period Tabs */}
            <View style={styles.periodTabs}>
                <TouchableOpacity
                    style={[styles.periodTab, selectedPeriod === 'day' && styles.periodTabActive]}
                    onPress={() => setSelectedPeriod('day')}
                >
                    <Text style={[styles.periodText, selectedPeriod === 'day' && styles.periodTextActive]}>
                        Hôm nay
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.periodTab, selectedPeriod === 'week' && styles.periodTabActive]}
                    onPress={() => setSelectedPeriod('week')}
                >
                    <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                        Tuần này
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.periodTab, selectedPeriod === 'month' && styles.periodTabActive]}
                    onPress={() => setSelectedPeriod('month')}
                >
                    <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                        Tháng này
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Top 3 Podium */}
            <View style={styles.podium}>
                {/* 2nd Place */}
                <View style={styles.podiumItem}>
                    <TouchableOpacity
                        style={styles.podiumImageContainer}
                        onPress={() => router.push({ pathname: "/story/[id]", params: { id: rankings[1].id } })}
                    >
                        <Image
                            source={{ uri: rankings[1].thumbnail_url }}
                            style={styles.podiumImage}
                        />
                        <View style={[styles.podiumBadge, { backgroundColor: '#c0c0c0' }]}>
                            <Text style={styles.podiumBadgeText}>2</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.podiumTitle} numberOfLines={2}>
                        {rankings[1].title}
                    </Text>
                    <Text style={styles.podiumViews}>
                        {formatViews(rankings[1].views)} lượt xem
                    </Text>
                </View>

                {/* 1st Place */}
                <View style={[styles.podiumItem, styles.podiumFirst]}>
                    <TouchableOpacity
                        style={styles.podiumImageContainer}
                        onPress={() => router.push({ pathname: "/story/[id]", params: { id: rankings[0].id } })}
                    >
                        <Ionicons
                            name="trophy"
                            size={32}
                            color="#ffd700"
                            style={styles.crownIcon}
                        />
                        <Image
                            source={{ uri: rankings[0].thumbnail_url }}
                            style={[styles.podiumImage, styles.podiumImageFirst]}
                        />
                        <View style={[styles.podiumBadge, { backgroundColor: '#ffd700' }]}>
                            <Text style={styles.podiumBadgeText}>1</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.podiumTitle} numberOfLines={2}>
                        {rankings[0].title}
                    </Text>
                    <Text style={styles.podiumViews}>
                        {formatViews(rankings[0].views)} lượt xem
                    </Text>
                </View>

                {/* 3rd Place */}
                <View style={styles.podiumItem}>
                    <TouchableOpacity
                        style={styles.podiumImageContainer}
                        onPress={() => router.push({ pathname: "/story/[id]", params: { id: rankings[2].id } })}
                    >
                        <Image
                            source={{ uri: rankings[2].thumbnail_url }}
                            style={styles.podiumImage}
                        />
                        <View style={[styles.podiumBadge, { backgroundColor: '#cd7f32' }]}>
                            <Text style={styles.podiumBadgeText}>3</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.podiumTitle} numberOfLines={2}>
                        {rankings[2].title}
                    </Text>
                    <Text style={styles.podiumViews}>
                        {formatViews(rankings[2].views)} lượt xem
                    </Text>
                </View>
            </View>

            {/* Ranking List */}
            <FlatList
                data={rankings.slice(3)}
                renderItem={({ item, index }) => <RankingItem item={item} index={index + 3} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
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

    // Period Tabs
    periodTabs: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        gap: 10,
        marginBottom: 20,
    },
    periodTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    periodTabActive: {
        backgroundColor: '#ff6b6b',
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#636e72',
    },
    periodTextActive: {
        color: '#fff',
    },

    // Podium
    podium: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        paddingVertical: 20,
        backgroundColor: '#f8f9fa',
        alignItems: 'flex-end',
        gap: 10,
    },
    podiumItem: {
        flex: 1,
        alignItems: 'center',
    },
    podiumFirst: {
        marginBottom: 20,
    },
    podiumImageContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    crownIcon: {
        position: 'absolute',
        top: -35,
        left: '50%',
        marginLeft: -16,
        zIndex: 1,
    },
    podiumImage: {
        width: 80,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#e9ecef',
        borderWidth: 2,
        borderColor: '#fff',
    },
    podiumImageFirst: {
        width: 90,
        height: 110,
    },
    podiumBadge: {
        position: 'absolute',
        bottom: -8,
        left: '50%',
        marginLeft: -16,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    podiumBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    podiumTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2d3436',
        textAlign: 'center',
        marginBottom: 4,
    },
    podiumViews: {
        fontSize: 10,
        color: '#95a5a6',
    },

    // Ranking List
    listContent: {
        paddingTop: 10,
    },
    rankingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f2f6',
    },
    topThreeItem: {
        backgroundColor: '#fffbf5',
    },
    rankBadge: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankBadgeTop: {
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#636e72',
    },
    thumbnail: {
        width: 60,
        height: 80,
        borderRadius: 6,
        backgroundColor: '#e9ecef',
        marginRight: 12,
    },
    storyInfo: {
        flex: 1,
    },
    storyTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    genreBadge: {
        backgroundColor: '#fff5f5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    genreText: {
        fontSize: 11,
        color: '#ff6b6b',
        fontWeight: '600',
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2d3436',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#95a5a6',
    },
});