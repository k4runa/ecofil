import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { LinearGradient } from "expo-linear-gradient";
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  // Google Auth Session
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "644694454067-73v529qrt00ou6173cej2tpf8fshijv0.apps.googleusercontent.com",
    androidClientId: "644694454067-73v529qrt00ou6173cej2tpf8fshijv0.apps.googleusercontent.com",
  });

  // Toast State
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const toastY = useRef(new Animated.Value(-100)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    Animated.spring(toastY, {
      toValue: 50,
      useNativeDriver: true,
      bounciness: 10,
    }).start();

    setTimeout(() => {
      Animated.timing(toastY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastVisible(false);
      });
    }, 3000);
  };

  const handleRegister = async () => {
    if (!username || !email || !password) {
      showToast("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.register({ username, email, password });
      if (res.data.access_token) {
        // Backend returns token on register, let's use it!
        await SecureStore.setItemAsync('userToken', res.data.access_token);
        const meRes = await authApi.getMe();
        setUser(meRes.data.data.user);
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      let message = "Something went wrong";

      if (Array.isArray(detail)) {
        message = detail.map((err: any) => `${err.loc[1]}: ${err.msg}`).join("\n");
      } else if (typeof detail === "string") {
        message = detail;
      }

      showToast(message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Auth Response
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        const idToken = response.authentication?.idToken;
        if (idToken) {
          setLoading(true);
          try {
            const res = await authApi.googleLogin(idToken);
            if (res.data && res.data.user) {
              setUser(res.data.user);
              router.replace("/(tabs)");
            }
          } catch (error) {
            console.log("Google Signup Error (Silent):", error);
            Alert.alert("Signup Failed", "Google authentication with our server failed. Please try again.");
          } finally {
            setLoading(false);
          }
        } else {
          showToast("Google authentication failed. No token received.");
        }
      } else if (response?.type === "error") {
        showToast("Google signup failed.");
      }
    };

    handleGoogleResponse();
  }, [response]);

  const handleGoogleLogin = async () => {
    if (!request) {
      showToast("Google Login is not ready yet.");
      return;
    }
    promptAsync();
  };

  return (
    <View style={styles.container}>
      {/* Abstract Circles in Top Right */}
      <View style={styles.circleContainer}>
        <View style={[styles.circle, { width: 150, height: 150, borderColor: "rgba(255, 69, 0, 0.2)" }]} />
        <View style={[styles.circle, { width: 200, height: 200, borderColor: "rgba(255, 69, 0, 0.15)" }]} />
        <View style={[styles.circle, { width: 250, height: 250, borderColor: "rgba(255, 69, 0, 0.1)" }]} />
        <View style={[styles.circle, { width: 300, height: 300, borderColor: "rgba(255, 69, 0, 0.05)" }]} />
      </View>

      {/* Custom Error Toast */}
      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: toastY }] }]}>
          <LinearGradient
            colors={["#171717", "#0a0a0a"]}
            style={styles.toastGradient}
          >
            <AlertCircle size={18} color="#FF4500" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </LinearGradient>
        </Animated.View>
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join the community to save your movies and sync across devices.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#525252"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <User size={20} color="#525252" />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#525252"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Mail size={20} color="#525252" />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#525252"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#525252" /> : <Eye size={20} color="#525252" />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
                style={styles.registerButtonContainer}
              >
                <LinearGradient
                  colors={["#FF4500", "#FF8C00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.registerButton}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.registerButtonText}>Sign Up</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.socialContainer}>
              <Text style={styles.socialTitle}>OR CONTINUE WITH</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButtonFull}
                  onPress={handleGoogleLogin}
                  disabled={loading}
                >
                  <FontAwesome name="google" size={20} color="white" style={{ marginRight: 12 }} />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footer}>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerText}>
                    Already a member? <Text style={styles.footerTextBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 999,
    alignItems: "center",
  },
  toastGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 69, 0, 0.3)",
    shadowColor: "#FF4500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  toastText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  circleContainer: {
    position: "absolute",
    top: -80,
    right: -80,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 40,
    justifyContent: "center",
    paddingBottom: 40,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
  },
  subtitle: {
    color: "#737373",
    fontSize: 16,
    marginTop: 12,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputWrapper: {
    backgroundColor: "#171717",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    height: 24,
    padding: 0,
  },
  registerButtonContainer: {
    marginTop: 24,
  },
  registerButton: {
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  socialContainer: {
    alignItems: "center",
    marginTop: 48,
  },
  socialTitle: {
    color: "#525252",
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 24,
  },
  socialButtons: {
    flexDirection: "row",
    gap: 16,
  },
  socialButtonFull: {
    backgroundColor: "#171717",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  socialButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    color: "#737373",
    fontSize: 14,
  },
  footerTextBold: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
