import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";

const SuperAdminDashboard = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      navigation.replace("Auth"); // Replace with your actual Auth screen name
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Super Admin Dashboard</Text>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("MentorManagement")}
          >
            <Feather name="users" size={24} color="#2563EB" />
            <Text style={styles.cardText}>Manage Mentors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("StudentManagement")}
          >
            <Feather name="user" size={24} color="#2563EB" />
            <Text style={styles.cardText}>Manage Students</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("AttendanceReports")}
          >
            <Feather name="bar-chart-2" size={24} color="#2563EB" />
            <Text style={styles.cardText}>Attendance Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("SubjectManagement")}
          >
            <Feather name="book" size={24} color="#2563EB" />
            <Text style={styles.cardText}>Manage Subjects</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SuperAdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
