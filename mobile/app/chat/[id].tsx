import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, ChevronLeft, MoreVertical, Shield } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { socialApi, authApi } from "../../lib/api";
import { LinearGradient } from "expo-linear-gradient";

interface Message {
  id: string;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function DirectChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Get My Profile to know my ID
      const meRes = await authApi.getMe();
      if (meRes.data?.success) {
        setCurrentUserId(meRes.data.data.user.id);
      }

      // 2. Get Target User Profile
      const profileRes = await socialApi.getProfile(Number(id));
      if (profileRes.data?.success) {
        setTargetUser(profileRes.data.data);
      }

      // 3. Get Messages
      const msgRes = await socialApi.getMessages(Number(id));
      if (msgRes.data?.success) {
        setMessages(msgRes.data.data.messages || []);
      }
    } catch (_e) {
      Alert.alert("Error", "Could not load chat data.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText("");

    try {
      const res = await socialApi.sendMessage(Number(id), text);
      if (res.data?.success) {
        // Refresh messages to show the new one
        const msgRes = await socialApi.getMessages(Number(id));
        if (msgRes.data?.success) {
          setMessages(msgRes.data.data.messages || []);
        }
      }
    } catch (_e) {
      Alert.alert("Error", "Could not send message.");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myWrapper : styles.theirWrapper]}>
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          
          {targetUser ? (
            <View style={styles.headerUser}>
              <Image 
                source={{ uri: targetUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}` }} 
                style={styles.headerAvatar} 
              />
              <View>
                <Text style={styles.headerName}>{targetUser.nickname || targetUser.username}</Text>
                <Text style={styles.headerStatus}>Active Now</Text>
              </View>
            </View>
          ) : (
            <View style={styles.headerUser}>
              <ActivityIndicator size="small" color="#525252" />
            </View>
          )}

          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={20} color="#525252" />
          </TouchableOpacity>
        </View>

        <View style={styles.safetyBanner}>
          <Shield size={14} color="#525252" />
          <Text style={styles.safetyText}>Messages are private between you and {targetUser?.username}</Text>
        </View>

        {/* Chat Area */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#525252"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity 
              onPress={sendMessage}
              disabled={!inputText.trim()}
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            >
              <Send size={20} color={inputText.trim() ? "white" : "#262626"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#171717",
  },
  headerName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  headerStatus: {
    color: "#4ADE80",
    fontSize: 11,
    fontWeight: "600",
  },
  moreButton: {
    padding: 8,
  },
  safetyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    backgroundColor: "#0d0d0d",
  },
  safetyText: {
    color: "#525252",
    fontSize: 11,
    fontWeight: "600",
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  myWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  theirWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: "#FF4500",
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: "#171717",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "white",
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    color: "#525252",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#171717",
    backgroundColor: "#0a0a0a",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171717",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 15,
    maxHeight: 100,
    paddingTop: Platform.OS === "ios" ? 8 : 0,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF4500",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: "#171717",
  },
});
