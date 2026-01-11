import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string, onPress?: () => void) => {
    if (Platform.OS === 'web') {
      // Trên Web dùng alert mặc định của trình duyệt
      alert(`${title}: ${message}`);
      if (onPress) onPress();
    } else {
      // Trên điện thoại dùng Alert của React Native
      Alert.alert(title, message, onPress ? [{ text: 'OK', onPress }] : []);
    }
  };

  const handleRegister = async () => {
    console.log(">>> Bắt đầu Validation...");

    // 1. Kiểm tra trống
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      console.log("Lỗi: Thiếu thông tin", { username, email });
      showAlert('Lỗi', 'Vui lòng nhập đầy đủ thông tin (Đặc biệt là Email)');
      return;
    }

    // 2. Kiểm tra độ dài username
    if (username.trim().length < 3) {
      showAlert('Lỗi', 'Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }

    // 3. Kiểm tra định dạng Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert('Lỗi', 'Email không hợp lệ');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      setLoading(true);
      console.log(">>> Đang gửi request lên Server...");
      const response = await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      showAlert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', () => {
        router.back();
      });
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMsg = error.response?.data || 'Có lỗi xảy ra. Vui lòng thử lại.';
      showAlert('Đăng ký thất bại', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹ Quay lại</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>📚</Text>
            <Text style={styles.logoText}>Tạo Tài Khoản</Text>
            <Text style={styles.subtitle}>Đăng ký để bắt đầu đọc truyện</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tên đăng nhập *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 3 ký tự"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mật khẩu *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Xác nhận mật khẩu *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Bằng việc đăng ký, bạn đã đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text> của
                chúng tôi
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  termsContainer: {
    marginTop: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});