import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

/**
 * TabLayout: Cấu hình thanh điều hướng phía dưới (Bottom Tab Bar)
 * 
 * Chiến lược: 
 * - Không thực hiện redirect (chuyển hướng) bắt buộc ở đây.
 * - Cho phép người dùng truy cập tự do vào các tab public (Trang chủ, Khám phá, BXH).
 * - Các tab yêu cầu cá nhân hóa (Tủ sách, Tôi) sẽ tự kiểm tra trạng thái login 
 *   bằng logic có sẵn trong file của màn hình đó.
 */

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff6b6b', // Màu đỏ san hô khi được chọn
        tabBarInactiveTintColor: '#95a5a6', // Màu xám khi không chọn
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f2f6',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* 1. Trang chủ - Công khai */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons 
                name={focused ? 'home' : 'home-outline'} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      {/* 2. Khám phá / Thể loại - Công khai */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons 
                name={focused ? 'compass' : 'compass-outline'} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      {/* 3. Bảng xếp hạng - Công khai */}
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'BXH',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons 
                name={focused ? 'trophy' : 'trophy-outline'} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      {/* 4. Tủ sách - Yêu cầu login (Kiểm tra trong library.tsx) */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Tủ sách',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons 
                name={focused ? 'library' : 'library-outline'} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />

      {/* 5. Cá nhân - Yêu cầu login (Kiểm tra trong profile.tsx) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tôi',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && styles.activeIconContainer}>
              <Ionicons 
                name={focused ? 'person' : 'person-outline'} 
                size={24} 
                color={color} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: '#ffe3e3',
    borderRadius: 12,
    padding: 8,
    // Căn giữa icon trong container màu hồng nhạt
    justifyContent: 'center',
    alignItems: 'center',
  },
});