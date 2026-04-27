import { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, MessageSquare, Sparkles, ChevronLeft } from "lucide-react-native";
import { notificationApi } from "../lib/api";
import { useFocusEffect, useRouter } from "expo-router";

interface Notification {
  id: number;
  title: string;
  content: string;
  type: "general" | "message" | "match";
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (_e) {
      // Background failure handled silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id?: number) => {
    try {
      await notificationApi.markRead(id);
      fetchNotifications();
    } catch (_e) {
      // Mark read failure handled silently
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message": return <MessageSquare size={20} color="#FF4500" />;
      case "match": return <Sparkles size={20} color="#8B5CF6" />;
      default: return <Bell size={20} color="#525252" />;
    }
  };

  const NotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[styles.notifCard, !item.is_read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getIcon(item.type)}
      </View>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>{item.title}</Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.bodyText}>{item.content}</Text>
        <Text style={styles.timeText}>
          {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => markAsRead()}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#FF4500" size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <NotificationItem item={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4500" />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Bell size={48} color="#171717" />
              <Text style={styles.emptyTitle}>All quiet here</Text>
              <Text style={styles.emptySubtitle}>You have no new notifications at the moment.</Text>
            </View>
          }
        />
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  markAllText: {
    color: "#FF4500",
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    padding: 20,
  },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#171717",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  unreadCard: {
    backgroundColor: "#1a1a1a",
    borderColor: "rgba(255, 69, 0, 0.2)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: "#E5E5E5",
    fontSize: 16,
    fontWeight: "600",
  },
  unreadTitle: {
    color: "white",
    fontWeight: "800",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4500",
  },
  bodyText: {
    color: "#A3A3A3",
    fontSize: 14,
    lineHeight: 20,
  },
  timeText: {
    color: "#525252",
    fontSize: 11,
    marginTop: 8,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginTop: 100,
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
