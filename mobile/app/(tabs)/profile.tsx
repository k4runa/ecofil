import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore, useLibraryStore } from "../../lib/store";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useState, useCallback, useEffect } from "react";
import {
  LogOut,
  Settings,
  User,
  ChevronRight,
  Bell,
  Shield,
  CircleHelp,
  CreditCard,
  Film,
  Star,
  Cpu,
  Sparkles,
  Camera,
  Edit2,
  Info,
  X,
  Share2,
  Globe,
  ExternalLink,
  Copy,
  Check,
  Link as LinkIcon,
  Heart,
  PlusCircle,
  Plus
} from "lucide-react-native";
import { movieApi, usersApi, authApi } from "../../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Linking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';

import EditProfileModal from '../../components/profile/EditProfileModal';
import ShareProfileModal from '../../components/profile/ShareProfileModal';
import AccountInfoModal from '../../components/profile/AccountInfoModal';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://ecofil.app';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const { libraryMovies, favoriteMovies, libraryLoaded, setLibraryMovies, setFavoriteMovies, setLibraryLoaded } = useLibraryStore();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(user?.ai_enabled ?? true);
  const [isPrivate, setIsPrivate] = useState(user?.is_private ?? false);
  const [dmNotificationsEnabled, setDmNotificationsEnabled] = useState(user?.dm_notifications ?? true);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Modal form states moved to respective components

  // Fix for the white navigation bar on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync("light");
    }
  }, []);

  // Effects for Modals moved

  const toggleAI = async (value: boolean) => {
    setAiEnabled(value);
    try {
      const res = await usersApi.updateField("ai_enabled", value);
      if (res.data?.success) {
        const meRes = await authApi.getMe();
        setUser(meRes.data.data.user);
      }
    } catch (_e) {
      setAiEnabled(!value);
      Alert.alert("Error", "Could not update setting. Try again.");
    }
  };

  const togglePrivacy = async (value: boolean) => {
    setIsPrivate(value);
    try {
      const res = await usersApi.updateField("is_private", value);
      if (res.data?.success) {
        const meRes = await authApi.getMe();
        setUser(meRes.data.data.user);
      }
    } catch (_e) {
      setIsPrivate(!value);
      Alert.alert("Error", "Could not update setting. Try again.");
    }
  };

  const toggleDmNotifications = async (value: boolean) => {
    setDmNotificationsEnabled(value);
    try {
      const res = await usersApi.updateField("dm_notifications", value);
      if (res.data?.success) {
        const meRes = await authApi.getMe();
        setUser(meRes.data.data.user);
      }
    } catch (e: any) {
      const detail = e.response?.data?.detail;
      if (detail) {
        Alert.alert("Error", typeof detail === 'string' ? detail : "Could not update notification settings.");
      }
      setDmNotificationsEnabled(!value);
    }
  };

  const fetchLibrary = async (silent = false) => {
    if (!silent && !libraryLoaded) setLoading(true);
    try {
      const results = await Promise.allSettled([
        movieApi.getMovies(),
        movieApi.getFavorites(),
      ]);
      if (results[0].status === 'fulfilled' && results[0].value.data?.success) {
        setLibraryMovies(results[0].value.data.data.watched_movies || []);
      }
      if (results[1].status === 'fulfilled' && results[1].value.data?.data?.favorites) {
        setFavoriteMovies(results[1].value.data.data.favorites);
      }
      setLibraryLoaded(true);
    } catch (_e) {
      // non-critical
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLibrary(libraryLoaded);
      const refreshUser = async () => {
        try {
          const res = await authApi.getMe();
          if (res.data?.success) setUser(res.data.data.user);
        } catch (_e) { }
      };
      refreshUser();
    }, [libraryLoaded])
  );

  // handleUpdateProfile logic moved to EditProfileModal

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "You need to grant permission to access your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleUploadAvatar(result.assets[0].uri);
    }
  };

  const handleUploadAvatar = async (uri: string) => {
    setImageLoading(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename || 'avatar.jpg',
        type,
      } as any);

      const res = await usersApi.uploadAvatar(formData);
      if (res.data?.success) {
        const meRes = await authApi.getMe();
        setUser(meRes.data.data.user);
        Alert.alert("Success", "Avatar updated successfully.");
      }
    } catch (_e) {
      Alert.alert("Error", "Could not upload avatar. Try again.");
    } finally {
      setImageLoading(false);
    }
  };

  // handleShare moved to ShareProfileModal

  const MenuOption = ({ icon: Icon, title, subtitle, color = "#525252", onPress }: any) => (
    <TouchableOpacity style={styles.menuOption} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color="#525252" />
    </TouchableOpacity>
  );

  const toggleFavorite = async (movieId: number) => {
    try {
      const res = await movieApi.toggleFavorite(movieId);
      if (res.data?.success) {
        const meRes = await authApi.getMe();
        setUser(meRes.data.data.user);
      }
    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || "Failed to update favorites.";
      Alert.alert("Favorites", errorMsg);
    }
  };
  const MovieThumb = ({ movie, showFavorite = true }: { movie: any; showFavorite?: boolean }) => (
    <TouchableOpacity
      style={styles.movieThumb}
      onPress={() => router.push(`/movie/${movie.tmdb_id || movie.canonical_id}`)}
    >
      <Image
        source={{ uri: movie.poster_url }}
        style={styles.thumbImage}
      />
      {showFavorite && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(movie.id);
          }}
          style={styles.favToggle}
        >
          <Heart
            size={14}
            color={movie.is_favorite ? "#FF4500" : "white"}
            fill={movie.is_favorite ? "#FF4500" : "transparent"}
          />
        </TouchableOpacity>
      )}
      <View style={styles.ratingBadge}>
        <Star size={8} color="#FFD700" fill="#FFD700" />
        <Text style={styles.thumbRating}>{Number(movie.vote_average || 0).toFixed(1)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pro Header */}
        <View style={styles.topNav}>
          <Text style={styles.navTitle}>Profile</Text>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.topActionBtn}>
              <Share2 size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Settings", "App settings coming soon in v2.0")} style={styles.topActionBtn}>
              <Settings size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card Overhaul */}
        <View style={styles.header}>
          <View style={styles.profileCard}>
            <View style={styles.cardContent}>
              <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                <Image
                  source={{ uri: user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=user" }}
                  style={styles.avatar}
                />
                <View style={styles.cameraIconContainer}>
                  {imageLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Camera size={14} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                {(user?.full_name || user?.nickname) ? (
                  <>
                    <Text style={styles.fullName}>{user?.full_name || user?.nickname}</Text>
                    <Text style={styles.username}>{user?.username}</Text>
                  </>
                ) : (
                  <Text style={styles.fullName}>{user?.username}</Text>
                )}
              </View>
            </View>

            {user?.bio && (
              <Text style={styles.bioText} numberOfLines={3}>{user.bio}</Text>
            )}

            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => setEditModalVisible(true)}
              >
                <Edit2 size={14} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* My Library Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collections</Text>
            <TouchableOpacity onPress={() => router.push("/library")}>
              <Text style={styles.seeAllText}>View All ({libraryMovies.length})</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#FF4500" style={{ marginVertical: 20 }} />
          ) : libraryMovies.length > 0 ? (
            <FlatList
              data={libraryMovies}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <MovieThumb movie={item} showFavorite={false} />}
              keyExtractor={(item) => `lib-${item.id}`}
              contentContainerStyle={styles.thumbList}
            />
          ) : (
            <View style={styles.emptyLibrary}>
              <Film size={32} color="#525252" />
              <Text style={styles.emptyText}>Your collections are empty</Text>
            </View>
          )}
        </View>

        {/* Favorites Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <Text style={styles.favoriteCount}>{favoriteMovies.length}/3</Text>
          </View>
          {favoriteMovies.length > 0 ? (
            <FlatList
              data={favoriteMovies}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => <MovieThumb movie={{ ...item, is_favorite: true }} />}
              keyExtractor={(item) => `fav-${item.id}`}
              contentContainerStyle={styles.thumbList}
            />
          ) : (
            <View style={styles.emptyLibrary}>
              <Heart size={32} color="#525252" />
              <Text style={styles.emptyText}>No favorites yet</Text>
            </View>
          )}
        </View>

        {/* Preferences & Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Preferences</Text>
          <View style={styles.menuList}>
            <View style={styles.menuOption}>
              <View style={[styles.iconContainer, { backgroundColor: `#FF450015` }]}>
                <Cpu size={20} color="#FF4500" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Eco Recommendations</Text>
                <Text style={styles.menuSubtitle}>Let Eco suggest movies and anime based on your collection.</Text>
              </View>
              <Switch
                value={aiEnabled}
                onValueChange={toggleAI}
                trackColor={{ false: "#171717", true: "#FF4500" }}
                thumbColor={aiEnabled ? "white" : "#525252"}
              />
            </View>

            <View style={styles.menuOption}>
              <View style={[styles.iconContainer, { backgroundColor: `#10B98115` }]}>
                <Shield size={20} color="#10B981" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Privacy Mode</Text>
                <Text style={styles.menuSubtitle}>Stay hidden from Similar Minds</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={togglePrivacy}
                trackColor={{ false: "#171717", true: "#10B981" }}
                thumbColor={isPrivate ? "white" : "#525252"}
              />
            </View>

            <View style={styles.menuOption}>
              <View style={[styles.iconContainer, { backgroundColor: `#F59E0B15` }]}>
                <Bell size={20} color="#F59E0B" />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>App Notifications</Text>
                <Text style={styles.menuSubtitle}>Alerts for new messages and recommendations</Text>
              </View>
              <Switch
                value={dmNotificationsEnabled}
                onValueChange={toggleDmNotifications}
                trackColor={{ false: "#171717", true: "#F59E0B" }}
                thumbColor={dmNotificationsEnabled ? "white" : "#525252"}
              />
            </View>

            <MenuOption
              icon={Info}
              title="Account Information"
              subtitle="View your account details"
              color="#3B82F6"
              onPress={() => setInfoModalVisible(true)}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <LogOut size={18} color="#FF4500" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Refactored Modals */}
      <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} />
      <ShareProfileModal visible={shareModalVisible} onClose={() => setShareModalVisible(false)} user={user} />
      <AccountInfoModal visible={infoModalVisible} onClose={() => setInfoModalVisible(false)} user={user} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  navTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -1,
  },
  topActions: {
    flexDirection: "row",
    gap: 12,
  },
  topActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  profileCard: {
    backgroundColor: "#0d0d0d",
    padding: 24,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 50,
    backgroundColor: "#171717",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FF4500",
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0d0d0d",
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  username: {
    color: "#525252",
    fontSize: 14,
    fontWeight: "600",
    marginTop: -2,
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    color: "#525252",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bioText: {
    color: "#a3a3a3",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
    fontWeight: "500",
  },
  socialBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 20,
  },
  socialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  socialBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },
  profileActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  editProfileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171717",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  editProfileText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  shareProfileButton: {
    width: 50,
    backgroundColor: "rgba(255, 69, 0, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.15)",
  },
  section: {
    marginTop: 40,
    paddingHorizontal: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#737373",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 20,
    letterSpacing: 2.5,
  },
  seeAllText: {
    color: "#FF4500",
    fontSize: 11,
    fontWeight: "900",
  },
  favoriteCount: {
    color: "#525252",
    fontSize: 11,
    fontWeight: "900",
  },
  thumbList: {
    paddingRight: 24,
  },
  movieThumb: {
    width: 110,
    height: 160,
    marginRight: 14,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.8)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  thumbRating: {
    color: "white",
    fontSize: 9,
    fontWeight: "900",
  },
  emptyLibrary: {
    height: 120,
    backgroundColor: "#0a0a0a",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.02)",
    borderStyle: 'dashed',
  },
  emptyText: {
    color: "#262626",
    fontSize: 13,
    fontWeight: "700",
  },
  menuList: {
    backgroundColor: "#0a0a0a",
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.02)",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  genreHeaderChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  headerGenreChip: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  headerGenreText: {
    color: '#737373',
    fontSize: 9,
    fontWeight: '800',
  },
  menuSubtitle: {
    color: "#525252",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 40,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "rgba(255, 69, 0, 0.04)",
    borderWidth: 0.6,
    borderColor: "rgba(255, 69, 0, 0.1)",
  },
  logoutText: {
    color: "#FF4500",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  favToggle: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 10,
    zIndex: 10,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  // Modal styles moved to respective components
  genrePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  genreTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  genreTagSelected: {
    backgroundColor: '#FF4500',
    borderColor: '#FF4500',
  },
  genreTagText: {
    color: '#525252',
    fontSize: 12,
    fontWeight: '700',
  },
  genreTagTextSelected: {
    color: 'white',
    fontWeight: '900',
  },
});
