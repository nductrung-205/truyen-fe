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
import { useRouter } from 'expo-router';
import { authService } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
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

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSendOtp = async () => {
    setMessage({ type: '', text: '' });

    if (!username.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ username và email' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Email không hợp lệ' });
      return;
    }

    try {
      setLoading(true);
      await authService.sendOtp(username, email);
      setStep(2);
      setCountdown(600);
      setMessage({ 
        type: 'success', 
        text: `Mã OTP đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư.` 
      });
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Username không tồn tại trong hệ thống' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    setMessage({ type: '', text: '' });

    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin' });
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setMessage({ type: 'error', text: 'Mã OTP phải là 6 chữ số' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOtpAndResetPassword(username, otp, newPassword);
      
      // Hiển thị modal thành công
      setShowSuccessModal(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn';
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

  const MessageBox = () => {
    if (!message.text) return null;

    const messageStyles = {
      error: { 
        backgroundColor: '#fee2e2', 
        borderColor: '#ef4444', 
        textColor: '#991b1b' 
      },
      success: { 
        backgroundColor: '#dcfce7', 
        borderColor: '#22c55e', 
        textColor: '#166534' 
      },
      info: { 
        backgroundColor: '#dbeafe', 
        borderColor: '#3b82f6', 
        textColor: '#1e40af' 
      },
    };

    const style = messageStyles[message.type as keyof typeof messageStyles] || messageStyles.info;

    return (
      <View style={[
        styles.messageBox,
        { 
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
        }
      ]}>
        <Text style={[styles.messageText, { color: style.textColor }]}>
          {message.type === 'error' && '❌ '}
          {message.type === 'success' && '✅ '}
          {message.type === 'info' && 'ℹ️ '}
          {message.text}
        </Text>
      </View>
    );
  };

  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={styles.modalIcon}>🎉</Text>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Thành công!
          </Text>
          <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
            Mật khẩu của bạn đã được đặt lại thành công!
          </Text>
          <Text style={[styles.modalQuestion, { color: colors.text }]}>
            Bạn có muốn đăng nhập ngay không?
          </Text>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: colors.border }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/(tabs)');
              }}
            >
              <Text style={[styles.modalButtonTextSecondary, { color: colors.text }]}>
                Về trang chủ
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/auth/login');
              }}
            >
              <Text style={styles.modalButtonTextPrimary}>
                Đăng nhập ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 1) {
              router.back();
            } else {
              setStep(1);
              setMessage({ type: '', text: '' });
              setOtp('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Quay lại
          </Text>
        </TouchableOpacity>

        <Text style={styles.icon}>🔑</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === 1 ? 'Quên mật khẩu?' : 'Nhập mã OTP'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {step === 1
            ? 'Nhập username và email để nhận mã xác thực'
            : `Mã OTP đã được gửi đến ${email}`}
        </Text>

        <MessageBox />
        <SuccessModal />

        {step === 1 ? (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Username</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Nhập username của bạn"
                placeholderTextColor={colors.textTertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email nhận OTP</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="example@email.com"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Gửi mã OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            {countdown > 0 && (
              <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
                <Text style={[styles.timerText, { color: colors.text }]}>
                  ⏱️ Mã hết hạn sau: {formatTime(countdown)}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Mã OTP (6 số)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.otpInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="123456"
                placeholderTextColor={colors.textTertiary}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Mật khẩu mới</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor={colors.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Xác nhận mật khẩu</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.textTertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleVerifyAndReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleSendOtp}
              disabled={countdown > 540}
            >
              <Text style={[
                styles.resendText, 
                { color: countdown > 540 ? colors.textTertiary : colors.primary }
              ]}>
                {countdown > 540 
                  ? `Gửi lại sau ${formatTime(countdown - 540)}`
                  : 'Gửi lại mã OTP'
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 24, zIndex: 1 },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  icon: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22, paddingHorizontal: 20 },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: { gap: 16 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  otpInput: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', letterSpacing: 8 },
  passwordContainer: { position: 'relative' },
  eyeButton: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  eyeIcon: { fontSize: 20 },
  button: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  timerContainer: { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  timerText: { fontSize: 14, fontWeight: '600' },
  resendButton: { alignItems: 'center', paddingVertical: 12 },
  resendText: { fontSize: 14, fontWeight: '600' },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  modalQuestion: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {},
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});