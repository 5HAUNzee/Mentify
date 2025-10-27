// screens/ApprovalPendingScreen.js - FIXED UI
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

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
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#fef3c7", "#ffffff"]} style={styles.gradient}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Feather name="clock" size={56} color="#f59e0b" />
            </View>
          </View>

          {/* Message Card */}
          <View style={styles.messageCard}>
            <Text style={styles.title}>Approval Pending</Text>
            <Text style={styles.message}>
              Your registration is being reviewed by the admin.
            </Text>

            {/* Steps */}
            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={styles.stepIconCircle}>
                  <Feather name="check" size={12} color="#f59e0b" />
                </View>
                <Text style={styles.stepText}>Admin verification in progress</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepIconCircle}>
                  <Feather name="mail" size={12} color="#f59e0b" />
                </View>
                <Text style={styles.stepText}>notification on approval</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepIconCircle}>
                  <Feather name="unlock" size={12} color="#f59e0b" />
                </View>
                <Text style={styles.stepText}>Access within 1-2 business days</Text>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Feather name="log-out" size={18} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Support */}
          <View style={styles.support}>
            <Feather name="mail" size={14} color="#9ca3af" />
            <Text style={styles.supportText}>stud23.ssd1@gec.ac.in</Text>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fcd34d",
  },
  messageCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#fcd34d",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#d97706",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  stepIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  signOutButton: {
    flexDirection: "row",
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  support: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  supportText: {
    fontSize: 12,
    color: "#6b7280",
  },
});
