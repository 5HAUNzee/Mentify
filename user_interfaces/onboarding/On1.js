import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const onboardingSlides = [
  {
    icon: 'account-group',
    title: 'Connect with Mentors',
    description: 'Get personalized guidance from experienced mentors in your field',
    color: '#3B82F6'
  },
  {
    icon: 'chart-line',
    title: 'Track Your Progress',
    description: 'Monitor your academic journey with detailed analytics',
    color: '#10B981'
  },
  {
    icon: 'file-document-edit',
    title: 'Easy Semester Forms',
    description: 'Submit and manage semester forms with deadline tracking',
    color: '#8B5CF6'
  }
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
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  return (
    <View className="flex-1 bg-blue-900">
      {/* Header */}
      <View className="pt-16 pb-8 items-center">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="school" size={32} color="white" />
          <Text className="text-3xl font-bold text-white ml-2">Mentify</Text>
        </View>
        <Text className="text-gray-200 mt-2 text-base">Educational Management Platform</Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 justify-center">
        {/* Icon Container */}
        <View 
          className="w-24 h-24 rounded-full items-center justify-center self-center mb-8"
          style={{ backgroundColor: `${slide.color}15` }}
        >
          <MaterialCommunityIcons 
            name={slide.icon} 
            size={40} 
            color={"white"}
          />
        </View>
        
        {/* Title */}
        <Text className="text-3xl font-bold text-white text-center mb-4">
          {slide.title}
        </Text>
        
        {/* Description */}
        <Text className="text-lg text-gray-200 text-center leading-7 px-4">
          {slide.description}
        </Text>
        
        {/* Dots Indicator */}
        <View className="flex-row justify-center gap-3 mt-12">
          {onboardingSlides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-gray-400'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Bottom Section */}
      <View className="px-6 pb-8">
        {/* Navigation Buttons */}
        <View className="flex-row justify-between mb-8">
          {/* Back Button */}
          <TouchableOpacity
            onPress={prevSlide}
            disabled={currentSlide === 0}
            className={`p-4 rounded-full ${
              currentSlide === 0 ? 'opacity-30' : 'bg-white/20'
            }`}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>

          {/* Next Button */}
          <TouchableOpacity
            onPress={nextSlide}
            className="p-4 bg-white/20 rounded-full"
          >
            <MaterialCommunityIcons 
              name={currentSlide === onboardingSlides.length - 1 ? "check" : "chevron-right"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          {/* Get Started Button */}
          <TouchableOpacity
            onPress={handleNavigateToAuth}
            className="bg-white py-5 rounded-2xl items-center shadow-lg shadow-black/25"
          >
            <Text className="text-blue-900 text-lg font-semibold">
              Get Started
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleNavigateToAuth}
            className="py-5 rounded-2xl items-center border border-white/30"
          >
            <Text className="text-white text-lg font-semibold">
              Already have an account? Log In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleNavigateToAuth}
          className="py-4 items-center"
        >
          <Text className="text-gray-300">
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}