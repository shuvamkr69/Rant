import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const GAME_WIDTH = SCREEN_WIDTH - 40;
const GAME_HEIGHT = 300;
const BALL_SIZE = 30;
const OBSTACLE_MIN_WIDTH = 15;
const OBSTACLE_MAX_WIDTH = 30;
const OBSTACLE_MIN_HEIGHT = 40;
const OBSTACLE_MAX_HEIGHT = 80;
const GROUND_HEIGHT = 50;
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const BASE_GAME_SPEED = 3;
const SPEED_INCREASE_RATE = 0.1;

const OBSTACLE_COLORS = ["#FF6B6B", "#FF8E53", "#FFA07A", "#FF5252", "#E74C3C"];
const OBSTACLE_SHAPES = ["rect", "tall", "short"] as const;

export default function BallGame() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(BASE_GAME_SPEED);
  const [obstacleWidth, setObstacleWidth] = useState(20);
  const [obstacleHeight, setObstacleHeight] = useState(60);
  const [obstacleColor, setObstacleColor] = useState(OBSTACLE_COLORS[0]);

  const ballY = useSharedValue(GAME_HEIGHT - GROUND_HEIGHT - BALL_SIZE);
  const ballVelocity = useSharedValue(0);
  const obstacleX = useSharedValue(GAME_WIDTH);
  const isJumping = useSharedValue(false);
  const gameLoop = useRef<number | null>(null);
  const currentObstacleWidth = useSharedValue(20);
  const currentObstacleHeight = useSharedValue(60);

  // Squish effect
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  const ballAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: ballY.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
      ],
    };
  });

  const obstacleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: obstacleX.value }],
    };
  });

  const checkCollision = () => {
    const ballBottom = ballY.value + BALL_SIZE;
    const ballLeft = 20;
    const ballRight = ballLeft + BALL_SIZE;

    const obstacleLeft = obstacleX.value;
    const obstacleRight = obstacleX.value + currentObstacleWidth.value;
    const obstacleTop =
      GAME_HEIGHT - GROUND_HEIGHT - currentObstacleHeight.value;

    // Check if ball and obstacle overlap
    if (
      ballRight > obstacleLeft &&
      ballLeft < obstacleRight &&
      ballBottom > obstacleTop
    ) {
      return true; // Collision detected
    }
    return false;
  };

  const generateNewObstacle = () => {
    // Randomize obstacle properties
    const shapes = OBSTACLE_SHAPES;
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    let width, height;
    switch (shape) {
      case "tall":
        width = OBSTACLE_MIN_WIDTH + Math.random() * 10;
        height = OBSTACLE_MAX_HEIGHT - 10 + Math.random() * 10;
        break;
      case "short":
        width = OBSTACLE_MAX_WIDTH - 10 + Math.random() * 10;
        height = OBSTACLE_MIN_HEIGHT + Math.random() * 10;
        break;
      default: // rect
        width =
          OBSTACLE_MIN_WIDTH +
          Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH);
        height =
          OBSTACLE_MIN_HEIGHT +
          Math.random() * (OBSTACLE_MAX_HEIGHT - OBSTACLE_MIN_HEIGHT);
    }

    setObstacleWidth(width);
    setObstacleHeight(height);
    currentObstacleWidth.value = width;
    currentObstacleHeight.value = height;
    setObstacleColor(
      OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)],
    );
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    if (gameLoop.current) {
      cancelAnimationFrame(gameLoop.current);
      gameLoop.current = null;
    }
  };

  const updateGame = () => {
    // Update ball physics
    ballVelocity.value += GRAVITY;
    const newY = ballY.value + ballVelocity.value;
    const groundLevel = GAME_HEIGHT - GROUND_HEIGHT - BALL_SIZE;

    if (newY >= groundLevel) {
      ballY.value = groundLevel;
      ballVelocity.value = 0;
      isJumping.value = false;

      // Subtle squish effect when landing
      scaleX.value = withSequence(
        withSpring(1.15, { damping: 12, stiffness: 180 }),
        withSpring(1, { damping: 10, stiffness: 160 }),
      );
      scaleY.value = withSequence(
        withSpring(0.85, { damping: 12, stiffness: 180 }),
        withSpring(1, { damping: 10, stiffness: 160 }),
      );
    } else {
      ballY.value = newY;

      // Subtle stretch while in air
      if (ballVelocity.value < 0) {
        // Going up - slight vertical stretch
        scaleX.value = withSpring(0.95, { damping: 18, stiffness: 200 });
        scaleY.value = withSpring(1.05, { damping: 18, stiffness: 200 });
      } else if (ballVelocity.value > 2) {
        // Falling down - slightly more vertical stretch
        scaleX.value = withSpring(0.93, { damping: 18, stiffness: 200 });
        scaleY.value = withSpring(1.07, { damping: 18, stiffness: 200 });
      }
    }

    // Update obstacle position
    obstacleX.value -= gameSpeed;

    // Reset obstacle when it goes off screen
    if (obstacleX.value < -obstacleWidth) {
      obstacleX.value = GAME_WIDTH;
      const newScore = score + 1;
      setScore(newScore);

      // Increase speed gradually
      setGameSpeed(BASE_GAME_SPEED + newScore * SPEED_INCREASE_RATE);

      // Generate new obstacle
      generateNewObstacle();
    }

    // Check collision
    if (checkCollision()) {
      endGame();
      return;
    }

    // Continue game loop
    if (gameStarted && !gameOver) {
      gameLoop.current = requestAnimationFrame(updateGame);
    }
  };

  const jump = () => {
    if (
      !isJumping.value &&
      gameStarted &&
      ballY.value >= GAME_HEIGHT - GROUND_HEIGHT - BALL_SIZE - 1
    ) {
      isJumping.value = true;
      ballVelocity.value = JUMP_VELOCITY;

      // Subtle squish effect when jumping
      scaleX.value = withSequence(
        withSpring(0.88, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
      scaleY.value = withSequence(
        withSpring(1.12, { damping: 15, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      );
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setGameSpeed(BASE_GAME_SPEED);
    ballY.value = GAME_HEIGHT - GROUND_HEIGHT - BALL_SIZE;
    ballVelocity.value = 0;
    obstacleX.value = GAME_WIDTH;
    isJumping.value = false;
    generateNewObstacle();
  };

  const resetGame = () => {
    if (gameLoop.current) {
      cancelAnimationFrame(gameLoop.current);
      gameLoop.current = null;
    }
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    ballY.value = GAME_HEIGHT - GROUND_HEIGHT - BALL_SIZE;
    ballVelocity.value = 0;
    obstacleX.value = GAME_WIDTH;
    isJumping.value = false;
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoop.current = requestAnimationFrame(updateGame);
    }

    return () => {
      if (gameLoop.current) {
        cancelAnimationFrame(gameLoop.current);
      }
    };
  }, [gameStarted, gameOver]);

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
      </View>

      <View style={styles.gameArea}>
        {/* Ball */}
        <Animated.View style={[styles.ball, ballAnimatedStyle]} />

        {/* Obstacle */}
        <Animated.View
          style={[
            styles.obstacle,
            obstacleAnimatedStyle,
            {
              width: obstacleWidth,
              height: obstacleHeight,
              backgroundColor: obstacleColor,
            },
          ]}
        />

        {/* Ground */}
        <View style={styles.ground} />

        {/* Start/Game Over Overlay */}
        {!gameStarted && (
          <TouchableOpacity
            style={styles.overlay}
            onPress={startGame}
            activeOpacity={0.9}
          >
            <Text style={styles.overlayTitle}>
              {gameOver ? "Game Over!" : "Ball Jump"}
            </Text>
            <Text style={styles.overlayText}>
              {gameOver ? `Score: ${score}` : "Tap to Start"}
            </Text>
            {gameOver && (
              <Text style={styles.overlaySubtext}>Tap to Play Again</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Jump Button - Always reserve space */}
      <View style={styles.buttonContainer}>
        {gameStarted && (
          <TouchableOpacity
            style={styles.jumpButton}
            onPress={jump}
            activeOpacity={0.6}
            delayPressIn={0}
            delayPressOut={0}
          >
            <Ionicons name="arrow-up" size={36} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: GAME_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreContainer: {
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  gameArea: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#1A1A1A",
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
  },
  ball: {
    position: "absolute",
    left: 20,
    width: BALL_SIZE,
    height: BALL_SIZE,
    borderRadius: BALL_SIZE / 2,
    backgroundColor: "#a566daff",
    shadowColor: "#a566daff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  obstacle: {
    position: "absolute",
    bottom: GROUND_HEIGHT,
    borderRadius: 5,
  },
  ground: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: GROUND_HEIGHT,
    backgroundColor: "#2A2A2A",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
  },
  overlayText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 5,
  },
  overlaySubtext: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 10,
  },
  jumpButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  jumpButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  buttonContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
});
