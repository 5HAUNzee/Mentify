import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const onboardingSlides = [
  {
    icon: "account-group",
    title: "Connect with Mentors",
    description:
      "Get personalized guidance from experienced mentors in your field",
    color: "#3B82F6",
  },
  {
    icon: "chart-line",
    title: "Track Your Progress",
    description: "Monitor your academic journey with detailed analytics",
    color: "#10B981",
  },
  {
    icon: "file-document-edit",
    title: "Easy Semester Forms",
    description: "Submit and manage semester forms with deadline tracking",
    color: "#8B5CF6",
  },
];

export default function On1({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = onboardingSlides[currentSlide];

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

  return (
    <View className="flex-1 bg-blue-900">
      {/* Skip Button - Top Right */}
      {!isLastSlide && (
        <TouchableOpacity
          onPress={handleNavigateToAuth}
          className="absolute top-16 right-6 z-10 px-4 py-2"
        >
          <Text className="text-gray-300 text-base font-medium">Skip</Text>
        </TouchableOpacity>
      )}

      {/* Main Content */}
      <View className="flex-1 px-6 justify-center">
        {/* Icon Container */}
        <View
          className="w-32 h-32 rounded-3xl items-center justify-center self-center mb-12"
          style={{ backgroundColor: `${slide.color}25` }}
        >
          <MaterialCommunityIcons name={slide.icon} size={48} color={"white"} />
        </View>

        {/* Title */}
        <Text className="text-4xl font-bold text-white text-center mb-6">
          {slide.title}
        </Text>

        {/* Description */}
        <Text className="text-lg text-gray-200 text-center leading-7 px-2">
          {slide.description}
        </Text>

        {/* Dots Indicator */}
        <View className="flex-row justify-center gap-3 mt-16">
          {onboardingSlides.map((_, index) => (
            <View
              key={index}
              className={`w-2.5 h-2.5 rounded-full ${
                index === currentSlide ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View className="px-6 pb-12 pt-4">
        {/* Navigation Buttons */}
        <View className="flex-row justify-between items-center mb-8">
          {/* Back Button - Only show if not first slide */}
          {currentSlide > 0 ? (
            <TouchableOpacity
              onPress={prevSlide}
              className="p-4 rounded-full bg-white/20"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          ) : (
            <View className="w-12" /> // Spacer for alignment
          )}

          {/* Next/Get Started Button */}
          {!isLastSlide ? (
            <TouchableOpacity
              onPress={nextSlide}
              className="p-4 rounded-full bg-white/20"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          ) : (
            <View className="flex-1 items-center">
              <TouchableOpacity
                onPress={handleNavigateToAuth}
                className="bg-white px-16 py-5 rounded-2xl shadow-lg shadow-black/25 w-full max-w-xs"
              >
                <Text className="text-blue-900 text-lg font-semibold text-center">
                  Get Started
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Login Option - Only show on last slide */}
        {isLastSlide && (
          <TouchableOpacity
            onPress={handleNavigateToAuth}
            className="py-4 rounded-2xl items-center"
          >
          
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
