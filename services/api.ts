import axios from 'axios';

// Đổi thành IP máy thật khi test trên điện thoại
// Ví dụ: 'http://192.168.1.100:8080/api'
// const API_BASE_URL = 'http://localhost:8080/api';
const API_BASE_URL = 'http://192.168.1.8:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Có thể thêm interceptor để xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi chung ở đây
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);