import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons: CustomAlertButton[];
  onDismiss?: () => void;
  cancelable?: boolean;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  icon,
  iconColor,
  buttons = [{ text: "OK", style: "default" }],
  onDismiss,
  cancelable = true,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleBackdropPress = () => {
    if (cancelable && onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (button: CustomAlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case "cancel":
        return styles.cancelButton;
      case "destructive":
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case "cancel":
        return styles.cancelButtonText;
      case "destructive":
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.backdrop,
              { opacity: opacityValue },
            ]}
          />
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.alertContainer,
                {
                  transform: [{ scale: scaleValue }],
                  opacity: opacityValue,
                },
              ]}
            >
              {/* Content Container with Blur Effect */}
              <View style={styles.contentWrapper}>
                {Platform.OS === "ios" ? (
                  <BlurView intensity={80} tint="dark" style={styles.blurView}>
                    <View style={styles.content}>
                      {icon && (
                        <View style={styles.iconContainer}>
                          <Ionicons
                            name={icon}
                            size={48}
                            color={iconColor || "#6b1fa8"}
                          />
                        </View>
                      )}
                      <Text style={styles.title}>{title}</Text>
                      {message && (
                        <Text style={styles.message}>{message}</Text>
                      )}
                    </View>
                  </BlurView>
                ) : (
                  <View style={[styles.content, styles.androidContent]}>
                    {icon && (
                      <View style={styles.iconContainer}>
                        <Ionicons
                          name={icon}
                          size={48}
                          color={iconColor || "#6b1fa8"}
                        />
                      </View>
                    )}
                    <Text style={styles.title}>{title}</Text>
                    {message && <Text style={styles.message}>{message}</Text>}
                  </View>
                )}

                {/* Buttons */}
                <View
                  style={[
                    styles.buttonContainer,
                    buttons.length > 2 && styles.verticalButtons,
                  ]}
                >
                  {buttons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        getButtonStyle(button.style),
                        buttons.length > 2 && styles.verticalButton,
                        index !== buttons.length - 1 &&
                          buttons.length <= 2 &&
                          styles.buttonMargin,
                      ]}
                      onPress={() => handleButtonPress(button)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          getButtonTextStyle(button.style),
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  alertContainer: {
    width: width - 80,
    maxWidth: 340,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,
  },
  contentWrapper: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(107, 31, 168, 0.3)",
  },
  blurView: {
    borderRadius: 20,
    overflow: "hidden",
  },
  content: {
    padding: 24,
    alignItems: "center",
  },
  androidContent: {
    backgroundColor: "rgba(26, 26, 26, 0.98)",
  },
  iconContainer: {
    marginBottom: 16,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(107, 31, 168, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(107, 31, 168, 0.4)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(107, 31, 168, 0.3)",
    overflow: "hidden",
  },
  verticalButtons: {
    flexDirection: "column",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.5)",
  },
  verticalButton: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107, 31, 168, 0.2)",
  },
  buttonMargin: {
    borderRightWidth: 1,
    borderRightColor: "rgba(107, 31, 168, 0.3)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  defaultButton: {
    backgroundColor: "rgba(107, 31, 168, 0.15)",
  },
  defaultButtonText: {
    color: "#b388ff",
  },
  cancelButton: {
    backgroundColor: "rgba(26, 26, 26, 0.8)",
  },
  cancelButtonText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  destructiveButton: {
    backgroundColor: "rgba(244, 67, 54, 0.15)",
  },
  destructiveButtonText: {
    color: "#ff5252",
    fontWeight: "700",
  },
});

// Hook for easy usage
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    buttons: CustomAlertButton[];
    cancelable?: boolean;
  }>({
    visible: false,
    title: "",
    buttons: [],
  });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: CustomAlertButton[],
    options?: {
      icon?: keyof typeof Ionicons.glyphMap;
      iconColor?: string;
      cancelable?: boolean;
    }
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: "OK", style: "default" }],
      icon: options?.icon,
      iconColor: options?.iconColor,
      cancelable: options?.cancelable ?? true,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert {...alertConfig} onDismiss={hideAlert} />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
};
