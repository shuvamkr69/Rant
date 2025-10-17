import { useEffect } from "react";
import {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

export const useScreenTransition = (isVisible: boolean) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Fade in
      opacity.value = withTiming(1, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });

      // Fade out after a brief moment
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, {
          duration: 300,
          easing: Easing.inOut(Easing.ease),
        });
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return { animatedStyle, opacity };
};
