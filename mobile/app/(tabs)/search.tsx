import { useState, useCallback, useRef, memo } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search as SearchIcon, X, Star, Plus, ChevronRight, Check, ChevronLeft } from "lucide-react-native";
import { movieApi } from "../../lib/api";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

import { useAuthStore } from "../../lib/store";

export default function SearchScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { q } = useLocalSearchParams();
  const [query, setQuery] = useState((q as string) || "");
  const [results, setResults] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [libraryIds, setLibraryIds] = useState<Map<number, number>>(new Map()); // tmdb_id -> internal_id
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  // Fetch library on focus to stay in sync
  useFocusEffect(
    React.useCallback(() => {
      if (!user) return;
      syncLibrary();
      if (q) {
        handleSearch(q as string);
      }
    }, [user, q])
  );

  const syncLibrary = async () => {
    try {
      const res = await movieApi.getMovies();
      const movies = res.data?.data?.watched_movies || [];
      const idMap = new Map();
      movies.forEach((m: any) => idMap.set(m.canonical_id || m.tmdb_id, m.id));
      setLibraryIds(idMap);
    } catch (_e) {
      // Sync failure is non-critical for display
    }
  };

  // Debounced search logic
  const performSearch = async (text: string) => {
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await movieApi.searchMovies(text);
      if (res.data?.success) {
        setResults(res.data.data.results);
      }
      setSearched(true);
    } catch (_error) {
      Alert.alert("Search failed", "Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (text: string) => {
    setQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    // Set a timeout to perform the search after 500ms
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  };

  const handleToggleLibrary = (movie: any) => {
    const entityId = movie.id; // This is the canonical_id from the new API
    if (togglingIds.has(entityId)) return;
    setTogglingIds(prev => new Set(prev).add(entityId));

    const execute = async () => {
      const internalId = libraryIds.get(entityId);
      try {
        if (internalId) {
          // Remove
          await movieApi.deleteMovie(internalId);
          setLibraryIds(prev => {
            const next = new Map(prev);
            next.delete(entityId);
            return next;
          });
        } else {
          // Add
          const payload = {
            canonical_id: entityId,
            title: movie.title,
            type: movie.type || "movie",
            sources: movie.sources || {},
            tmdb_id: movie.sources?.tmdb?.id ? parseInt(movie.sources.tmdb.id) : undefined,
            overview: movie.overview,
            poster_url: movie.poster_url,
            vote_average: movie.primary_rating?.value,
            release_date: movie.year ? `${movie.year}-01-01` : undefined,
            genre_ids: movie.genres?.map(String).join(",") || "",
            query: movie.title
          };
          await movieApi.addMovie(payload);

          // Optimistic update
          setLibraryIds(prev => new Map(prev).set(entityId, -1));

          // Refresh in background to get real ID
          await syncLibrary();
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.detail || "Could not update library. Try again.";
        Alert.alert("Error", errorMsg);
      } finally {
        setTogglingIds(prev => {
          const next = new Set(prev);
          next.delete(entityId);
          return next;
        });
      }
    };

    execute();
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  const MovieItem = memo(({
    item,
    isAdded,
    isToggling,
    onToggle,
    onPress
  }: {
    item: any,
    isAdded: boolean,
    isToggling: boolean,
    onToggle: (movie: any) => void,
    onPress: (movie: any) => void
  }) => (
    <TouchableOpacity
      style={styles.movieItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.poster_url || "https://images.placeholders.dev/?width=500&height=750&text=No+Poster" }}
        style={styles.poster}
      />
      <View style={styles.movieDetails}>
        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={styles.rating}>
            {item.primary_rating?.value 
              ? Number(item.primary_rating.value).toFixed(1) 
              : item.ratings?.tmdb?.value ? Number(item.ratings.tmdb.value).toFixed(1) : "N/A"}
          </Text>
          <View style={styles.dot} />
          <Text style={styles.year}>{item.year || "N/A"}</Text>
        </View>
        <Text style={styles.overview} numberOfLines={2}>
          {item.overview || "No description available."}
        </Text>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.addButton,
            isAdded && styles.addedButton,
            isToggling && styles.togglingButton
          ]}
          onPress={() => onToggle(item)}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color="#FF4500" />
          ) : isAdded ? (
            <Check size={16} color="#4ADE80" />
          ) : (
            <Plus size={16} color="white" />
          )}
        </TouchableOpacity>
        <ChevronRight size={18} color="#262626" style={{ marginTop: 10 }} />
      </View>
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header / Search Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <SearchIcon size={20} color="#525252" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, actors, directors..."
            placeholderTextColor="#525252"
            value={query}
            onChangeText={handleSearch}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={18} color="#525252" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results or States */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF4500" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MovieItem
              item={item}
              isAdded={libraryIds.has(item.id)}
              isToggling={togglingIds.has(item.id)}
              onToggle={handleToggleLibrary}
              onPress={(m) => router.push(`/movie/${m.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : searched ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>Try searching in English or for related titles.</Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <SearchIcon size={64} color="#171717" />
          <Text style={styles.emptyTitle}>Find Your Next Movie</Text>
          <Text style={styles.emptySubtitle}>Search across millions of titles in Turkish or English.</Text>
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
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
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
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#171717",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    padding: 5,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "#ffffff",
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
  listContent: {
    paddingVertical: 10,
  },
  movieItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#0a0a0a",
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#171717",
  },
  movieDetails: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  movieTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 6,
  },
  rating: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#262626",
  },
  year: {
    color: "#525252",
    fontSize: 13,
    fontWeight: "600",
  },
  typeTag: {
    backgroundColor: "#171717",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#262626",
  },
  typeText: {
    color: "#a3a3a3",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  overview: {
    color: "#737373",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  actionContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  addedButton: {
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    borderColor: "rgba(74, 222, 128, 0.2)",
  },
  togglingButton: {
    backgroundColor: "rgba(255, 69, 0, 0.05)",
    borderColor: "rgba(255, 69, 0, 0.1)",
  },
});
