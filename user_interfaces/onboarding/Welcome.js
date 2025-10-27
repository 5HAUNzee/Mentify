import React, { useEffect, useState } from "react";
import { View, Text, Image, Dimensions, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function Welcome({ navigation }) {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress from 0 → 1
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      // After animation finishes, navigate to next screen
      setTimeout(() => navigation.navigate("On1"), 500);
    });
  }, [navigation]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const imageSize = Math.min(width * 0.45, height * 0.3);
  const borderRadius = imageSize * 0.25;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Same Blue Background Gradient as Auth Screen */}
      <LinearGradient
        colors={["#1e40af", "#3b82f6", "#60a5fa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />

      <View style={styles.container}>
        {/* Content */}
        <View style={styles.content}>
          {/* Logo with soft container */}
          <View
            style={[
              styles.imageContainer,
              {
                borderRadius: borderRadius * 1.3,
                padding: imageSize * 0.1,
              },
            ]}
          >
            <Image
              source={require("../../assets/icon.png")}
              style={[
                styles.appIcon,
                {
                  width: imageSize,
                  height: imageSize,
                  borderRadius,
                },
              ]}
            />
          </View>

          {/* App Name */}
          <Text style={styles.appName}>Mentify</Text>

          {/* Tagline */}
          <Text style={styles.tagline}>Educational Management Platform</Text>

          {/* Animated Progress Bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>

          {/* Loading Text */}
          <Text style={styles.loadingText}>Loading your experience...</Text>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#1e40af",
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  imageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  appIcon: {
    resizeMode: "contain",
  },
  appName: {
    fontSize: Math.min(width * 0.1, 48),
    fontWeight: "bold",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: Math.min(width * 0.045, 18),
    color: "rgba(255, 255, 255, 0.85)",
    marginBottom: 48,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    width: width * 0.7,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 3,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
  versionContainer: {
    position: "absolute",
    bottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
};