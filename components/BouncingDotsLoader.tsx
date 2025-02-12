import Colors from "@/constants/Colors";
import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

const BouncingDotsLoader: React.FC = () => {
  // Create animated values for each dot
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Bounce animation: moves dot up then back to original position.
  const bounce = (animation: Animated.Value) =>
    Animated.sequence([
      Animated.timing(animation, {
        toValue: -5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

  useEffect(() => {
    // Start a loop that staggers the bounce for each dot
    Animated.loop(
      Animated.stagger(150, [
        bounce(dot1Anim),
        bounce(dot2Anim),
        bounce(dot3Anim),
      ])
    ).start();
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          { transform: [{ translateY: dot1Anim }] },
          { backgroundColor: Colors.accent2 },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { transform: [{ translateY: dot2Anim }] },
          { backgroundColor: Colors.secondary },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { transform: [{ translateY: dot3Anim }] },
          { backgroundColor: Colors.accent },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
});

export default BouncingDotsLoader;
