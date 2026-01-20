import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { authService } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Bước 1: Gửi OTP qua Email
  const handleSendOtp = async () => {
    setMessage({ type: '', text: '' });

    if (!email.trim() || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đúng định dạng email' });
      return;
    }

    try {
      setLoading(true);
      // Gọi API: /api/auth/forgot-password/send-otp
      await authService.sendForgotPasswordOtp(email.trim());
      
      setStep(2);
      setCountdown(600); // 10 phút
      setMessage({ 
        type: 'success', 
        text: `Mã xác thực đã được gửi đến email của bạn.` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Email này chưa được đăng ký trong hệ thống' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực OTP và Đổi mật khẩu
  const handleVerifyAndReset = async () => {
    setMessage({ type: '', text: '' });

    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    if (otp.length !== 6) {
      setMessage({ type: 'error', text: 'Mã OTP phải gồm 6 chữ số' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    try {
      setLoading(true);
      // Gọi API: /api/auth/forgot-password/reset
      await authService.resetPassword({ 
        email: email.trim(), 
        otp: otp.trim(), 
        newPassword 
      });
      
      setShowSuccessModal(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // UI Components con (MessageBox, SuccessModal...) giữ nguyên logic của bạn nhưng bọc Text kỹ hơn
  const MessageBox = () => {
    if (!message.text) return null;
    const isError = message.type === 'error';
    return (
      <View style={[styles.messageBox, { backgroundColor: isError ? '#fee2e2' : '#dcfce7', borderColor: isError ? '#ef4444' : '#22c55e' }]}>
        <Text style={[styles.messageText, { color: isError ? '#991b1b' : '#166534' }]}>
          {isError ? '❌ ' : '✅ '}{message.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Quên mật khẩu', headerShown: true }} />

      
      <View style={styles.content}>
        

        <Text style={styles.icon}>🔑</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 1
            ? 'Nhập email đã đăng ký để nhận mã khôi phục'
            : `Mã xác thực đã được gửi đến ${email}`}
        </Text>

        <MessageBox />
        
        {/* Step 1: Nhập Email */}
        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email của bạn</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="example@email.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi mã xác thực</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          /* Step 2: Nhập OTP & Pass mới */
          <View style={styles.form}>
            {countdown > 0 && (
              <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.timerText, { color: colors.text }]}>
                  ⏱️ Mã hết hạn sau: {formatTime(countdown)}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Mã xác thực (6 số)</Text>
              <TextInput
                style={[styles.input, styles.otpInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Mật khẩu mới</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, width: '100%' }]}
                  placeholder="Tối thiểu 6 ký tự"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                  <Text>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Xác nhận mật khẩu</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleVerifyAndReset}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đổi mật khẩu</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendOtp}
              disabled={countdown > 540} // Chỉ cho gửi lại sau 1 phút
            >
              <Text style={{ color: countdown > 540 ? colors.textTertiary : colors.primary }}>
                {countdown > 540 ? `Gửi lại sau ${formatTime(countdown - 540)}` : 'Gửi lại mã OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Success Modal */}
      {showSuccessModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={styles.modalIcon}>🎉</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Thành công!</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>Mật khẩu đã được thay đổi.</Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, width: '100%' }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/auth/login');
              }}
            >
              <Text style={styles.buttonText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  icon: { fontSize: 60, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  messageBox: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 15 },
  messageText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },
  form: { gap: 15 },
  inputContainer: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
  input: { height: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 16 },
  otpInput: { textAlign: 'center', fontSize: 22, fontWeight: 'bold', letterSpacing: 5 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center' },
  eyeButton: { position: 'absolute', right: 15 },
  button: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  timerContainer: { padding: 10, borderRadius: 10, alignItems: 'center' },
  timerText: { fontSize: 13, fontWeight: '600' },
  resendButton: { alignItems: 'center', marginTop: 10 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalContent: { width: '80%', padding: 25, borderRadius: 20, alignItems: 'center' },
  modalIcon: { fontSize: 50, marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalMessage: { textAlign: 'center', marginBottom: 20 }
});