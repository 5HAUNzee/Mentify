import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useAuth } from "@clerk/clerk-expo";

const CollegeDashboard = ({ navigation }) => {
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    try {
      await signOut(); // Sign out the user
      navigation.replace("Auth"); // Navigate back to Auth screen
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };
  return (
    <View>
      <Text>CollegeDashboard</Text>
      <TouchableOpacity
        onPress={handleSignOut}
        style={{
          backgroundColor: "#2563EB",
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 10,
        }}
      >
        <Text>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CollegeDashboard;
