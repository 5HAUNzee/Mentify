import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  doc,
  getDocs,
  collection,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function DeptDashboard({ navigation }) {
  const { signOut } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMentees: 0,
    activeMentors: 0,
    pendingApps: 0,
  });

  useEffect(() => {
    fetchPendingUsers();
    fetchStats();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setActiveTab("Dashboard");
    });
    return unsubscribe;
  }, [navigation]);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "users"),
        where("status", "==", "pending"),
        where("role", "==", "mentor"),
        where("college", "==", "Goa College of Engineering")
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendingUsers(users);
      setStats((prev) => ({ ...prev, pendingApps: users.length }));
    } catch (err) {
      console.error("Error fetching pending users:", err);
      Alert.alert("Error", "Failed to fetch pending applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch approved mentors
      const mentorsQuery = query(
        collection(db, "users"),
        where("role", "==", "mentor"),
        where("status", "==", "approved"),
        where("college", "==", "Goa College of Engineering")
      );
      const mentorsSnapshot = await getDocs(mentorsQuery);

      // Fetch mentees
      const menteesQuery = query(
        collection(db, "users"),
        where("role", "==", "mentee"),
        where("college", "==", "Goa College of Engineering")
      );
      const menteesSnapshot = await getDocs(menteesQuery);

      setStats((prev) => ({
        ...prev,
        activeMentors: mentorsSnapshot.size,
        totalMentees: menteesSnapshot.size,
      }));
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const approveUser = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { status: "approved" });
      Alert.alert("Success", `${user.firstName} has been approved as a mentor`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
      setStats((prev) => ({
        ...prev,
        pendingApps: prev.pendingApps - 1,
        activeMentors: prev.activeMentors + 1,
      }));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to approve user");
    }
  };

  const rejectUser = async (user) => {
    Alert.alert(
      "Reject Application",
      `Are you sure you want to reject ${user.firstName} ${user.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", user.id), {
                status: "rejected",
              });
              Alert.alert(
                "Success",
                `${user.firstName}'s application has been rejected`
              );
              setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
              setStats((prev) => ({
                ...prev,
                pendingApps: prev.pendingApps - 1,
              }));
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to reject user");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Department Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Department Info */}
        <View style={styles.deptCard}>
          <View style={styles.deptIcon}>
            <Feather name="book-open" size={24} color="#fff" />
          </View>
          <View style={styles.deptInfo}>
            <Text style={styles.deptName}>Computer Science</Text>
            <Text style={styles.collegeName}>Goa College of Engineering</Text>
            <Text style={styles.headName}>Department Administrator</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="users" size={20} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{stats.totalMentees}</Text>
            <Text style={styles.statLabel}>Total Mentees</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="user-check" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statNumber}>{stats.activeMentors}</Text>
            <Text style={styles.statLabel}>Active Mentors</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="clock" size={20} color="#ef4444" />
            </View>
            <Text style={styles.statNumber}>{stats.pendingApps}</Text>
            <Text style={styles.statLabel}>Pending Apps</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="trending-up" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.statLabel}>Avg GPA</Text>
          </View>
        </View>

        {/* Pending Applications */}
        <View style={styles.applicationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Mentor Applications</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingApps}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Loading applications...</Text>
            </View>
          ) : pendingUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={48} color="#10b981" />
              <Text style={styles.emptyText}>No pending applications</Text>
              <Text style={styles.emptySubtext}>
                All mentor applications have been reviewed
              </Text>
            </View>
          ) : (
            pendingUsers.map((user) => (
              <View key={user.id} style={styles.applicationCard}>
                <View style={styles.appHeader}>
                  <Text style={styles.appName}>
                    {user.firstName} {user.lastName}
                  </Text>
                </View>
                <Text style={styles.appDetail}>
                  {user.department || "Computer Science"}
                </Text>
                <Text style={styles.appExperience}>
                  {user.email || "No email provided"}
                </Text>
                <Text style={styles.appDate}>
                  Role: {user.role || "Mentor"}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => approveUser(user)}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => rejectUser(user)}
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {/* Dashboard */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("DeptDashboard")}
        >
          <Feather
            name="home"
            size={24}
            color={activeTab === "Dashboard" ? "#10b981" : "#9ca3af"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "Dashboard" && styles.navLabelActive,
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        {/* Assign */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Mentors")}
        >
          <Feather
            name="users"
            size={24}
            color={activeTab === "Mentors" ? "#10b981" : "#9ca3af"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "Mentors" && styles.navLabelActive,
            ]}
          >
            Assign
          </Text>
        </TouchableOpacity>

        {/* Mentees */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Announcements")}
        >
          <Feather
            name="message-circle"
            size={24}
            color={activeTab === "Announcements" ? "#10b981" : "#9ca3af"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "Announcements" && styles.navLabelActive,
            ]}
          >
            News
          </Text>
        </TouchableOpacity>

        {/* News */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Feather
            name="user"
            size={24}
            color={activeTab === "Profile" ? "#10b981" : "#9ca3af"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "Profile" && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
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
  logoutBtn: { color: "#ef4444", fontSize: 14, fontWeight: "500" },
  content: { flex: 1, padding: 16 },
  deptCard: {
    backgroundColor: "#d1fae5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    marginBottom: 16,
  },
  deptIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  deptInfo: { flex: 1 },
  deptName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#065f46",
    marginBottom: 2,
  },
  collegeName: { fontSize: 14, color: "#059669", marginBottom: 2 },
  headName: { fontSize: 12, color: "#047857" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statIconContainer: { marginBottom: 8 },
  statNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#6b7280" },
  applicationsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 80,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  badge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#1e40af", fontSize: 12, fontWeight: "600" },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#6b7280" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  applicationCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  appHeader: { marginBottom: 8 },
  appName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  appDetail: { fontSize: 14, color: "#6b7280", marginBottom: 2 },
  appExperience: { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  appDate: { fontSize: 11, color: "#9ca3af", marginBottom: 12 },
  actionButtons: { flexDirection: "row", gap: 8 },
  approveBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
  },
  approveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  rejectBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
  },
  rejectBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: { flex: 1, alignItems: "center", paddingVertical: 8 },
  navLabel: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  navLabelActive: { color: "#10b981", fontWeight: "600" },
});
