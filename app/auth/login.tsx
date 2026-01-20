import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // State để lưu thông báo
  const [msg, setMsg] = useState({ text: '', type: '' }); // type: 'error' hoặc 'success'

  const handleLogin = async () => {
    // Reset thông báo mỗi lần bấm
    setMsg({ text: '', type: '' });

    if (!email.trim() || !password.trim()) {
      setMsg({ text: 'Vui lòng nhập đầy đủ email và mật khẩu', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await authService.login({ email: email.trim(), password });

      setMsg({ text: 'Đăng nhập thành công! Đang chuyển hướng...', type: 'success' });

      // Chuyển màn hình sau 1.5 giây để user kịp nhìn thấy thông báo thành công
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);

    } catch (error: any) {
      const errorText = error.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      setMsg({ text: errorText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Đăng nhập', headerShown: true }} />


      <View style={styles.form}>
        {/* HIỂN THỊ THÔNG BÁO TRÊN UI */}
        {msg.text ? (
          <View style={[styles.msgBox, msg.type === 'error' ? styles.errorBox : styles.successBox]}>
            <Text style={msg.type === 'error' ? styles.errorText : styles.successText}>
              {msg.type === 'error' ? '⚠️ ' : '✅ '} {msg.text}
            </Text>
          </View>
        ) : null}

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Vui lòng nhập email của bạn"
            value={email}
            onChangeText={(txt) => { setEmail(txt); setMsg({ text: '', type: '' }); }} // Xóa báo lỗi khi user gõ lại
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Vui lòng nhập mật khẩu"
            value={password}
            onChangeText={(txt) => { setPassword(txt); setMsg({ text: '', type: '' }); }}
            secureTextEntry
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
          <Text style={styles.forgotText}>Quên mật khẩu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Đăng nhập</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/auth/register')}>
          <Text style={styles.registerLink}>Chưa có tài khoản? Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  headerCard: { marginTop: 20, marginBottom: 10 },
  form: { marginTop: 10 },
  // Style cho hộp thông báo
  msgBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  errorBox: { backgroundColor: '#FFF2F2', borderColor: '#FFBABA' },
  successBox: { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5' },
  errorText: { color: '#D8000C', fontSize: 14, fontWeight: '500' },
  successText: { color: '#2F855A', fontSize: 14, fontWeight: '500' },

  inputWrapper: {
    backgroundColor: '#F5F6F8',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    height: 50,
    justifyContent: 'center'
  },
  input: { fontSize: 15 },
  forgotText: { textAlign: 'right', color: '#6BB5FF', marginBottom: 30 },
  loginBtn: {
    backgroundColor: '#6BB5FF',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  registerLink: { textAlign: 'center', color: '#6BB5FF', marginTop: 20, fontSize: 16 },
});