import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);

  const MenuItem = ({ icon, title, subtitle, onPress, rightElement }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color="#ff6b6b" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || <Ionicons name="chevron-forward" size={20} color="#b2bec3" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cá nhân</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={24} color="#2d3436" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>Người dùng</Text>
          <Text style={styles.userEmail}>user@example.com</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Đang đọc</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>156</Text>
              <Text style={styles.statLabel}>Đã đọc</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>89</Text>
              <Text style={styles.statLabel}>Yêu thích</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.vipButton}>
          <Ionicons name="diamond" size={18} color="#ffd700" />
          <Text style={styles.vipText}>Nâng cấp VIP</Text>
        </TouchableOpacity>
      </View>

      {/* My Content */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nội dung của tôi</Text>
        
        <MenuItem 
          icon="book-outline"
          title="Tủ sách của tôi"
          subtitle="24 truyện"
          onPress={() => router.push('/(tabs)/library')}
        />
        <MenuItem 
          icon="heart-outline"
          title="Yêu thích"
          subtitle="89 truyện"
        />
        <MenuItem 
          icon="time-outline"
          title="Lịch sử đọc"
          subtitle="156 truyện"
        />
        <MenuItem 
          icon="download-outline"
          title="Tải về"
          subtitle="12 truyện"
        />
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        
        <MenuItem 
          icon="moon-outline"
          title="Chế độ tối"
          rightElement={
            <Switch 
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#dfe6e9', true: '#ff6b6b' }}
              thumbColor="#fff"
            />
          }
        />
        <MenuItem 
          icon="notifications-outline"
          title="Thông báo"
          rightElement={
            <Switch 
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#dfe6e9', true: '#ff6b6b' }}
              thumbColor="#fff"
            />
          }
        />
        <MenuItem 
          icon="text-outline"
          title="Cài đặt đọc"
          subtitle="Font chữ, màu nền, cỡ chữ"
        />
        <MenuItem 
          icon="language-outline"
          title="Ngôn ngữ"
          subtitle="Tiếng Việt"
        />
      </View>

      {/* Others */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Khác</Text>
        
        <MenuItem 
          icon="help-circle-outline"
          title="Trợ giúp & Phản hồi"
        />
        <MenuItem 
          icon="document-text-outline"
          title="Điều khoản sử dụng"
        />
        <MenuItem 
          icon="shield-checkmark-outline"
          title="Chính sách bảo mật"
        />
        <MenuItem 
          icon="information-circle-outline"
          title="Về chúng tôi"
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e9ecef',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
  },
  statLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e9ecef',
  },
  vipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ffe066',
  },
  vipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f59f00',
  },

  // Section
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#95a5a6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    textTransform: 'uppercase',
  },

  // Menu Item
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#95a5a6',
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e74c3c',
  },
});