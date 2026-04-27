import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageSquare, Users, Sparkles, ChevronRight, Search } from "lucide-react-native";
import { useState, useCallback } from "react";
import { socialApi } from "../../lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "../../lib/store";

export default function SocialScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"discovery" | "chats">("discovery");
  const [similarMinds, setSimilarMinds] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      fetchData();
    }, [user, activeTab])
  );

  const isOnline = (lastSeen: string) => {
    if (!lastSeen) return false;
    const now = new Date();
    const last = new Date(lastSeen);
    const diff = (now.getTime() - last.getTime()) / 1000 / 60;
    return diff < 1;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "discovery") {
        const res = await socialApi.getSimilarMinds();
        if (res.data?.success) {
          // Flatten the matches for easier rendering
          const flattened = (res.data.data?.matches || []).map((m: any) => ({
            ...m.target_user,
            similarity_score: m.score,
            reasons: m.reasons
          }));
          setSimilarMinds(flattened);
        }
      } else {
        const res = await socialApi.getConversations();
        if (res.data?.success) {
          setConversations(res.data.data?.conversations || []);
        }
      }
    } catch (_e) {
      // Handled by empty state if data fails to load
    } finally {
      setLoading(false);
    }
  };

  const UserItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userCard}
      activeOpacity={0.7}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: item.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}` }}
          style={styles.avatar}
        />
        {activeTab === "discovery" && (
          <View style={styles.similarityBadge}>
            <Text style={styles.similarityText}>{Math.round(item.similarity_score * 100)}%</Text>
          </View>
        )}
        {isOnline(item.last_seen) && (
          <View style={styles.onlineDot} />
        )}
      </View>
      <View style={styles.userContent}>
        <Text style={styles.username}>{item.nickname || item.username}</Text>
        <Text style={styles.userBio} numberOfLines={1}>
          {activeTab === "discovery" ? (item.reasons || "Similar taste in movies") : (item.last_message || "Start chatting")}
        </Text>
      </View>
      <ChevronRight size={20} color="#262626" />
    </TouchableOpacity>
  );

  const ConversationItem = ({ item }: { item: any }) => {
    const participant = item.participant;
    const lastMsg = item.last_message;
    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${participant.id}`)}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: participant.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.username}` }}
            style={styles.avatar}
          />
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge} />
          )}
          {isOnline(participant.last_seen) && (
            <View style={styles.onlineDot} />
          )}
        </View>
        <View style={styles.userContent}>
          <Text style={styles.username}>{participant.nickname || participant.username}</Text>
          <Text style={[styles.userBio, item.unread_count > 0 && styles.unreadText]} numberOfLines={1}>
            {lastMsg?.content || "No messages yet"}
          </Text>
        </View>
        <View style={styles.convoMeta}>
          <Text style={styles.convoTime}>
            {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </Text>
          <ChevronRight size={16} color="#262626" style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Hub</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab("discovery")}
            style={[styles.tab, activeTab === "discovery" && styles.activeTab]}
          >
            <Users size={18} color={activeTab === "discovery" ? "white" : "#525252"} />
            <Text style={[styles.tabText, activeTab === "discovery" && styles.activeTabText]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("chats")}
            style={[styles.tab, activeTab === "chats" && styles.activeTab]}
          >
            <MessageSquare size={18} color={activeTab === "chats" ? "white" : "#525252"} />
            <Text style={[styles.tabText, activeTab === "chats" && styles.activeTabText]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color="#FF4500" size="large" />
          </View>
        ) : activeTab === "discovery" ? (
          <FlatList
            data={similarMinds}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <UserItem item={item} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <Sparkles size={48} color="#171717" />
                <Text style={styles.emptyTitle}>No matches yet</Text>
                <Text style={styles.emptySubtitle}>Track more movies to find people with similar taste.</Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.participant?.id.toString() || Math.random().toString()}
            renderItem={({ item }) => <ConversationItem item={item} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <MessageSquare size={48} color="#171717" />
                <Text style={styles.emptyTitle}>No conversations yet</Text>
                <Text style={styles.emptySubtitle}>Find someone to talk to in the Discover tab.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#171717",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: "#262626",
  },
  tabText: {
    color: "#525252",
    fontSize: 14,
    fontWeight: "700",
  },
  activeTabText: {
    color: "white",
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  listContent: {
    padding: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171717",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#262626",
  },
  similarityBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#FF4500",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#171717",
  },
  similarityText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900",
  },
  userContent: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  userBio: {
    color: "#525252",
    fontSize: 13,
    marginTop: 2,
  },
  unreadText: {
    color: "white",
    fontWeight: "700",
  },
  unreadBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF4500",
    borderWidth: 2,
    borderColor: "#171717",
  },
  onlineDot: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: "#171717",
    shadowColor: "#4ADE80",
    shadowRadius: 4,
    shadowOpacity: 0.5,
  },
  convoMeta: {
    alignItems: "flex-end",
  },
  convoTime: {
    color: "#525252",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
  },
  emptySubtitle: {
    color: "#525252",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },
});
