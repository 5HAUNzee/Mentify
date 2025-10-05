import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function RejectedScreen({ navigation }) {
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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
        Registration Rejected
      </Text>
      <Text style={{ textAlign: "center", marginBottom: 20 }}>
        Your registration request was rejected by the admin.
        {"\n"}Please contact your college or department admin for clarification.
      </Text>
       <TouchableOpacity  onPress={handleSignOut}  style={{ backgroundColor: "#2563EB", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}><Text>Sign out</Text></TouchableOpacity>
    </View>
  );
}
