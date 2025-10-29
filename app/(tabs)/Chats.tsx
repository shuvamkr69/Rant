import { useChat } from "@/components/contexts/chatContext";
import { useTheme } from "@/components/contexts/ThemeContext";
import TopBar from "@/components/resuables/TopBar";
import { ChatsScreenSkeleton } from "@/components/skeletons";
import { Colors } from "@/constants/theme";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Chats = () => {
  const { matches, loadMatches, setCurrentChatUser } = useChat();
  const { colorScheme } = useTheme();
  const colors = Colors;
  const router = useRouter();
  const animatedPlayed = useRef(false);
  const isFocusedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);

  // Map of animated values per match id
  const animatedMapRef = useRef(new Map());

  const TOPBAR_COLOR = "#6b1fa8"; // keep same accent as TopBar

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      setIsLoading(true);
      loadMatches().finally(() => setIsLoading(false));
      return () => {
        isFocusedRef.current = false;
      };
    }, [])
  );

  const handleChatPress = (match: any) => {
    setCurrentChatUser(match);
    // @ts-ignore - Dynamic route navigation
    router.push(`/ChatScreen?userId=${match._id}&name=${match.name}`);
  };

  const handleProfilePress = (match: any) => {
    // @ts-ignore - Dynamic route navigation
    router.push(`/ViewOtherProfile?userId=${match._id}`);
  };

  // Ensure animated values exist for each match
  const ensureAnimatedValues = (list: any[]) => {
    list.forEach((m, index) => {
      if (!animatedMapRef.current.has(m._id)) {
        const translate = new Animated.Value(-18);
        const opacity = new Animated.Value(0);
        animatedMapRef.current.set(m._id, { translate, opacity });
      }
    });
  };

  // start staggered spring animation once per app session when screen first populated
  useEffect(() => {
    if (!isFocusedRef.current) return;
    if (matches.length === 0) return;
    ensureAnimatedValues(matches);

    if (animatedPlayed.current) return;

    const animations: Animated.CompositeAnimation[] = matches.map((m, i) => {
      const vals = animatedMapRef.current.get(m._id);
      return Animated.parallel([
        Animated.spring(vals.translate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 8,
        }),
        Animated.timing(vals.opacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]);
    });

    // stagger them so cards spring down one after another
    Animated.stagger(80, animations).start(() => {
      animatedPlayed.current = true;
    });
  }, [matches]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <TopBar />
      {isLoading ? (
        <ChatsScreenSkeleton />
      ) : (
        <View style={styles.chatsContainer}>
          <View style={styles.cardsContainer}>
            <Text style={[styles.headingText, { color: colors.text }]}>
              Chats
            </Text>

            {matches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../../assets/images/icons/404.png")}
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No listeners matched yet. Explore and connect with listeners
                  to start ranting!
                </Text>
              </View>
            ) : (
              <FlatList
                data={matches}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => {
                  // ensure animated values exist
                  if (!animatedMapRef.current.has(item._id)) {
                    const translate = new Animated.Value(-18);
                    const opacity = new Animated.Value(0);
                    animatedMapRef.current.set(item._id, {
                      translate,
                      opacity,
                    });
                  }

                  const anim = animatedMapRef.current.get(item._id);

                  return (
                    <Animated.View
                      style={{
                        transform: [{ translateY: anim?.translate || 0 }],
                        opacity: anim?.opacity || 1,
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.card,
                          {
                            backgroundColor: "#1b1226",
                            borderColor: TOPBAR_COLOR,
                          },
                        ]}
                        onPress={() => handleChatPress(item)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.cardContent}>
                          <TouchableOpacity
                            onPress={() => handleProfilePress(item)}
                            activeOpacity={0.7}
                          >
                            {(item as any).profileImage ? (
                              <Image
                                source={{ uri: (item as any).profileImage }}
                                style={styles.avatarImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.avatar,
                                  { backgroundColor: colors.tint },
                                ]}
                              >
                                <Text style={styles.avatarText}>
                                  {item.name?.charAt(0).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>

                          <View style={styles.chatInfo}>
                            <Text
                              style={[styles.chatName, { color: colors.text }]}
                            >
                              {item.name}
                            </Text>
                            <Text
                              style={[styles.chatType, { color: colors.icon }]}
                            >
                              {item.userType}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.arrow, { color: colors.icon }]}>
                          ›
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                }}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatsContainer: {
    flex: 1,
    width: "100%",
  },
  cardsContainer: {
    flex: 1,
    width: "100%",
    marginTop: 30,
  },
  headingText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    marginLeft: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 150,
    height: 150,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginVertical: 6,
    // nicer shadow / elevation
    shadowColor: "#6b1fa8",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
    backgroundColor: "#ddd",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  chatType: {
    fontSize: 14,
  },
  arrow: {
    fontSize: 30,
    fontWeight: "300",
  },
});

export default Chats;
