import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useRef } from "react";
import { Animated, View, StyleSheet, Image } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "../lib/store";
import { authApi } from "../lib/api";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [appReady, setAppReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(0.9)).current;

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Basic pulse animation for the icon while loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(splashScale, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(splashScale, { toValue: 0.9, duration: 800, useNativeDriver: true })
      ])
    ).start();

    async function checkToken() {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (token) {
          const res = await authApi.getMe();
          if (res.data?.data?.user) {
            setUser(res.data.data.user);
          } else {
            await SecureStore.deleteItemAsync("userToken");
            useAuthStore.setState({ isLoading: false });
          }
        } else {
          useAuthStore.setState({ isLoading: false });
        }
      } catch (_e) {
        await SecureStore.deleteItemAsync("userToken");
        useAuthStore.setState({ isLoading: false });
      } finally {
        setAppReady(true);
      }
    }

    // Add a failsafe timeout so it never gets stuck forever
    const timeout = setTimeout(() => {
      useAuthStore.setState({ isLoading: false });
      setAppReady(true);
    }, 5000);

    checkToken().then(() => clearTimeout(timeout));
  }, []);

  useEffect(() => {
    if (!appReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }

    // Hide native splash immediately since we have a React overlay
    SplashScreen.hideAsync();

    // Fade out our custom React splash screen
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setSplashVisible(false);
    });

  }, [user, segments, appReady]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0a0a0a" },
              animation: "fade_from_bottom"
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
            <Stack.Screen name="movie/[id]" options={{ presentation: "card" }} />
            <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
          </Stack>

          {/* Custom Animated Splash Overlay */}
          {splashVisible && (
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: "#0a0a0a",
                  justifyContent: "center",
                  alignItems: "center",
                  opacity: splashOpacity,
                  zIndex: 999
                }
              ]}
            >
              <Animated.Image
                source={require("../assets/splash-icon.png")}
                style={{ width: 120, height: 120, transform: [{ scale: splashScale }] }}
                resizeMode="contain"
              />
            </Animated.View>
          )}
        </View>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
