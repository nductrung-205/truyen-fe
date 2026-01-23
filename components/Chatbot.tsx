import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, Animated, StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { chatbotService } from '@/services/chatbotService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const Chatbot = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const colors = {
    background: isDarkMode ? '#121212' : '#ffffff',
    primary: '#3b82f6',
    text: isDarkMode ? '#ececec' : '#111111',
    userBubble: '#3b82f6',
    assistantBubble: isDarkMode ? '#262626' : '#f1f1f1',
    border: isDarkMode ? '#333' : '#e5e5e5',
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      chatbotService.getQuickSuggestions().then(setSuggestions);
    }
  }, [isOpen]);

  // Hàm Reset cuộc hội thoại
  const handleReset = () => {
    setMessages([]);
    setInput('');
    chatbotService.resetConversation(); // Xóa lịch sử trong service
  };

  const handleSend = async (text?: string) => {
    const content = text || input.trim();
    if (!content || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await chatbotService.chat(content);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: Message = { id: 'err', role: 'assistant', content: 'Lỗi kết nối AI.', timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <>
      {/* Nút bong bóng AI */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[styles.floatingBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        <View style={styles.badge}><Text style={styles.badgeText}>AI</Text></View>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
          
          {/* Header Cải tiến: Thêm nút Refresh */}
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Trợ lý AI</Text>
              <Text style={styles.headerSub}>Hỗ trợ tìm truyện & gợi ý</Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleReset} style={styles.actionBtn}>
                <Ionicons name="refresh" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.actionBtn}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tin nhắn */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <Ionicons name="sparkles" size={50} color={colors.primary} style={{ marginBottom: 15 }} />
                    <Text style={{color: colors.text, fontSize: 18, fontWeight: 'bold'}}>Chào bạn! 👋</Text>
                    <Text style={{color: '#888', textAlign: 'center', marginTop: 10}}>Tôi có thể giúp gì cho bạn hôm nay?</Text>
                    <View style={styles.suggestionBox}>
                        {suggestions.map((s, i) => (
                            <TouchableOpacity key={i} style={styles.sugItem} onPress={() => handleSend(s)}>
                                <Text style={{color: colors.primary, fontWeight: '600'}}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
            renderItem={({ item }) => (
              <View style={[styles.msgWrapper, { justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.bubble, { backgroundColor: item.role === 'user' ? colors.userBubble : colors.assistantBubble }]}>
                  <Text style={{ color: item.role === 'user' ? '#fff' : colors.text, lineHeight: 22 }}>{item.content}</Text>
                </View>
              </View>
            )}
          />

          {isLoading && <ActivityIndicator style={{ margin: 10 }} color={colors.primary} />}

          {/* Ô nhập liệu */}
          <View style={[styles.inputArea, { borderTopColor: colors.border }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Hỏi AI..."
              placeholderTextColor="#999"
              style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? '#222' : '#f9f9f9' }]}
              multiline
            />
            <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn} disabled={!input.trim()}>
              <Ionicons name="send" size={24} color={input.trim() ? colors.primary : '#ccc'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingBtn: { position: 'absolute', bottom: 100, right: 20, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: 'red', paddingHorizontal: 5, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#eee', fontSize: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { marginLeft: 15, padding: 5 },
  msgWrapper: { flexDirection: 'row', padding: 10 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 18 },
  inputArea: { flexDirection: 'row', padding: 15, borderTopWidth: 1, alignItems: 'center' },
  input: { flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, minHeight: 40, maxHeight: 100 },
  sendBtn: { marginLeft: 15 },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 80, padding: 20 },
  suggestionBox: { marginTop: 30, width: '100%' },
  sugItem: { padding: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }
});