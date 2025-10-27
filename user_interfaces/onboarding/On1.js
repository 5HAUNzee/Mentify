import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

const onboardingSlides = [
  {
    icon: "account-group",
    title: "Connect with Mentors",
    description:
      "Get personalized guidance from experienced mentors in your field.",
    lightColor: "#3B82F6",
    darkColor: "#60A5FA",
    gradient: ["#3B82F6", "#60A5FA"],
  },
  {
    icon: "chart-line",
    title: "Track Your Progress",
    description: "Monitor your academic journey with detailed analytics.",
    lightColor: "#3B82F6",
    darkColor: "#60A5FA",
    gradient: ["#3B82F6", "#60A5FA"],
  },
  {
    icon: "file-document-edit",
    title: "Easy Semester Forms",
    description: "Submit and manage semester forms with deadline tracking.",
    lightColor: "#3B82F6",
    darkColor: "#60A5FA",
    gradient: ["#3B82F6", "#60A5FA"],
  },
];

export default function On1({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const slide = onboardingSlides[currentSlide];
  const currentColor = isDark ? slide.darkColor : slide.lightColor;

  const handleNavigateToAuth = () => {
    navigation.navigate("Auth");
  };

  const nextSlide = () => {
    if (currentSlide === onboardingSlides.length - 1) {
      handleNavigateToAuth();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const isLastSlide = currentSlide === onboardingSlides.length - 1;

  // Theme colors - More blue focused
  const backgroundColor = isDark ? '#1e40af' : '#1e40af';
  const cardBackground = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)';
  const textColor = isDark ? '#f8fafc' : '#f8fafc';
  const secondaryTextColor = isDark ? '#e2e8f0' : '#e2e8f0';
  const buttonBackground = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.8)';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1e40af' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      {/* Main Container with Same Gradient as Auth Screen */}
      <View style={{ flex: 1 }}>
        {/* Same Gradient Background as Auth Screen */}
        <LinearGradient
          colors={["#1e40af", "#3b82f6", "#60a5fa"]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Skip Button - Top Right */}
        {!isLastSlide && (
          <TouchableOpacity
            onPress={handleNavigateToAuth}
            activeOpacity={0.7}
            style={{
              position: "absolute",
              top: height * 0.06,
              right: 24,
              zIndex: 10,
              paddingVertical: 12,
              paddingHorizontal: 20,
              backgroundColor: buttonBackground,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
            }}
          >
            <Text style={{
              color: '#f8fafc',
              fontSize: 16,
              fontWeight: "600"
            }}>
              Skip
            </Text>
          </TouchableOpacity>
        )}

        {/* Main Content */}
        <View style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 32,
          marginTop: height * 0.1
        }}>
          {/* Icon Card */}
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 40,
              alignSelf: "center",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: cardBackground,
              marginBottom: 52,
              borderWidth: 2,
              borderColor,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              overflow: 'hidden',
            }}
          >
            {/* Icon Gradient Background */}
            <LinearGradient
              colors={slide.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.9,
              }}
            />
            <MaterialCommunityIcons
              name={slide.icon}
              size={64}
              color={"white"}
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: textColor,
              textAlign: "center",
              marginBottom: 16,
              letterSpacing: 0.5,
            }}
          >
            {slide.title}
          </Text>

          {/* Description */}
          <Text
            style={{
              fontSize: 18,
              color: secondaryTextColor,
              textAlign: "center",
              lineHeight: 28,
              marginBottom: height * 0.08,
              paddingHorizontal: 16,
            }}
          >
            {slide.description}
          </Text>

          {/* Dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: height * 0.1,
              gap: 10,
            }}
          >
            {onboardingSlides.map((_, index) => (
              <View
                key={index}
                style={{
                  width: index === currentSlide ? 24 : 12,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentSlide ?
                    '#ffffff' :
                    "rgba(255,255,255,0.6)",
                  transition: "0.3s",
                }}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: height * 0.08,
              paddingHorizontal: 20,
            }}
          >
            {/* Back Button */}
            {currentSlide > 0 ? (
              <TouchableOpacity
                onPress={prevSlide}
                activeOpacity={0.8}
                style={{
                  backgroundColor: buttonBackground,
                  padding: 16,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={28}
                  color={'#ffffff'}
                />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 60 }} />
            )}

            {/* Next / Get Started Button */}
            {!isLastSlide ? (
              <TouchableOpacity
                onPress={nextSlide}
                activeOpacity={0.8}
                style={{
                  backgroundColor: buttonBackground,
                  padding: 16,
                  borderRadius: 50,
                  borderWidth: 1,
                  borderColor,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={28}
                  color={'#ffffff'}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleNavigateToAuth}
                activeOpacity={0.9}
                style={{
                  backgroundColor: '#ffffff',
                  paddingVertical: 18,
                  paddingHorizontal: 48,
                  borderRadius: 25,
                  alignSelf: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.5)',
                }}
              >
                <Text
                  style={{
                    color: '#1e40af',
                    fontSize: 18,
                    fontWeight: "bold",
                    textAlign: "center",
                    letterSpacing: 0.5,
                  }}
                >
                  Get Started
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: height * 0.05 }} />
      </View>
    </SafeAreaView>
  );
}