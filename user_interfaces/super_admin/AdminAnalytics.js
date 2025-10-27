// screens/AdminAnalytics.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");

export default function AdminAnalytics({ navigation }) {
  const { userId, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState({
    mentees: 0,
    mentors: 0,
    deptAdmins: 0,
    collegeAdmins: 0,
    superAdmins: 0,
    totalUsers: 0,
  });

  const [systemHealth, setSystemHealth] = useState({
    serverUptime: "99.9%",
    dbPerformance: "Excellent",
    activeSessions: 0,
    storageUsage: "67.3%",
  });

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const userDoc = await getDocs(
        query(collection(db, "users"), where("__name__", "==", userId))
      );

      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();

        if (userData.role === "superadmin") {
          setUserRole(userData.role);
          loadAnalytics();
        } else {
          navigation.replace("Unauthorized");
        }
      }
    } catch (error) {
      console.error("Error checking role:", error);
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const usersRef = collection(db, "users");

      const menteesCount = await getCountFromServer(
        query(usersRef, where("role", "==", "mentee"))
      );
      const mentorsCount = await getCountFromServer(
        query(usersRef, where("role", "==", "mentor"))
      );
      const deptAdminsCount = await getCountFromServer(
        query(usersRef, where("role", "==", "deptadmin"))
      );
      const collegeAdminsCount = await getCountFromServer(
        query(usersRef, where("role", "==", "collegeadmin"))
      );
      const superAdminsCount = await getCountFromServer(
        query(usersRef, where("role", "==", "superadmin"))
      );

      const totalCount =
        menteesCount.data().count +
        mentorsCount.data().count +
        deptAdminsCount.data().count +
        collegeAdminsCount.data().count +
        superAdminsCount.data().count;

      setStats({
        mentees: menteesCount.data().count,
        mentors: mentorsCount.data().count,
        deptAdmins: deptAdminsCount.data().count,
        collegeAdmins: collegeAdminsCount.data().count,
        superAdmins: superAdminsCount.data().count,
        totalUsers: totalCount,
      });

      const sessionsCount = await getCountFromServer(collection(db, "users"));
      setSystemHealth((prev) => ({
        ...prev,
        activeSessions: sessionsCount.data().count,
      }));

      setLoading(false);
    } catch (error) {
      console.error("Error loading analytics:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(); // Properly logs out Clerk user
            navigation.reset({
              index: 0,
              routes: [{ name: "Auth" }], // Redirect to Auth screen
            });
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Role Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>User Role Distribution</Text>

          <View style={styles.chartContainer}>
            <View style={styles.donutChart}>
              <View
                style={[
                  styles.donutSegment,
                  { backgroundColor: "#3b82f6", flex: stats.mentees },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  { backgroundColor: "#06b6d4", flex: stats.deptAdmins },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  { backgroundColor: "#ef4444", flex: stats.superAdmins },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  { backgroundColor: "#10b981", flex: stats.mentors },
                ]}
              />
              <View
                style={[
                  styles.donutSegment,
                  { backgroundColor: "#f59e0b", flex: stats.collegeAdmins },
                ]}
              />
            </View>
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#3b82f6" }]}
                />
                <Text style={styles.legendText}>Mentees: {stats.mentees}</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#10b981" }]}
                />
                <Text style={styles.legendText}>Mentors: {stats.mentors}</Text>
              </View>
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#06b6d4" }]}
                />
                <Text style={styles.legendText}>
                  Dept Admins: {stats.deptAdmins}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#f59e0b" }]}
                />
                <Text style={styles.legendText}>
                  College Admins: {stats.collegeAdmins}
                </Text>
              </View>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#ef4444" }]}
              />
              <Text style={styles.legendText}>
                Super Admins: {stats.superAdmins}
              </Text>
            </View>
          </View>
        </View>

        {/* System Health Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Health Overview</Text>

          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Server Uptime</Text>
            <Text style={styles.healthValue}>{systemHealth.serverUptime}</Text>
          </View>

          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Database Performance</Text>
            <Text style={[styles.healthValue, { color: "#10b981" }]}>
              {systemHealth.dbPerformance}
            </Text>
          </View>

          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Active Sessions</Text>
            <Text style={styles.healthValue}>
              {systemHealth.activeSessions}
            </Text>
          </View>

          <View style={styles.healthItem}>
            <Text style={styles.healthLabel}>Storage Usage</Text>
            <Text style={styles.healthValue}>{systemHealth.storageUsage}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("SuperAdminDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("UserManagement")}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CollegeManagement")}
        >
          <Feather name="grid" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Colleges</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("ApprovalRequests")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("AdminAnalytics")}
        >
          <Feather name="bar-chart-2" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, { color: "#2563eb" }]}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  logoutBtn: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  donutChart: {
    width: 150,
    height: 150,
    borderRadius: 75,
    flexDirection: "row",
    overflow: "hidden",
    transform: [{ rotate: "-90deg" }],
  },
  donutSegment: {
    height: "100%",
  },
  legendContainer: {
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#6b7280",
  },
  healthItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  healthLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  healthValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
});
