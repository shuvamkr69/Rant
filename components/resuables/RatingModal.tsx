import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface RatingModalProps {
  visible: boolean;
  listenerName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export default function RatingModal({
  visible,
  listenerName,
  onClose,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = () => {
    if (rating === 0) {
      return;
    }
    onSubmit(rating, comment);
    // Reset state
    setRating(0);
    setComment("");
    setHoveredStar(0);
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    setHoveredStar(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="star" size={32} color="#FFD700" />
            <Text style={styles.title}>Rate Your Session</Text>
          </View>

          {/* Listener Name */}
          <Text style={styles.listenerName}>
            How was your session with {listenerName}?
          </Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                onPressIn={() => setHoveredStar(star)}
                onPressOut={() => setHoveredStar(0)}
                style={styles.starButton}
              >
                <Ionicons
                  name={
                    star <= (hoveredStar || rating) ? "star" : "star-outline"
                  }
                  size={40}
                  color={star <= (hoveredStar || rating) ? "#FFD700" : "#666"}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Rating Text */}
          <Text style={styles.ratingText}>
            {rating === 0
              ? "Tap to rate"
              : rating === 1
              ? "Poor"
              : rating === 2
              ? "Fair"
              : rating === 3
              ? "Good"
              : rating === 4
              ? "Very Good"
              : "Excellent"}
          </Text>

          {/* Comment Input */}
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment (optional)"
            placeholderTextColor="#888"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
          />

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                rating === 0 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={rating === 0}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  rating === 0 && styles.submitButtonTextDisabled,
                ]}
              >
                Submit Rating
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Your rating helps improve the listener's profile
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  listenerName: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 25,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 20,
    minHeight: 25,
  },
  commentInput: {
    backgroundColor: "#222",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
  cancelButtonText: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2A2A2A",
  },
  submitButtonDisabled: {
    backgroundColor: "#444",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonTextDisabled: {
    color: "#888",
  },
  infoText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginTop: 15,
    fontStyle: "italic",
  },
});
