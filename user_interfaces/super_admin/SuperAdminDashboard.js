// screens/SuperAdminDashboard.js - WITH MONTHLY GRAPH & RECENT USERS
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth, useClerk } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");

export default function SuperAdminDashboard({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeColleges: 0,
    departments: 0,
    pendingRequests: 0,
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists() && userDoc.data().role === "superadmin") {
        loadDashboard();
      } else {
        navigation.replace("Unauthorized");
      }
    } catch (error) {
      console.error("Access check error:", error);
    }
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Fetch all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate total users
      const totalUsers = users.length;

      // Count unique colleges
      const colleges = new Set(users.map(u => u.college).filter(Boolean));
      const activeColleges = colleges.size;

      // Count unique departments
      const departments = new Set(users.map(u => u.department).filter(Boolean));
      const departmentsCount = departments.size;

      // Count pending users
      const pendingRequests = users.filter(u => u.status === "pending").length;

      setStats({
        totalUsers,
        activeColleges,
        departments: departmentsCount,
        pendingRequests,
      });

      // Calculate monthly user signups (last 6 months)
      const now = new Date();
      const monthlyStats = {};
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        monthlyStats[monthKey] = 0;
      }

      users.forEach(user => {
        if (user.createdAt) {
          const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
          const monthKey = date.toLocaleString('default', { month: 'short' });
          if (monthlyStats[monthKey] !== undefined) {
            monthlyStats[monthKey]++;
          }
        }
      });

      const monthlyArray = Object.entries(monthlyStats).map(([month, count]) => ({
        month,
        count,
      }));

      setMonthlyData(monthlyArray);

      // Get 5 most recent users
      const sortedUsers = users
        .filter(u => u.createdAt)
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 5);

      setRecentUsers(sortedUsers);

      setLoading(false);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              navigation.replace("Auth");
            } catch (error) {
              console.error("Sign-out error:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxCount = Math.max(...monthlyData.map(d => d.count), 1);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Super Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
              <Feather name="users" size={24} color="#2563eb" />
            </View>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#d1fae5" }]}>
              <Feather name="briefcase" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{stats.activeColleges}</Text>
            <Text style={styles.statLabel}>Active Colleges</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Feather name="layers" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{stats.departments}</Text>
            <Text style={styles.statLabel}>Departments</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#fee2e2" }]}>
              <Feather name="alert-circle" size={24} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>{stats.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
        </View>

        {/* Monthly Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="trending-up" size={20} color="#111827" />
            <Text style={styles.cardTitle}>Monthly New User Sign-ups</Text>
          </View>
          <View style={styles.chartContainer}>
            {monthlyData.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <Text style={styles.barValue}>{item.count}</Text>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: "#3b82f6",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Registrations */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recent Registrations</Text>
          {recentUsers.length === 0 ? (
            <Text style={styles.emptyText}>No recent registrations</Text>
          ) : (
            recentUsers.map((user, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <View style={styles.activityAvatar}>
                    <Text style={styles.activityInitial}>
                      {user.firstName?.[0] || "U"}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.activityText}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.activityEmail}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.activityBadge}>
                  <Text style={styles.activityBadgeText}>
                    {user.role || "user"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation - ORIGINAL */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("SuperAdminDashboard")}
        >
          <Feather name="home" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, { color: "#2563eb" }]}>Dashboard</Text>
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
          <Feather name="bar-chart-2" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Analytics</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6b7280" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  logoutBtn: { fontSize: 14, fontWeight: "500", color: "#2563eb" },
  content: { flex: 1, padding: 16 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, color: "#6b7280" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 180,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  barWrapper: {
    width: "70%",
    height: 140,
    justifyContent: "flex-end",
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 6,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
  },
  activityText: { fontSize: 14, color: "#111827", marginBottom: 2, fontWeight: "500" },
  activityEmail: { fontSize: 12, color: "#6b7280" },
  activityBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityBadgeText: { fontSize: 11, color: "#2563eb", fontWeight: "600", textTransform: "capitalize" },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: { flex: 1, alignItems: "center", paddingVertical: 8 },
  navLabel: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
});
