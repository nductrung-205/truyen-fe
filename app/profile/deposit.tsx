import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, Platform, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiClient } from '@/services/api';
import { authService } from '@/services/authService';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { UserProfile } from '@/types/auth';

const AMOUNTS = [10000, 20000, 50000, 100000, 200000, 500000];
const BANKS = [
  { id: 'VNPAYQR', name: 'VNPay QR', logo: 'https://vnpay.vn/wp-content/uploads/2020/07/Logo-VNPAYQR.png' },
  { id: 'VNBANK', name: 'Thẻ nội địa', logo: 'https://vnpay.vn/wp-content/uploads/2020/07/ATM.png' },
  { id: 'INTCARD', name: 'Thẻ quốc tế', logo: 'https://vnpay.vn/wp-content/uploads/2020/07/VisaMaster.png' },
];

export default function DepositScreen() {
  const { activeTheme } = useTheme();
  const colors = Colors[activeTheme];

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('VNPAYQR');
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);

  useEffect(() => {
    loadUserData();

    // 1. Kiểm tra kết quả nếu chạy trên WEB (Lấy từ URL thanh địa chỉ)
    if (Platform.OS === 'web') {
      checkWebPaymentResult();
    }

    // 2. Lắng nghe kết quả nếu chạy trên APP (Deep Link)
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const loadUserData = async () => {
    const userData = await authService.getStoredUser();
    if (userData) refreshCoins(userData.id);
  };

  const refreshCoins = async (userId: number) => {
    try {
      const response = await authService.getCurrentUser(userId);
      if (response.data) {
        setCurrentUser(response.data);
        await authService.saveUser(response.data);
      }
    } catch (error) { console.error(error); }
  };

  // Hàm xử lý cho WEB: Đọc params trực tiếp từ window.location
  const checkWebPaymentResult = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const result = searchParams.get('result');

    if (result) {
      // 1. Hiện thông báo ngay
      setPaymentStatus(result === 'success' ? 'success' : 'failed');
      setModalVisible(true);

      // 2. QUAN TRỌNG: Xóa sạch query params trên thanh địa chỉ ngay lập tức
      // Điều này giúp khi bạn F5 trang, URL sẽ là /profile/deposit (không còn ?result=success)
      if (window.history.replaceState) {
        const url = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: url }, '', url);
      }

      // 3. Nếu thành công thì cập nhật lại hiển thị số dư xu
      if (result === 'success') {
        loadUserData();
      }
    }
  };

  // Hàm xử lý cho APP
  const handleDeepLink = (event: { url: string }) => {
    console.log("Deep Link nhận được:", event.url);

    // Parse URL để lấy query params
    let { path, queryParams } = Linking.parse(event.url);

    // Kiểm tra nếu path là 'payment-status' (như backend mình đã setup)
    if (path === 'payment-status' || event.url.includes('payment-status')) {

      // Đóng trình duyệt ngay lập tức trên Mobile
      if (Platform.OS !== 'web') {
        WebBrowser.dismissBrowser();
      }

      const result = queryParams?.result;
      if (result) {
        setPaymentStatus(result === 'success' ? 'success' : 'failed');
        setModalVisible(true);

        if (result === 'success' && currentUser) {
          refreshCoins(currentUser.id);
        }
      }
    }
  };

  const handlePayment = async () => {
    if (!selectedAmount || !currentUser?.id) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/vnpay/create-payment`, {
        params: {
          amount: selectedAmount,
          userId: currentUser.id,
          bankCode: selectedBank,
          platform: Platform.OS === 'web' ? 'WEB' : 'APP'
        }
      });

      const paymentUrl = response.data?.url;
      if (paymentUrl) {
        if (Platform.OS === 'web') {
          // Chuyển hướng ngay trên tab hiện tại
          window.location.href = paymentUrl;
        } else {
          await WebBrowser.openBrowserAsync(paymentUrl);
        }
      }
    } catch (error) {
      setPaymentStatus('failed');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ... (Giữ nguyên phần UI: Số dư, Grid nạp tiền, Bank List) ... */}

      <Text style={[styles.title, { color: colors.text }]}>Ví Của Tôi</Text>
      <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.balanceLabel}>Số xu hiện tại</Text>
        <Text style={styles.balanceValue}>{currentUser?.coins ?? 0}</Text>
      </View>

      <Text style={[styles.subTitle, { color: colors.textTertiary }]}>1. CHỌN MỨC NẠP TIỀN</Text>
      <View style={styles.grid}>
        {AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            style={[styles.card, { backgroundColor: colors.card, borderColor: selectedAmount === amt ? colors.primary : 'transparent' }]}
            onPress={() => setSelectedAmount(amt)}
          >
            <Text style={[styles.amtText, { color: colors.text }]}>{amt.toLocaleString()}đ</Text>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>+{amt / 1000} Xu</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subTitle, { color: colors.textTertiary, marginTop: 20 }]}>2. PHƯƠNG THỨC THANH TOÁN</Text>
      <View style={styles.bankList}>
        {BANKS.map((bank) => (
          <TouchableOpacity
            key={bank.id}
            style={[styles.bankItem, { backgroundColor: colors.card, borderColor: selectedBank === bank.id ? colors.primary : 'transparent' }]}
            onPress={() => setSelectedBank(bank.id)}
          >
            <Image source={{ uri: bank.logo }} style={styles.bankLogo} resizeMode="contain" />
            <Text style={[styles.bankName, { color: colors.text }]}>{bank.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.payBtn, { backgroundColor: selectedAmount ? colors.primary : '#ccc' }]}
        onPress={handlePayment}
        disabled={loading || !selectedAmount}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>THANH TOÁN NGAY</Text>}
      </TouchableOpacity>

      {/* MODAL THÔNG BÁO KẾT QUẢ */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={{ fontSize: 60, marginBottom: 15 }}>
              {paymentStatus === 'success' ? '✅' : '❌'}
            </Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {paymentStatus === 'success' ? 'Thành công!' : 'Thất bại'}
            </Text>
            <Text style={{ textAlign: 'center', marginBottom: 20, color: colors.textTertiary }}>
              {paymentStatus === 'success'
                ? 'Giao dịch hoàn tất. Xu đã được cộng vào ví.'
                : 'Giao dịch không thành công hoặc đã bị hủy.'}
            </Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>XÁC NHẬN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  balanceCard: { padding: 25, borderRadius: 20, alignItems: 'center', marginBottom: 30 },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  balanceValue: { color: '#fff', fontSize: 38, fontWeight: '800' },
  subTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 2, alignItems: 'center' },
  amtText: { fontSize: 16, fontWeight: 'bold' },
  bankList: { gap: 10 },
  bankItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 2 },
  bankLogo: { width: 40, height: 40, marginRight: 15 },
  bankName: { flex: 1, fontWeight: '600', fontSize: 15 },
  payBtn: { marginTop: 30, paddingVertical: 18, borderRadius: 15, alignItems: 'center' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', padding: 30, borderRadius: 20, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  closeBtn: { width: '100%', padding: 15, borderRadius: 10, alignItems: 'center' }
});