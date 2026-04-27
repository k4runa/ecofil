import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert
} from 'react-native';
import { X, Check, PlusCircle, Link as LinkIcon } from 'lucide-react-native';
import { usersApi, authApi } from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import * as SecureStore from 'expo-secure-store';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const user = useAuthStore((state: any) => state.user);
  const setUser = useAuthStore((state: any) => state.setUser);

  const [editFullName, setEditFullName] = useState(user?.full_name || "");
  const [editUsername, setEditUsername] = useState(user?.username || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editSocials, setEditSocials] = useState<Record<string, string>>(user?.social_links || {});
  
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setEditFullName(user.full_name || "");
      setEditUsername(user.username || "");
      setEditBio(user.bio || "");
      setEditSocials(user.social_links || {});
      setIsAddingSocial(false);
      setNewSocialUrl("");
    }
  }, [visible, user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      await usersApi.updateProfile({
        full_name: editFullName,
        bio: editBio,
        social_links: editSocials
      });

      if (editUsername !== user?.username) {
        const userRes = await usersApi.updateField("username", editUsername);
        if (userRes.data?.new_token) {
          await SecureStore.setItemAsync('userToken', userRes.data.new_token);
        }
      }

      const meRes = await authApi.getMe();
      setUser(meRes.data.data.user);
      onClose();
      Alert.alert("Done", "Profile updated.");
    } catch (e: any) {
      const detail = e.response?.data?.detail || "Could not update profile. Try again.";
      Alert.alert("Error", detail);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSocial = () => {
    if (newSocialUrl) {
      const url = newSocialUrl.toLowerCase();
      const platform = url.includes("instagram") ? "instagram" :
        url.includes("twitter") ? "twitter" :
          url.includes("letterboxd") ? "letterboxd" :
            url.includes("imdb") ? "imdb" : "link";

      let key = platform;
      let counter = 1;
      while (editSocials[key]) {
        key = `${platform}_${counter}`;
        counter++;
      }

      setEditSocials({ ...editSocials, [key]: newSocialUrl });
      setNewSocialUrl("");
      setIsAddingSocial(false);
    } else {
      setIsAddingSocial(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#525252" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Your real name"
                placeholderTextColor="#525252"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.input}
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="username"
                placeholderTextColor="#525252"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="A short bio"
                placeholderTextColor="#525252"
                multiline
              />
            </View>

            <View style={styles.socialEditSection}>
              <Text style={styles.inputLabel}>Social Links</Text>
              {Object.entries(editSocials).map(([platform, url]) => (
                <View key={platform} style={styles.socialInputRow}>
                  <View style={styles.socialPlatformLabel}>
                    <LinkIcon size={14} color="#525252" style={{ marginRight: 8 }} />
                    <Text style={styles.socialPlatformText}>{platform}</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={url}
                    onChangeText={(text) => setEditSocials({ ...editSocials, [platform]: text })}
                    placeholder="URL"
                    placeholderTextColor="#525252"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const next = { ...editSocials };
                      delete next[platform];
                      setEditSocials(next);
                    }}
                    style={styles.removeSocialBtn}
                  >
                    <X size={16} color="#FF4500" />
                  </TouchableOpacity>
                </View>
              ))}

              {isAddingSocial ? (
                <View style={styles.socialInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={newSocialUrl}
                    onChangeText={setNewSocialUrl}
                    placeholder="Enter social profile URL"
                    placeholderTextColor="#525252"
                    autoFocus
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={handleAddSocial}
                    style={styles.addLinkConfirmBtn}
                  >
                    <Check size={20} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsAddingSocial(false)}
                    style={styles.addLinkConfirmBtn}
                  >
                    <X size={20} color="#525252" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addSocialButton}
                  onPress={() => setIsAddingSocial(true)}
                >
                  <PlusCircle size={14} color="#FF4500" style={{ marginRight: 8 }} />
                  <Text style={styles.addSocialText}>Add social link</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Apply Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111111",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    padding: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  modalTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#737373",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: "#050505",
    borderRadius: 10,
    padding: 18,
    color: "white",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  socialEditSection: {
    marginTop: 10,
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  socialPlatformLabel: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  socialPlatformText: {
    color: '#a3a3a3',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  removeSocialBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 69, 0, 0.05)',
    borderRadius: 10,
  },
  addLinkConfirmBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
  },
  addSocialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 69, 0, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.1)',
  },
  addSocialText: {
    color: '#FF4500',
    fontSize: 13,
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: "#FF4500",
    borderRadius: 10,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#FF4500",
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
