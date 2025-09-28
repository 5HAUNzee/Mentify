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

export default function On1({ onGetStarted, onLogin }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = onboardingSlides[currentSlide];

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="pt-16 pb-8 items-center">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="school" size={32} color="#3B82F6" />
          <Text className="text-3xl font-bold text-slate-900 ml-2">Mentify</Text>
        </View>
        <Text className="text-slate-500 mt-2">Educational Management Platform</Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 justify-center">
        {/* Icon Circle */}
        <View 
          className="w-24 h-24 rounded-full items-center justify-center self-center mb-8"
          style={{ backgroundColor: `${slide.color}15` }}
        >
          <MaterialCommunityIcons 
            name={slide.icon} 
            size={40} 
            color={slide.color} 
          />
        </View>

        {/* Title & Description */}
        <Text className="text-3xl font-bold text-slate-900 text-center mb-4">
          {slide.title}
        </Text>
        <Text className="text-lg text-slate-600 text-center leading-7 px-4">
          {slide.description}
        </Text>

        {/* Slide Indicators */}
        <View className="flex-row justify-center gap-3 mt-12">
          {onboardingSlides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Bottom Section */}
      <View className="px-6 pb-8">
        {/* Navigation Buttons */}
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity
            onPress={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className={`p-4 rounded-full ${
              currentSlide === 0 ? 'opacity-30' : 'bg-slate-100'
            }`}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={24} 
              color={currentSlide === 0 ? '#9CA3AF' : '#4B5563'} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCurrentSlide(prev => 
              prev === onboardingSlides.length - 1 ? onGetStarted() : prev + 1
            )}
            className="p-4 bg-slate-100 rounded-full"
          >
            <MaterialCommunityIcons 
              name={currentSlide === onboardingSlides.length - 1 ? "check" : "chevron-right"} 
              size={24} 
              color="#4B5563" 
            />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4">
          <TouchableOpacity
            onPress={onGetStarted}
            className="bg-blue-600 py-5 rounded-2xl items-center shadow-lg shadow-blue-600/25"
          >
            <Text className="text-white text-lg font-semibold">
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onLogin}
            className="py-5 rounded-2xl items-center border border-slate-300"
          >
            <Text className="text-slate-700 text-lg font-semibold">
              Already have an account? Log In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip for now */}
        <TouchableOpacity
          onPress={onGetStarted}
          className="py-4 items-center"
        >
          <Text className="text-slate-500">
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}