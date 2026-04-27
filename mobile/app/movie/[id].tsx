import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { movieApi } from "../../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Star,
  Calendar,
  Plus,
  Share2,
  Sparkles,
  CheckCircle2,
  Heart
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function MovieDetailScreen() {
  const { id, ai_reason: passedAiReason } = useLocalSearchParams();
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [internalId, setInternalId] = useState<number | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Detect if the ID is a TMDB numeric ID or a canonical UUID
  const isTmdbId = !isNaN(Number(id));

  const fetchDetails = async () => {
    try {
      let currentMovie = null;

      if (isTmdbId) {
        // Legacy flow: fetch from TMDB detail endpoint
        const shouldSkipAi = !!passedAiReason;
        const res = await movieApi.getMovieDetails(Number(id), shouldSkipAi);

        if (res.data?.data) {
          currentMovie = res.data.data;
          if (passedAiReason) {
            currentMovie.ai_reason = passedAiReason;
          }
        }
      } else {
        // New flow: fetch from Discovery details (cached search result)
        try {
          const res = await movieApi.getDiscoveryDetails(id as string);
          if (res.data?.data) {
            currentMovie = res.data.data;
          }
        } catch (_e) {
          // Discovery fetch failed, fallback to library check happens below
        }
      }

      // Check if already in library
      const libRes = await movieApi.getMovies();
      const movieInLib = libRes.data?.data?.watched_movies?.find(
        (m: any) => isTmdbId ? m.tmdb_id === Number(id) : m.canonical_id === id
      );

      if (movieInLib) {
        setAdded(true);
        setInternalId(movieInLib.id);
        setIsFavorite(movieInLib.is_favorite);

        // Use library data if discovery failed, or merge library status
        if (!currentMovie) {
          currentMovie = {
            title: movieInLib.title,
            poster_url: movieInLib.poster_url,
            overview: movieInLib.overview,
            vote_average: movieInLib.vote_average,
            release_date: movieInLib.release_date,
            ai_reason: movieInLib.ai_reason || passedAiReason || "No recommendation overview available.",
          };
        } else {
          // If we have discovery data, prefer its ai_reason if the library one is empty
          if (!currentMovie.ai_reason) {
            currentMovie.ai_reason = movieInLib.ai_reason || passedAiReason || "No recommendation overview available.";
          }
        }
      }

      if (currentMovie) {
        setMovie(currentMovie);
      }
    } catch (_error) {
      Alert.alert("Error", "Could not load movie details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (isToggling) return;
    setIsToggling(true);

    const execute = async () => {
      try {
        if (added && internalId) {
          await movieApi.deleteMovie(internalId);
          setAdded(false);
          setInternalId(null);
          setIsFavorite(false);
        } else if (movie) {
          if (isTmdbId) {
            // Legacy flow
            await movieApi.addMovie({
              tmdb_id: Number(id),
              title: movie.title,
              overview: movie.overview,
              poster_url: movie.poster_url,
              vote_average: typeof movie.vote_average === 'string' ? parseFloat(movie.vote_average) : movie.vote_average,
              release_date: movie.release_date,
              genre_ids: movie.genre_ids || (Array.isArray(movie.genres) ? movie.genres.map(String).join(",") : ""),
              query: movie.title,
              ai_reason: movie.ai_reason
            });
          } else {
            // New flow with canonical ID
            await movieApi.addMovie({
              canonical_id: id as string,
              title: movie.title,
              type: movie.type || "movie",
              overview: movie.overview,
              poster_url: movie.poster_url,
              vote_average: movie.vote_average,
              release_date: movie.release_date,
              genre_ids: movie.genre_ids || (Array.isArray(movie.genres) ? movie.genres.map(String).join(",") : ""),
              query: movie.title,
              ai_reason: movie.ai_reason
            });
          }
          setAdded(true);
          await fetchDetails();
        }
      } catch (_error) {
        Alert.alert("Error", "Could not update library.");
      } finally {
        setIsToggling(false);
      }
    };

    execute();
  };

  const handleToggleFavorite = async () => {
    if (!added || !internalId) return;
    try {
      const res = await movieApi.toggleFavorite(internalId);
      if (res.data?.success) {
        setIsFavorite(prev => !prev);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Could not update favorites.";
      Alert.alert("Favorites", errorMsg);
    }
  };

  const onShare = async () => {
    try {
      const shareUrl = `https://ecofil.app/movie/${id}`;
      await Share.share({
        title: movie.title,
        message: `🎬 ${movie.title}\n\n${movie.overview?.substring(0, 200)}...\n\nCheck it out here: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (_error) {
      // Share sheet dismissed
    }
  };

  if (loading) {
    return <DetailsSkeleton />;
  }

  if (!movie) return null;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: movie.poster_url }} style={styles.poster} />
          <LinearGradient
            colors={["rgba(10, 10, 10, 0.4)", "transparent", "#0a0a0a"]}
            style={styles.gradient}
          />

          {/* Top Controls */}
          <SafeAreaView style={styles.topControls}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {added && (
                <TouchableOpacity style={styles.iconButton} onPress={handleToggleFavorite}>
                  <Heart size={20} color={isFavorite ? "#FF4500" : "white"} fill={isFavorite ? "#FF4500" : "transparent"} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconButton} onPress={onShare}>
                <Share2 size={20} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{movie.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
              <Text style={styles.metaText}>
                {movie.vote_average
                  ? Number(movie.vote_average).toFixed(1)
                  : movie.primary_rating?.value
                    ? Number(movie.primary_rating.value).toFixed(1)
                    : movie.ratings?.tmdb?.value ? Number(movie.ratings.tmdb.value).toFixed(1) : "N/A"}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Calendar size={16} color="#525252" />
              <Text style={styles.metaText}>{movie.release_date?.split('-')[0]}</Text>
            </View>
          </View>

          {/* AI Recommendation Box */}
          <View style={styles.aiBox}>
            <LinearGradient
              colors={["rgba(255, 69, 0, 0.15)", "rgba(255, 69, 0, 0.05)"]}
              style={styles.aiGradient}
            />
            <View style={styles.aiHeader}>
              <Sparkles size={18} color="#FF4500" />
              <Text style={styles.aiLabel}>Eco's Overview</Text>
            </View>
            <Text style={styles.aiReason}>{movie.ai_reason}</Text>
          </View>

          {/* Overview */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>
            {movie.overview && movie.overview.trim().length > 0
              ? movie.overview
              : "No overview available."}
          </Text>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionButton, added && styles.addedButton, isToggling && styles.togglingButton]}
          onPress={handleAdd}
          activeOpacity={0.8}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color="white" />
          ) : added ? (
            <>
              <CheckCircle2 size={20} color="#4ADE80" />
              <Text style={styles.actionText}>In Your Library</Text>
            </>
          ) : (
            <>
              <Plus size={20} color="white" />
              <Text style={styles.actionText}>Add to Library</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const DetailsSkeleton = () => (
  <View style={styles.container}>
    <View style={[styles.imageContainer, { backgroundColor: '#171717' }]}>
      <ActivityIndicator size="large" color="#FF4500" style={{ marginTop: 200 }} />
    </View>
    <View style={styles.content}>
      <View style={[styles.skeletonLine, { width: '80%', height: 32, marginTop: 20 }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 20, marginTop: 16 }]} />
      <View style={[styles.skeletonLine, { width: '100%', height: 120, marginTop: 32, borderRadius: 15 }]} />
      <View style={[styles.skeletonLine, { width: '30%', height: 14, marginTop: 40 }]} />
      <View style={[styles.skeletonLine, { width: '100%', height: 100, marginTop: 16 }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonLine: {
    backgroundColor: "#171717",
    borderRadius: 4,
  },
  imageContainer: {
    width: width,
    height: width * 1.5,
    position: "relative",
  },
  poster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -60,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#262626",
  },
  aiBox: {
    marginTop: 32,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.2)",
    position: "relative",
  },
  aiGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  aiLabel: {
    color: "#FF4500",
    fontSize: 12,
    fontWeight: "800",
  },
  aiReason: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 26,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontStyle: "italic",
  },
  sectionTitle: {
    color: "#525252",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "capitalize",
    marginTop: 40,
    marginBottom: 16,
  },
  overview: {
    color: "#D4D4D4",
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "400",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  actionButton: {
    backgroundColor: "#FF4500",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 10,
    gap: 12,
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  addedButton: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    shadowOpacity: 0,
  },
  togglingButton: {
    opacity: 0.8,
  },
  actionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
