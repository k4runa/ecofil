import { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { movieApi, authApi } from "../../lib/api";
import { Film, Trash2, LayoutGrid, List, ChevronLeft, Heart } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 60) / 2;

import { useAuthStore } from "../../lib/store";

export default function LibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      fetchMyMovies();
    }, [user])
  );

  const fetchMyMovies = async () => {
    try {
      const res = await movieApi.getMovies();
      if (res.data?.data?.watched_movies) {
        setMovies(res.data.data.watched_movies);
      }
    } catch (_error) {
      Alert.alert("Error", "Could not load your library.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (deletingIds.has(id)) return;
    setDeletingIds(prev => new Set(prev).add(id));
    try {
      await movieApi.deleteMovie(id);
      setMovies((prev) => prev.filter((m) => m.id !== id));
    } catch (_error) {
      Alert.alert("Error", "Could not remove movie from library.");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Collections</Text>
        <Text style={styles.subtitle}>{movies.length} Saved Movies</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
        </View>
      ) : movies.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {movies.map((movie) => (
              <TouchableOpacity
                key={movie.id}
                style={styles.movieCard}
                onPress={() => router.push(`/movie/${movie.tmdb_id || movie.canonical_id}`)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: movie.poster_url }} style={styles.poster} />
                <TouchableOpacity
                  style={[styles.favBadge, movie.is_favorite && styles.favBadgeActive]}
                  onPress={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await movieApi.toggleFavorite(movie.id);
                      if (res.data?.success) {
                        fetchMyMovies();
                        // Also sync with auth store for the profile favorites list
                        const meRes = await authApi.getMe();
                        if (meRes.data?.success) {
                          const { useAuthStore } = require('../../lib/store');
                          useAuthStore.getState().setUser(meRes.data.data.user);
                        }
                      }
                    } catch (err: any) {
                      const errorMsg = err.response?.data?.detail || "Failed to update favorites.";
                      Alert.alert("Favorites", errorMsg);
                    }
                  }}
                >
                  <Heart
                    size={16}
                    color={movie.is_favorite ? "#FF4500" : "white"}
                    fill={movie.is_favorite ? "#FF4500" : "transparent"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBadge, deletingIds.has(movie.id) && styles.deletingBadge]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(movie.id);
                  }}
                  disabled={deletingIds.has(movie.id)}
                >
                  {deletingIds.has(movie.id) ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Trash2 size={16} color="white" />
                  )}
                </TouchableOpacity>
                <View style={styles.cardInfo}>
                  <Text style={styles.movieTitle} numberOfLines={1}>{movie.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Film size={64} color="#171717" />
          <Text style={styles.emptyTitle}>No Collections</Text>
          <Text style={styles.emptyText}>Movies you add will appear here. Go explore some titles!</Text>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    marginBottom: 16,
    marginLeft: -4,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
  },
  subtitle: {
    color: "#525252",
    fontSize: 16,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 20,
  },
  movieCard: {
    width: CARD_WIDTH,
    marginBottom: 10,
    position: "relative",
  },
  poster: {
    width: "100%",
    height: CARD_WIDTH * 1.5,
    borderRadius: 12,
    backgroundColor: "#171717",
  },
  deleteBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(220, 38, 38, 0.8)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  favBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  favBadgeActive: {
    backgroundColor: "rgba(255, 69, 0, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.3)",
  },
  deletingBadge: {
    backgroundColor: "rgba(38, 38, 38, 0.8)",
  },
  cardInfo: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  movieTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 20,
  },
  emptyText: {
    color: "#525252",
    textAlign: "center",
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
});
