import { useState, useRef, useEffect, useCallback } from "react";
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
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, Sparkles, User, ChevronLeft, Trash2 } from "lucide-react-native";
import { aiApi, movieApi } from "../../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import Markdown from 'react-native-markdown-display';
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const historyRes = await aiApi.getHistory();
      if (historyRes.data?.success && historyRes.data.data.length > 0) {
        const formatted = historyRes.data.data.map((m: any) => ({
          id: m.id.toString(),
          text: m.content,
          sender: m.role === "user" ? "user" : "ai",
          timestamp: new Date(m.created_at)
        }));
        setMessages(formatted);
      } else {
        // Check if we should show the one-time greeting
        const hasSeenGreeting = await SecureStore.getItemAsync("eco_greeting_seen");
        if (!hasSeenGreeting) {
          const welcomeMsg: Message = {
            id: "welcome",
            text: "Hello! I'm **Eco**, your personal cinema guide. I've analyzed your collection and I'm ready to help you find your next favorite movie. What are you in the mood for today?",
            sender: "ai",
            timestamp: new Date()
          };
          setMessages([welcomeMsg]);
          await SecureStore.setItemAsync("eco_greeting_seen", "true");
        } else {
          setMessages([]);
        }
      }

      await fetchUserContext();
    } catch (_e) {
      // Silently fail — empty chat is a valid state
    } finally {
      setLoading(false);
    }
  };

  const fetchUserContext = async () => {
    try {
      const res = await movieApi.getMovies();
      const watched = res.data?.data?.watched_movies || [];
      if (watched.length > 0) {
        const movieTitles = watched.map((m: any) => m.title).join(", ");
        setContext(`The user has watched: ${movieTitles}. Use this to personalize your chat.`);
      }
    } catch (_e) {
      // Context is optional — chat works without it
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      // Pass the actual message history (formatted for the backend)
      const history = messages.map(msg => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text
      }));

      const res = await aiApi.chat(userMsg.text, history);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data?.response || "I encountered an error processing your request. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (_error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Could not reach the server. Check your connection and try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animate = (val: Animated.Value, delay: number) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0, duration: 400, useNativeDriver: true }),
          ])
        ).start();
      };
      animate(dot1, 0);
      animate(dot2, 200);
      animate(dot3, 400);
    }, []);

    const dotStyle = (val: Animated.Value) => ({
      opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
      transform: [{
        translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -4] })
      }]
    });

    return (
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
        <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
        <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
      </View>
    );
  };

  const clearChat = async () => {
    try {
      await aiApi.clearHistory();
      setMessages([]);
    } catch (_e) {
      Alert.alert("Clear failed", "Could not clear history. Try again.");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageWrapper,
      item.sender === "user" ? styles.userWrapper : styles.aiWrapper
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === "user" ? styles.userBubble : styles.aiBubble
      ]}>
        {item.sender === "ai" && (
          <LinearGradient
            colors={["rgba(255, 69, 0, 0.1)", "rgba(255, 69, 0, 0.05)"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        {item.sender === "ai" ? (
          <Markdown style={markdownStyles}>
            {item.text}
          </Markdown>
        ) : (
          <Text style={[
            styles.messageText,
            item.sender === "user" ? styles.userText : styles.aiText
          ]}>
            {item.text}
          </Text>
        )}
      </View>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.aiIconContainer}>
            <LinearGradient
              colors={["#FF4500", "#FF8C00"]}
              style={StyleSheet.absoluteFill}
            />
            <Sparkles size={18} color="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Eco</Text>
          </View>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
          <Trash2 size={20} color="#262626" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <TypingIndicator />
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about movies..."
              placeholderTextColor="#525252"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || loading}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const markdownStyles = {
  body: {
    color: "#E5E5E5",
    fontSize: 15,
    lineHeight: 22,
  },
  strong: {
    color: "white",
    fontWeight: "900" as any,
  },
  em: {
    fontStyle: "italic" as any,
  },
  bullet_list: {
    marginVertical: 10,
  },
  list_item: {
    flexDirection: "row" as any,
    alignItems: "flex-start" as any,
    marginVertical: 4,
  },
  bullet_list_icon: {
    color: "#FF4500",
    fontSize: 18,
    marginRight: 10,
  },
  link: {
    color: "#FF4500",
    textDecorationLine: "underline" as any,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  aiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FF4500",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
    shadowColor: "#4ADE80",
    shadowRadius: 4,
    shadowOpacity: 0.5,
  },
  headerStatus: {
    color: "#525252",
    fontSize: 12,
    fontWeight: "500",
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  messageWrapper: {
    maxWidth: "85%",
    marginBottom: 4,
  },
  userWrapper: {
    alignSelf: "flex-end",
  },
  aiWrapper: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  userBubble: {
    backgroundColor: "#FF4500",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#171717",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.15)",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: "white",
    fontWeight: "600",
  },
  aiText: {
    color: "#E5E5E5",
    fontWeight: "400",
  },
  timestamp: {
    color: "#525252",
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 8,
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignSelf: "flex-start",
  },
  typingBubble: {
    backgroundColor: "#171717",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderBottomLeftRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.15)",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF4500",
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#0a0a0a",
    borderTopWidth: 1,
    borderTopColor: "#171717",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171717",
    borderRadius: 10,
    paddingLeft: 20,
    paddingRight: 6,
    minHeight: 50,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FF4500",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#262626",
  },
});
