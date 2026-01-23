# 📚 Truyện Hay - Web Novel Reading App

Một ứng dụng di động xây dựng bằng **Expo/React Native** cho phép người dùng khám phá, đọc và tương tác với các bộ truyện tranh/tiểu thuyết. Ứng dụng tích hợp AI chatbot để hỗ trợ người dùng tìm kiếm và gợi ý truyện.

## 🎯 Tính Năng Chính

### 📖 Quản Lý Truyện
- **Duyệt truyện** theo nhiều tab: Top Ngày, Top Tuần, Top Tháng, Yêu Thích, Mới Cập Nhật, Truyện Mới, Truyện Full, Truyện Ngẫu Nhiên
- **Tìm kiếm nâng cao** truyện theo từ khóa, thể loại, trạng thái, số chương
- **Xem chi tiết truyện**: Mô tả, tác giả, số chương, rating, trạng thái
- **Phân trang** tự động tải thêm khi cuộn xuống
- **Lưu vào yêu thích** và **đánh giá truyện** với sao 5 chiều

### 🔖 Đọc Truyện
- **Xem nội dung chapter** với hỗ trợ các chapter khóa (yêu cầu mở khóa bằng xu)
- **Điều hướng chapter**: Nút Chương Trước/Chương Tiếp Theo
- **Lịch sử đọc**: Tự động lưu vị trí cuối cùng đọc (localStorage)
- **Mở khóa chapter**: Thanh toán bằng xu trong ứng dụng

### 👤 Xác Thực & Tài Khoản
- **Đăng ký**: OTP xác minh email
- **Đăng nhập**: Email + mật khẩu
- **Quên mật khẩu**: Lấy lại qua OTP
- **Hồ sơ người dùng**: Avatar, cấp độ (level), kinh nghiệm (EXP), xu (coins)
- **Check-in hàng ngày**: Nhận thưởng xu

### 🤖 AI Chatbot (Google Gemini)
- **Gợi ý truyện thông minh** dựa trên hành vi người dùng
- **Tìm kiếm truyện** qua câu hỏi tự nhiên
- **Xem danh sách thể loại** qua chatbot
- **Lưu lịch sử hội thoại** trong session
- **Gợi ý nhanh** (quick suggestions)

### 💰 Nạp Tiền & Xu
- **Gói nạp** với các mức giá khác nhau
- **Thưởng bổ sung** khi nạp
- **Xác nhận giao dịch**

### ⭐ Tính Năng Bổ Sung
- **Bảng xếp hạng** người dùng
- **Dark Mode / Light Mode** tuỳ chọn
- **Thông báo push** (Expo Notifications)
- **Đánh giá & bình luận** truyện
- **Danh sách thể loại** để khám phá truyện

---

## 🛠️ Tech Stack

### Frontend
- **React Native 0.81.5** - Framework chính
- **Expo 54.0.30** - Nền tảng phát triển
- **Expo Router 6.0.21** - File-based routing
- **TypeScript 5.9.2** - Type safety
- **React Navigation** - Navigation library
- **React 19.1.0** - Component library

### Backend Integration
- **Axios 1.13.2** - HTTP client
- **AsyncStorage** - Local persistent storage

### AI & Chatbot
- **Google Generative AI (Gemini 2.5 Flash)** - AI model

### Styling & UI
- **React Native Reanimated** - Animations
- **React Native Gesture Handler** - Gestures
- **Expo Vector Icons** - Icon library
- **Expo Haptics** - Haptic feedback

### Database & State
- **AsyncStorage** - User authentication, reading history
- **ThemeContext** - Global theme management

---

## 📁 Cấu Trúc Dự Án

