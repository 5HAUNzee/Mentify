// screens/RejectedScreen.js - IMPROVED UI
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

export default function RejectedScreen({ navigation }) {
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
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#fef2f2", "#ffffff"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="x-circle" size={64} color="#ef4444" />
            </View>
          </View>

          {/* Message Card */}
          <View style={styles.messageCard}>
            <Text style={styles.title}>Registration Rejected</Text>
            <Text style={styles.message}>
              Your registration request was not approved by the admin.
            </Text>
            <View style={styles.infoBox}>
              <Feather name="info" size={16} color="#dc2626" />
              <Text style={styles.infoText}>
                Please contact your college or department admin for clarification and next steps.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.replace("Auth")}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Support */}
          <View style={styles.support}>
            <Feather name="help-circle" size={16} color="#6b7280" />
            <Text style={styles.supportText}>
              Need help? Contact support at support@gec.ac.in
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fecaca",
  },
  messageCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#991b1b",
    lineHeight: 18,
    fontWeight: "500",
  },
  actions: {
    width: "100%",
    maxWidth: 400,
    gap: 12,
    marginBottom: 24,
  },
  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  support: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  supportText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
});
