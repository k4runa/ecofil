import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { X, Copy, Check, Share2 } from 'lucide-react-native';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL || 'https://ecofil.app';

interface ShareProfileModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
}

export default function ShareProfileModal({ visible, onClose, user }: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const profileUrl = `${APP_URL}/u/${user?.username}`;
    try {
      await Share.share({
        message: `Check out my profile: ${profileUrl}`,
        url: profileUrl,
      });
    } catch (_error) {
      // Share sheet dismissed
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`${APP_URL}/u/${user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { alignItems: 'center', backgroundColor: '#111' }]}>
          <View style={[styles.modalHeader, { width: '100%' }]}>
            <Text style={styles.modalTitle}>Share Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#525252" />
            </TouchableOpacity>
          </View>

          <View style={styles.qrContainer}>
            <QRCode
              value={`${APP_URL}/u/${user?.username}`}
              size={200}
              backgroundColor="white"
              color="black"
              quietZone={10}
            />
          </View>

          <Text style={styles.qrText}>Scan to view my collection</Text>

          <TouchableOpacity
            style={styles.copyLinkBtn}
            onPress={handleCopy}
          >
            {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} color="#FF4500" />}
            <Text style={[styles.copyLinkText, copied && { color: "#10B981" }]}>
              {copied ? "Link Copied" : `${APP_URL.replace('https://', '')}/u/${user?.username}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { width: '100%', marginTop: 20 }]}
            onPress={handleShare}
          >
            <Share2 size={18} color="white" style={{ marginRight: 10 }} />
            <Text style={styles.saveButtonText}>Share Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  qrContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 30,
    marginBottom: 20,
  },
  qrText: {
    color: "#525252",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 24,
  },
  copyLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  copyLinkText: {
    color: "#FF4500",
    fontSize: 13,
    fontWeight: "800",
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
