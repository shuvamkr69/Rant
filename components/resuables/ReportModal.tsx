import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ReportModalProps {
  visible: boolean;
  listenerName: string;
  onClose: () => void;
  onSubmit: (reason: string, message: string) => Promise<void>;
}

const REPORT_REASONS = [
  {
    id: "inappropriate_behavior",
    label: "Inappropriate Behavior",
    icon: "warning-outline",
  },
  { id: "harassment", label: "Harassment", icon: "alert-circle-outline" },
  { id: "spam", label: "Spam", icon: "megaphone-outline" },
  { id: "fake_profile", label: "Fake Profile", icon: "person-remove-outline" },
  {
    id: "offensive_language",
    label: "Offensive Language",
    icon: "chatbubble-ellipses-outline",
  },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

export default function ReportModal({
  visible,
  listenerName,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = Colors;

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for reporting");
      return;
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please provide additional details");
      return;
    }

    if (message.length > 500) {
      Alert.alert("Error", "Message must be 500 characters or less");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(selectedReason, message.trim());
      // Reset form
      setSelectedReason("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setMessage("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="flag" size={24} color="#ff4444" />
              <Text style={[styles.title, { color: colors.text }]}>
                Report {listenerName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning Text */}
            <View
              style={[
                styles.warningBox,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <Ionicons
                name="information-circle"
                size={20}
                color="#2196F3"
                style={styles.warningIcon}
              />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Reports are reviewed by our team. False reports may result in
                account suspension.
              </Text>
            </View>

            {/* Reason Selection */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Reason for Report *
            </Text>
            <View style={styles.reasonsContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonButton,
                    {
                      backgroundColor:
                        selectedReason === reason.id
                          ? colors.tint + "20"
                          : colors.cardBackground,
                      borderColor:
                        selectedReason === reason.id
                          ? colors.tint
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                  disabled={isSubmitting}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={22}
                    color={
                      selectedReason === reason.id ? colors.tint : colors.icon
                    }
                  />
                  <Text
                    style={[
                      styles.reasonLabel,
                      {
                        color:
                          selectedReason === reason.id
                            ? colors.tint
                            : colors.text,
                      },
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.tint}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Message Input */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Additional Details *
            </Text>
            <TextInput
              style={[
                styles.messageInput,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Please provide more details about your report..."
              placeholderTextColor={colors.icon}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Text style={[styles.charCount, { color: colors.icon }]}>
              {message.length}/500 characters
            </Text>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: colors.cardBackground },
              ]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: isSubmitting ? colors.icon : "#ff4444",
                },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="flag" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  warningBox: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  warningIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  reasonsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 12,
    flex: 1,
  },
  checkIcon: {
    marginLeft: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    height: 120,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
