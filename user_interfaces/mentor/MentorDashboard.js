// screens/MentorDashboard.js - FETCH MENTEE FROM USERS
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth, useClerk } from "@clerk/clerk-expo";

export default function MentorDashboard({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mentorData, setMentorData] = useState(null);
  const [stats, setStats] = useState({
    myMentees: 0,
    totalSubmissions: 0,
    approvedSubmissions: 0,
  });
  const [assignedMentees, setAssignedMentees] = useState([]);

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    try {
      setLoading(true);

      // Fetch mentor profile
      const mentorDoc = await getDoc(doc(db, "users", userId));
      if (!mentorDoc.exists()) {
        Alert.alert("Error", "Mentor profile not found");
        return;
      }

      const mentorInfo = mentorDoc.data();
      setMentorData(mentorInfo);

      // Fetch assignments where this mentor is assigned
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("mentorId", "==", userId),
        where("status", "==", "active")
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);

      // Get mentee details from users collection based on assignments
      const menteePromises = assignmentsSnapshot.docs.map(async (assignDoc) => {
        const assignData = assignDoc.data();
        
        // Fetch from users collection using menteeId
        const userDoc = await getDoc(doc(db, "users", assignData.menteeId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Also fetch from mentees collection for additional data (SGPA, etc.)
          let menteeData = {};
          try {
            const menteeDoc = await getDoc(doc(db, "mentees", assignData.menteeId));
            if (menteeDoc.exists()) {
              menteeData = menteeDoc.data();
            }
          } catch (err) {
            console.log("No mentees document found for:", assignData.menteeId);
          }
          
          return {
            id: userDoc.id,
            assignmentId: assignDoc.id,
            // User data (primary)
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            profilePic: userData.profilePic,
            department: userData.department,
            // Mentee-specific data (if available)
            rollNumber: menteeData.rollNumber || userData.rollNumber,
            currentSem: menteeData.currentSem || userData.currentSem,
            sgpaHistory: menteeData.sgpaHistory,
            menteeName: assignData.menteeName || `${userData.firstName} ${userData.lastName}`,
          };
        }
        return null;
      });

      const menteesData = (await Promise.all(menteePromises)).filter(m => m !== null);
      setAssignedMentees(menteesData);

      // Fetch submissions for this mentor
      const submissionsQuery = query(
        collection(db, "submissions"),
        where("mentorId", "==", userId)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      const totalSubmissions = submissionsSnapshot.size;
      const approvedSubmissions = submissionsSnapshot.docs.filter(
        doc => doc.data().status === "approved"
      ).length;

      setStats({
        myMentees: menteesData.length,
        totalSubmissions: totalSubmissions,
        approvedSubmissions: approvedSubmissions,
      });

      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Error fetching mentor data:", err);
      Alert.alert("Error", "Failed to load dashboard data");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMentorData();
  };

  const handleSignOut = async () => {
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
            } catch (err) {
              console.error("Sign out error:", err);
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
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mentor Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />
        }
      >
        {/* Mentor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            {mentorData?.profilePic ? (
              <Image
                source={{ uri: mentorData.profilePic }}
                style={styles.avatarImage}
              />
            ) : (
              <Feather name="user" size={32} color="#f59e0b" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {mentorData?.firstName} {mentorData?.lastName}
            </Text>
            <Text style={styles.profileRole}>
              Mentor • {mentorData?.department}
            </Text>
            <Text style={styles.profileCollege}>{mentorData?.college}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Feather name="users" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.myMentees}</Text>
            <Text style={styles.statLabel}>My Mentees</Text>
          </View>

          <View style={styles.statCard}>
            <Feather name="file-text" size={24} color="#3b82f6" />
            <Text style={styles.statNumber}>{stats.totalSubmissions}</Text>
            <Text style={styles.statLabel}>Submissions</Text>
          </View>

          <View style={styles.statCard}>
            <Feather name="check-circle" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.approvedSubmissions}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
        </View>

        {/* My Assigned Mentees */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Assigned Mentees</Text>

          {assignedMentees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>No mentees assigned yet</Text>
            </View>
          ) : (
            assignedMentees.map((mentee) => (
              <TouchableOpacity
                key={mentee.id}
                style={styles.menteeCard}
                onPress={() =>
                  navigation.navigate("MenteeDetails", {
                    menteeId: mentee.id,
                  })
                }
              >
                <View style={styles.menteeAvatar}>
                  {mentee.profilePic ? (
                    <Image
                      source={{ uri: mentee.profilePic }}
                      style={styles.menteeAvatarImage}
                    />
                  ) : (
                    <Text style={styles.menteeAvatarText}>
                      {mentee.firstName?.[0]}{mentee.lastName?.[0]}
                    </Text>
                  )}
                </View>
                <View style={styles.menteeInfo}>
                  <Text style={styles.menteeName}>
                    {mentee.firstName} {mentee.lastName}
                  </Text>
                  <Text style={styles.menteeEmail}>{mentee.email}</Text>
                  {mentee.rollNumber && (
                    <Text style={styles.menteeId}>
                      Roll: {mentee.rollNumber}
                    </Text>
                  )}
                  {mentee.sgpaHistory && mentee.sgpaHistory[0] && (
                    <Text style={styles.menteeGPA}>
                      SGPA: {mentee.sgpaHistory[0].sgpa} • Sem {mentee.currentSem || 1}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </View>

                {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorForms")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="file-text" size={28} color="#3b82f6" />
              </View>
              <Text style={styles.actionLabel}>Review Forms</Text>
              {stats.totalSubmissions > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {stats.totalSubmissions}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MyMentees")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="users" size={28} color="#10b981" />
              </View>
              <Text style={styles.actionLabel}>View Mentees</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorAnnouncements")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="volume-2" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.actionLabel}>Post Announcement</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorQueries")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="message-square" size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.actionLabel}>Answer Queries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorProgress")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="trending-up" size={28} color="#06b6d4" />
              </View>
              <Text style={styles.actionLabel}>Progress Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorProfile")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="settings" size={28} color="#64748b" />
              </View>
              <Text style={styles.actionLabel}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="home" size={24} color="#f59e0b" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MyMentees")}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Mentees</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MentorForms")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MentorProfile")}
        >
          <Feather name="user" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Profile</Text>
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
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
  profileCard: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 2,
  },
  profileRole: {
    fontSize: 13,
    color: "#b45309",
    marginBottom: 2,
  },
  profileCollege: {
    fontSize: 12,
    color: "#d97706",
  },
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
    width: "31%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  emptyContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
  menteeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menteeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  menteeAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  menteeAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
  menteeInfo: {
    flex: 1,
  },
  menteeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  menteeEmail: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  menteeId: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 1,
  },
  menteeGPA: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    position: "relative",
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  actionBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    bottom: 0,
    left: 0,
    right: 0,
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
  navLabelActive: {
    color: "#f59e0b",
    fontWeight: "600",
  },
});
