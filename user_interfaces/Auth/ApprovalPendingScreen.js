import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function ApprovalPendingScreen({ navigation }) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f0f4f8",
      }}
    >
      <View
        style={{
          width: "100%",
          padding: 30,
          backgroundColor: "#ffffff",
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
          alignItems: "center",
        }}
      >
        {/* Icon / Illustration */}
        <Text style={{ fontSize: 50, marginBottom: 20 }}>⏳</Text>

        {/* Title */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#1f2937",
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Registration Pending
        </Text>

        {/* Description */}
        <Text
          style={{
            fontSize: 16,
            color: "#6b7280",
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 22,
          }}
        >
          Your registration is awaiting admin approval. You'll be notified via
          email once the process is complete.
        </Text>

        {/* Steps */}
        <View style={{ alignSelf: "flex-start", marginBottom: 25 }}>
          <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
            • Admin will verify your credentials
          </Text>
          <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
            • You'll receive an email confirmation
          </Text>
          <Text style={{ fontSize: 14, color: "#6b7280" }}>
            • Access will be granted within 1-2 business days
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: "#2563EB",
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 12,
            shadowColor: "#2563EB",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