```
my-app/
├── app/                      # Expo Router screens (file-based routing)
│   ├── (tabs)/              # Tab navigation
│   │   ├── index.tsx        # Home - Danh sách truyện hot
│   │   ├── explore.tsx      # Khám phá theo thể loại
│   │   ├── library.tsx      # Tủ sách cá nhân
│   │   ├── ranking.tsx      # Bảng xếp hạng
│   │   └── profile.tsx      # Hồ sơ người dùng
│   ├── auth/                # Xác thực
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── story/[id].tsx       # Chi tiết truyện
│   ├── chapter/[id].tsx     # Danh sách chapter
│   ├── chapter/[storyId]/[chapterNumber].tsx  # Nội dung chapter
│   ├── reader/[id].tsx      # Chế độ đọc
│   ├── profile/             # Quản lý hồ sơ
│   │   ├── check-in.tsx
│   │   ├── deposit.tsx
│   │   ├── level.tsx
│   │   ├── my-reviews.tsx
│   ├── modal.tsx            # Modal overlay
│   └── _layout.tsx          # Root layout
├── components/              # Reusable UI components
│   ├── StoryCard.tsx        # Card hiển thị truyện
│   ├── ChapterItem.tsx      # Item danh sách chapter
│   ├── Chatbot.tsx          # AI chatbot UI
│   ├── CategoryChip.tsx     # Category chip
│   ├── LoadingSpinner.tsx   # Loading indicator
│   ├── SectionHeader.tsx    # Section title
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui/                  # Base UI components
│       └── collapsible.tsx
├── services/                # API services
│   ├── api.ts              # Axios client + interceptors
│   ├── authService.ts      # Authentication API
│   ├── storyService.ts     # Story/search API
│   ├── chapterService.ts   # Chapter content API
│   ├── chatbotService.ts   # Gemini AI API
│   ├── categoryService.ts  # Category API
│   ├── reviewService.ts    # Review/rating API
│   ├── depositService.ts   # Payment API
│   ├── notificationService.ts  # Push notifications
│   ├── storageService.ts   # LocalStorage (reading history)
│   ├── authorService.ts    # Author info API
│   └── checkInService.ts   # Daily check-in rewards
├── types/                   # TypeScript interfaces
│   ├── story.ts            # Story, StoryDetail, Chapter
│   ├── chapter.ts          # ChapterDetail, ChapterSummary
│   ├── auth.ts             # LoginRequest, UserProfile
│   ├── category.ts         # Category interface
│   ├── author.ts           # Author interface
│   ├── review.ts           # Review interface
│   └── index.ts            # Exports all types
├── contexts/                # React Context (state management)
│   └── ThemeContext.tsx    # Dark mode / Light mode
├── hooks/                   # Custom React hooks
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
├── constants/               # Constants
│   ├── Colors.ts           # Theme colors
│   └── theme.ts            # Theme configuration
├── assets/                  # Static assets
│   └── images/             # App icons, splash screens
├── scripts/                 # Utility scripts
│   └── reset-project.js
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # Documentation
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### Yêu Cầu
- **Node.js** >= 16
- **npm** hoặc **yarn**
- **Expo CLI**: `npm install -g expo-cli`

### 1. Cài Đặt Dependencies

```bash
npm install
```

### 2. Cấu Hình API & Gemini Key

Sửa file `app.json`:
```json
{
  "expo": {
    "extra": {
      "geminiApiKey": "YOUR_GEMINI_API_KEY_HERE"
    }
  }
}
```

Sửa file `services/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_BACKEND_URL/api';
```

### 3. Chạy Ứng Dụng

**Chế độ Development:**
```bash
npm start
```

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Web:**
```bash
npm run web
```

### 4. Lint & Format

```bash
npm run lint
```

---

## 📡 API Endpoints

Ứng dụng kết nối với backend API (Spring Boot) tại `http://10.18.12.125:8080/api`

### Xác Thực (Auth)
```
POST   /auth/login                          - Đăng nhập
POST   /auth/register                       - Đăng ký
POST   /auth/register/send-otp              - Gửi OTP đăng ký
POST   /auth/forgot-password/send-otp       - Gửi OTP lấy lại mật khẩu
POST   /auth/forgot-password/reset          - Đặt lại mật khẩu
GET    /auth/otp-remaining-time             - Kiểm tra thời gian OTP
POST   /users/check-in/{userId}             - Check-in hàng ngày
GET    /users/{userId}                      - Lấy thông tin người dùng
```

### Truyện (Stories)
```
GET    /stories                             - Danh sách truyện (phân trang)
GET    /stories/hot                         - Truyện hot
GET    /stories/{id}                        - Chi tiết truyện
GET    /stories/top?period=day|week|month   - Top truyện theo thời gian
GET    /stories/search?keyword=...          - Tìm kiếm
GET    /stories/category/{slug}             - Lọc theo thể loại
GET    /stories/advanced-search             - Tìm kiếm nâng cao
```

### Chương (Chapters)
```
GET    /stories/{storyId}/chapters          - Danh sách chapter
GET    /stories/{storyId}/chapters/{chapterNumber}  - Nội dung chapter
POST   /stories/{storyId}/chapters/{chapterId}/unlock  - Mở khóa chapter
```

### Thể Loại (Categories)
```
GET    /categories                          - Danh sách thể loại
GET    /categories/{id}                     - Chi tiết thể loại
```

