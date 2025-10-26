import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@clerk/clerk-expo"; // ✅ for Clerk logout

const { width } = Dimensions.get("window");

const SuperAdminDashboard = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth(); // ✅ Clerk logout function

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalMentors: 0,
    collegeAdmins: 0,
    deptAdmins: 0,
    superAdmins: 0,
    pendingApprovals: 0,
    approvedUsers: 0,
    totalColleges: 0,
    uniqueColleges: 0,
    totalDepartments: 0,
    uniqueDepartments: 0,
    activeToday: 0,
    storageUsed: "0GB",
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [collegeDistribution, setCollegeDistribution] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      calculateUserStats(allUsers);
      const recentUsersData = allUsers
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
      setRecentUsers(recentUsersData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateUserStats = (users) => {
    const students = users.filter((user) => user.role === "mentee");
    const mentors = users.filter((user) => user.role === "mentor");
    const collegeAdmins = users.filter((user) => user.role === "collegeadmin");
    const deptAdmins = users.filter((user) => user.role === "deptadmin");
    const superAdmins = users.filter((user) => user.role === "superadmin");
    const pendingUsers = users.filter((user) => user.status === "pending");
    const approvedUsers = users.filter((user) => user.status === "approved");
    const colleges = [...new Set(users.map((u) => u.college).filter(Boolean))];
    const departments = [
      ...new Set(users.map((u) => u.department).filter(Boolean)),
    ];

    const collegeStats = {};
    users.forEach((user) => {
      if (user.college) {
        collegeStats[user.college] = (collegeStats[user.college] || 0) + 1;
      }
    });
    const collegeDistributionData = Object.entries(collegeStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setCollegeDistribution(collegeDistributionData);

    setStats({
      totalUsers: users.length,
      totalStudents: students.length,
      totalMentors: mentors.length,
      collegeAdmins: collegeAdmins.length,
      deptAdmins: deptAdmins.length,
      superAdmins: superAdmins.length,
      pendingApprovals: pendingUsers.length,
      approvedUsers: approvedUsers.length,
      totalColleges: colleges.length,
      uniqueColleges: colleges.length,
      totalDepartments: departments.length,
      uniqueDepartments: departments.length,
      activeToday: users.filter(
        (user) => user.createdAt >= new Date().setHours(0, 0, 0, 0)
      ).length,
      storageUsed: `${(0.5 + users.length * 0.001).toFixed(1)}GB`,
    });
  };

  useEffect(() => {
    fetchDashboardData();
    const usersQuery = query(collection(db, "users"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      calculateUserStats(usersData);
      const recentUsersData = usersData
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);
      setRecentUsers(recentUsersData);
    });
    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // ✅ Logout handler
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              navigation.replace("Auth"); // navigate to your login screen
            } catch (error) {
              console.error("Logout failed:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Header with Logout Button */}
        <LinearGradient
          colors={["#1a73e8", "#4285f4"]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Super Admin Dashboard</Text>
              <Text style={styles.subtitle}>
                {stats.totalUsers} users • {stats.uniqueColleges} colleges •{" "}
                {stats.activeToday} new today
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* rest of your sections stay unchanged */}
        {/* ... existing dashboard content ... */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 16, fontSize: 16, color: "#5f6368" },
  header: { paddingVertical: 30, paddingHorizontal: 24 },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: { fontSize: 16, color: "rgba(255,255,255,0.9)" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  notificationButton: { padding: 8 },
});

export default SuperAdminDashboard;
