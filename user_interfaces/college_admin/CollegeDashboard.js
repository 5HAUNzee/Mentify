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
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function CollegeDashboard({ navigation }) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    departments: 0,
    mentors: 0,
    mentees: 0,
    pendingApps: 0,
  });
  const [pendingAdmins, setPendingAdmins] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all stats
      const [depts, approvedAdminsSnap, menteesSnap, pendingSnap] =
        await Promise.all([
          getDocs(collection(db, "departments")),
          getDocs(
            query(
              collection(db, "users"),
              where("role", "==", "deptadmin"),
              where("status", "==", "approved"),
              where("college", "==", "Goa College of Engineering")
            )
          ),
          getDocs(
            query(
              collection(db, "users"),
              where("role", "==", "mentee"),
              where("college", "==", "Goa College of Engineering")
            )
          ),
          getDocs(
            query(
              collection(db, "users"),
              where("role", "==", "deptadmin"),
              where("status", "==", "pending"),
              where("college", "==", "Goa College of Engineering")
            )
          ),
        ]);

      setStats({
        departments: depts.size,
        mentors: approvedAdminsSnap.size, // only approved deptadmins counted
        mentees: menteesSnap.size,
        pendingApps: pendingSnap.size,
      });

      setPendingAdmins(
        pendingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleApproveAdmin = async (admin) => {
    if (admin.role !== "deptadmin") {
      Alert.alert("Error", "Only Department Admins can be approved here");
      return;
    }

    try {
      await updateDoc(doc(db, "users", admin.id), { status: "approved" });
      Alert.alert(
        "Success",
        `${admin.firstName} has been approved as Department Admin`
      );
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to approve admin");
    }
  };

  const handleReviewAdmin = async (admin) => {
    Alert.alert(
      "Review Application",
      `Name: ${admin.firstName} ${admin.lastName}\nDepartment: ${admin.department}\nEmail: ${admin.email}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => handleApproveAdmin(admin),
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "users", admin.id), {
                status: "rejected",
              });
              Alert.alert(
                "Rejected",
                `${admin.firstName}'s Department Admin application has been rejected`
              );
              fetchDashboardData();
            } catch (err) {
              Alert.alert("Error", "Failed to reject");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>College Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* College Info Card */}
        <View style={styles.collegeCard}>
          <View style={styles.collegeIcon}>
            <Feather name="award" size={32} color="#2563eb" />
          </View>
          <View style={styles.collegeInfo}>
            <Text style={styles.collegeName}>Goa College of Engineering</Text>
            <Text style={styles.collegeRole}>College Administration</Text>
            <Text style={styles.collegeAdmin}>
              Administrator: Dr. Sarah Johnson
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="layers" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.statNumber}>{stats.departments}</Text>
            <Text style={styles.statLabel}>Departments</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="users" size={20} color="#f59e0b" />
            </View>
            <Text style={styles.statNumber}>{stats.mentors}</Text>
            <Text style={styles.statLabel}>Dept Admins</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="user-check" size={20} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{stats.mentees}</Text>
            <Text style={styles.statLabel}>Mentees</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Feather name="clock" size={20} color="#ef4444" />
            </View>
            <Text style={styles.statNumber}>{stats.pendingApps}</Text>
            <Text style={styles.statLabel}>Pending Dept Admins</Text>
          </View>
        </View>

        {/* Pending Applications */}
        {pendingAdmins.length > 0 && (
          <View style={styles.applicationsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Pending Department Admin Applications
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingAdmins.length}</Text>
              </View>
            </View>

            {pendingAdmins.map((admin) => (
              <View key={admin.id} style={styles.applicationCard}>
                <View style={styles.appHeader}>
                  <Text style={styles.appName}>
                    {admin.firstName} {admin.lastName}
                  </Text>
                </View>
                <Text style={styles.appDetail}>{admin.department}</Text>
                <Text style={styles.appDate}>
                  Applied {new Date().toLocaleDateString()}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveAdmin(admin)}
                  >
                    <Text style={styles.approveBtnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleReviewAdmin(admin)}
                  >
                    <Text style={styles.reviewBtnText}>Review</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="home" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Users")}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Forms")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CollegeProfile")}
        >
          <Feather name="user" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Profile</Text>
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
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  collegeCard: {
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  collegeIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  collegeInfo: { flex: 1, justifyContent: "center" },
  collegeName: { fontSize: 16, fontWeight: "700", color: "#1e40af", marginBottom: 2 },
  collegeRole: { fontSize: 13, color: "#2563eb", marginBottom: 2 },
  collegeAdmin: { fontSize: 11, color: "#3b82f6" },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
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
  statNumber: { fontSize: 28, fontWeight: "700", color: "#111827", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#6b7280" },
  applicationsSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  badge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: "#1e40af", fontSize: 12, fontWeight: "600" },
  applicationCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  appHeader: { marginBottom: 8 },
  appName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  appDetail: { fontSize: 13, color: "#6b7280", marginBottom: 2 },
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
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  reviewBtn: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    flex: 1,
  },
  reviewBtnText: {
    color: "#374151",
    fontSize: 13,
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
  navLabelActive: { color: "#2563eb", fontWeight: "600" },
});
