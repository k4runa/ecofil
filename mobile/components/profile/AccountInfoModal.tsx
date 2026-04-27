import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

interface AccountInfoModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
}

export default function AccountInfoModal({ visible, onClose, user }: AccountInfoModalProps) {
  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Account Security</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#525252" />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Internal ID</Text>
            <Text style={styles.infoValue}>#{user.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>VERIFIED</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session Started</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 20, backgroundColor: "#171717" }]}
            onPress={onClose}
          >
            <Text style={styles.saveButtonText}>Dismiss</Text>
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.02)",
  },
  infoLabel: {
    color: "#525252",
    fontSize: 14,
    fontWeight: "700",
  },
  infoValue: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activeText: {
    color: "#10B981",
    fontSize: 10,
    fontWeight: "900",
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
