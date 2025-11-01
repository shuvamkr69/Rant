import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PickerComponentProps {
  label: React.ReactNode;
  selectedValue: string;
  options: string[];
  onValueChange: (value: string) => void;
  icon?: React.ReactNode;
  defaultToAny?: boolean;
  disabled?: boolean;
  onDisabledPress?: () => void;
}

const PickerComponent: React.FC<PickerComponentProps> = ({
  label,
  selectedValue,
  options,
  onValueChange,
  icon,
  defaultToAny = false,
  disabled = false,
  onDisabledPress,
}) => {
  const [modalVisible, setModalVisible] = React.useState(false);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={{ marginBottom: 18 }}>
      <TouchableOpacity
        style={styles.pickerRow}
        onPress={() => {
          if (disabled) {
            onDisabledPress && onDisabledPress();
          } else {
            setModalVisible(true);
          }
        }}
        activeOpacity={0.95}
      >
        <View style={styles.labelRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {typeof label === "string" ? (
            <Text style={styles.label}>{label}</Text>
          ) : (
            <View>{label}</View>
          )}
        </View>
        <View style={styles.selectedValueBox}>
          <Text style={styles.selectedValueText}>
            {selectedValue || (defaultToAny ? "Any" : "Not Set")}
          </Text>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>{label}</Text>
            <View style={styles.bubbleContainer}>
              {options.map((option) => {
                const isSelected = selectedValue === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={styles.bubbleTouchable}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.85}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={["#7c3aed", "#9333ea", "#a855f7"]}
                        style={styles.bubbleGradientBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.bubble}>
                          <Text
                            style={[styles.bubbleText, { color: "#FFFFFF" }]}
                          >
                            {option}
                          </Text>
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.bubble, styles.bubbleUnselected]}>
                        <Text style={[styles.bubbleText, { color: "#c4b5fd" }]}>
                          {option}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: "#e9d5ff",
  },
  iconContainer: {
    marginRight: 8,
  },
  selectedValueBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  selectedValueText: {
    fontSize: 14,
    color: "#ffffff",
    marginRight: 10,
  },
  arrow: {
    fontSize: 10,
    color: "#c4b5fd",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(26, 0, 51, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d0a4e",
    borderRadius: 18,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  modalLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 18,
  },
  bubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  bubbleTouchable: {
    marginRight: 8,
    marginBottom: 8,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a0033",
  },
  bubbleGradientBorder: {
    borderRadius: 20,
    padding: 2,
  },
  bubbleUnselected: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  bubbleText: {
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default PickerComponent;