### Đánh Giá (Reviews)
```
GET    /reviews/{storyId}                   - Danh sách đánh giá
POST   /reviews/{storyId}                   - Gửi đánh giá mới
GET    /reviews/user/{username}             - Đánh giá của người dùng
```

### Thanh Toán (Deposits)
```
POST   /deposit/create                      - Tạo đơn nạp tiền
POST   /deposit/confirm/{transactionId}     - Xác nhận thanh toán
```

---

## 🔑 Biến Môi Trường

```env
# app.json > extra
EXPO_PUBLIC_GEMINI_API_KEY=sk-abc123...    # Google Gemini API Key
```

---

## 🎨 Giao Diện & Themes

### Colors (constants/Colors.ts)
- **Light Theme**: Nền trắng, text tối
- **Dark Theme**: Nền tối, text sáng
- **Primary**: #ff6b6b (coral red)
- **Secondary**: #3b82f6 (blue)

Chuyển theme qua **ThemeContext**:
```typescript
const { isDarkMode, activeTheme, toggleTheme } = useTheme();
```

---

## 🔐 Xác Thực & Authorization

### Phương Pháp
- **Username-based**: Gửi username qua header `X-User` thay vì token
- **Local Storage**: Lưu user info vào AsyncStorage sau khi login
- **Check-in**: Xác minh người dùng đã đăng nhập

### Flow
1. User nhập email + password
2. Server trả về `AuthResponse` (id, username, email, coins, exp, ...)
3. Client lưu vào AsyncStorage
4. Gửi request tiếp theo: header sẽ tự động thêm `X-User: username`

---

## 💾 Local Storage

Sử dụng **AsyncStorage** để lưu:
- `@user` - Thông tin người dùng hiện tại
- `@readingHistory` - Lịch sử đọc (chapter cuối cùng đọc của mỗi truyện)
- `@favorites` - Danh sách truyện yêu thích

---

## 🤖 AI Chatbot Integration

### Gemini API Setup
- **Model**: `gemini-2.5-flash`
- **Features**:
  - Tìm kiếm truyện qua câu hỏi tự nhiên
  - Gợi ý dựa trên dữ liệu thực tế (hot stories, categories)
  - Lịch sử hội thoại multi-turn
  - Quick suggestions

### Cách Dùng
```typescript
const chatbotService = new ChatbotService();
const reply = await chatbotService.chat("Tìm truyện fantasy");
```

---

## ⚙️ Cấu Hình & Tuỳ Chỉnh

### Thay Đổi API URL
File: `services/api.ts`
```typescript
const API_BASE_URL = 'http://your-backend-url:8080/api';
```

### Thay Đổi Items Per Page
File: `app/(tabs)/index.tsx`
```typescript
const ITEMS_PER_PAGE = 10; // Sửa thành số mong muốn
```

### Thêm Danh Mục Tab Mới
File: `app/(tabs)/_layout.tsx`
- Thêm route mới
- Định nghĩa tab icon

---

## 📊 Performance & Optimization

- ✅ **Lazy Loading**: Danh sách truyện tải thêm khi cuộn
- ✅ **Image Optimization**: Expo Image với caching
- ✅ **Reanimated**: Smooth animations
- ✅ **Memoization**: React.memo cho components lớn
- ✅ **Async Storage**: Non-blocking data persistence

---

## 🐛 Troubleshooting

### Lỗi Kết Nối API
- Kiểm tra URL backend trong `services/api.ts`
- Đảm bảo backend đang chạy
- Kiểm tra firewall/network settings

### Lỗi Gemini API
- Kiểm tra API key trong `app.json`
- Đảm bảo quota Gemini chưa hết
- Kiểm tra internet connection

### Lỗi AsyncStorage
- Clear app cache: `npm run reset-project`
- Xóa app data trên device/emulator

---

## 📝 Script Commands

```bash
npm start          # Start dev server
npm run android    # Launch Android emulator
npm run ios        # Launch iOS simulator
npm run web        # Launch web browser
npm run lint       # Run ESLint
npm run reset-project  # Reset project & clear cache
```

---

## 📚 Resources & Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Guide](https://docs.expo.dev/routing/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Google Gemini API](https://ai.google.dev/)

---

## 📄 License

Private - All Rights Reserved

---

## 👨‍💻 Thông Tin Liên Hệ

Nếu có câu hỏi hoặc đóng góp, vui lòng liên hệ team development.

---

**Cập nhật lần cuối**: January 23, 2026
