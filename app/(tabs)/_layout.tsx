import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ff6b6b',
        tabBarInactiveTintColor: '#95a5a6',
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
      {/* Trang chủ */}
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

      {/* Khám phá / Thể loại */}
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

      {/* Bảng xếp hạng */}
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

      {/* Tủ sách */}
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

      {/* Cá nhân */}
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
  },
});