import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { authService } from '@/services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(''); // Thêm state cho OTP
  const [loading, setLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false); // Trạng thái đã gửi mã hay chưa
  
  const [status, setStatus] = useState({ msg: '', isError: false });

  // Bước 1: Gửi mã OTP
  const handleSendOtp = async () => {
    if (!email.includes('@')) {
      setStatus({ msg: 'Email không hợp lệ', isError: true });
      return;
    }
    if (password.length < 6) {
      setStatus({ msg: 'Mật khẩu phải từ 6 ký tự', isError: true });
      return;
    }

    try {
      setLoading(true);
      setStatus({ msg: '', isError: false });
      // Gọi API: /api/auth/register/send-otp
      await authService.sendRegistrationOtp(email.trim());
      
      setIsOtpSent(true);
      setStatus({ msg: 'Mã xác thực đã được gửi đến email của bạn!', isError: false });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể gửi mã OTP. Email có thể đã tồn tại.';
      setStatus({ msg: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận OTP và Đăng ký
  const handleFinalRegister = async () => {
    if (!otp) {
      setStatus({ msg: 'Vui lòng nhập mã OTP', isError: true });
      return;
    }

    try {
      setLoading(true);
      setStatus({ msg: '', isError: false });
      // Gọi API: /api/auth/register (truyền email, otp, password)
      await authService.register({
        email: email.trim(),
        password: password,
        otp: otp.trim()
      });

      setStatus({ msg: 'Đăng ký thành công! Đang chuyển hướng...', isError: false });
      setTimeout(() => router.replace('/auth/login'), 2000);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn';
      setStatus({ msg: errorMsg, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Tạo tài khoản', headerShown: true }} />

      <View style={styles.form}>
        {status.msg ? (
          <View style={[styles.statusBox, status.isError ? styles.errBg : styles.succBg]}>
            <Text style={[styles.statusText, { color: status.isError ? '#E53E3E' : '#38A169' }]}>
              {status.msg}
            </Text>
          </View>
        ) : null}

        {/* Input Email - Khóa khi đã gửi OTP */}
        <View style={[styles.inputWrapper, isOtpSent && { opacity: 0.6 }]}>
          <TextInput
            style={styles.input}
            placeholder="Email của bạn"
            value={email}
            onChangeText={(t) => { setEmail(t); setStatus({msg:'', isError:false}); }}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isOtpSent}
          />
        </View>

        {/* Input Password - Khóa khi đã gửi OTP */}
        <View style={[styles.inputWrapper, isOtpSent && { opacity: 0.6 }]}>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            value={password}
            onChangeText={(t) => { setPassword(t); setStatus({msg:'', isError:false}); }}
            secureTextEntry
            editable={!isOtpSent}
          />
        </View>

        {/* Hiện input OTP sau khi bấm Gửi mã */}
        {isOtpSent && (
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Nhập mã OTP gồm 6 số"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        )}

        {/* Nút bấm thay đổi theo bước */}
        {!isOtpSent ? (
          <TouchableOpacity style={styles.registerBtn} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Gửi mã xác thực</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.registerBtn, {backgroundColor: '#38A169'}]} onPress={handleFinalRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>Xác nhận Đăng ký</Text>}
          </TouchableOpacity>
        )}

        {isOtpSent && (
          <TouchableOpacity onPress={() => setIsOtpSent(false)} style={{marginTop: 15, alignItems: 'center'}}>
            <Text style={{color: '#6BB5FF'}}>Thay đổi Email</Text>
          </TouchableOpacity>
        )}

        <View style={styles.policyContainer}>
          <Text style={styles.policyText}>
            <Text>Tôi đã đọc và đồng ý với </Text>
            <Text style={styles.link}>Chính Sách Bảo Mật</Text> 
            <Text> và </Text>
            <Text style={styles.link}>Thỏa thuận người dùng</Text>
          </Text>
        </View>

        {/* THÊM NÚT QUAY LẠI ĐĂNG NHẬP */}
        <TouchableOpacity 
          onPress={() => router.push('/auth/login')}
          style={{ marginTop: 20 }}
        >
          <Text style={{ textAlign: 'center', color: '#6BB5FF', fontSize: 15 }}>
            Đã có tài khoản? <Text style={{ fontWeight: 'bold' }}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  form: { marginTop: 20 },
  statusBox: { padding: 15, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  errBg: { backgroundColor: '#FFF5F5' },
  succBg: { backgroundColor: '#F0FFF4' },
  statusText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  inputWrapper: {
    backgroundColor: '#F5F6F8',
    borderRadius: 25,
    marginBottom: 15,
    paddingHorizontal: 20,
    height: 55,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF'
  },
  input: { fontSize: 15, color: '#333' },
  registerBtn: {
    backgroundColor: '#6BB5FF',
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  policyContainer: { marginTop: 30, paddingHorizontal: 10 },
  policyText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 20 },
  link: { color: '#6BB5FF' }
});