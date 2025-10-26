import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
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
import { useAuth } from "@clerk/clerk-expo";

export default function MentorDashboard({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mentorData, setMentorData] = useState(null);
  const [stats, setStats] = useState({
    myMentees: 0,
    pendingReviews: 0,
    openQueries: 0,
    avgResponse: "2.3h",
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
      if (mentorDoc.exists()) {
        setMentorData(mentorDoc.data());
      }

      // Fetch assigned mentees
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("mentorId", "==", userId),
        where("status", "==", "active")
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);
      const menteesData = assignmentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssignedMentees(menteesData);

      // Fetch pending form reviews
      const reviewsQuery = query(
        collection(db, "formSubmissions"),
        where("mentorId", "==", userId),
        where("status", "==", "submitted")
      );
      const reviewsSnap = await getDocs(reviewsQuery);

      // Fetch open queries
      const queriesQuery = query(
        collection(db, "queries"),
        where("mentorId", "==", userId),
        where("status", "==", "open")
      );
      const queriesSnap = await getDocs(queriesQuery);

      setStats({
        myMentees: menteesData.length,
        pendingReviews: reviewsSnap.size,
        openQueries: queriesSnap.size,
        avgResponse: "2.3h",
      });
    } catch (err) {
      console.error("Error fetching mentor data:", err);
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

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "up":
        return { bg: "#d1fae5", text: "#065f46" };
      case "stable":
        return { bg: "#fef3c7", text: "#92400e" };
      case "down":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
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
              Mentor : {mentorData?.department}
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
            <Text style={styles.statNumber}>{stats.pendingReviews}</Text>
            <Text style={styles.statLabel}>Pending Reviews</Text>
          </View>

          <View style={styles.statCard}>
            <Feather name="message-circle" size={24} color="#10b981" />
            <Text style={styles.statNumber}>{stats.openQueries}</Text>
            <Text style={styles.statLabel}>Open Queries</Text>
          </View>

          <View style={styles.statCard}>
            <Feather name="clock" size={24} color="#8b5cf6" />
            <Text style={styles.statNumber}>{stats.avgResponse}</Text>
            <Text style={styles.statLabel}>Avg Response</Text>
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
            assignedMentees.map((mentee) => {
              const statusStyle = getStatusColor(mentee.performanceStatus);
              return (
                <TouchableOpacity
                  key={mentee.id}
                  style={styles.menteeCard}
                  onPress={() =>
                    navigation.navigate("MenteeDetails", {
                      menteeId: mentee.menteeId,
                    })
                  }
                >
                  <View style={styles.menteeAvatar}>
                    <Feather name="user" size={24} color="#6b7280" />
                  </View>
                  <View style={styles.menteeInfo}>
                    <Text style={styles.menteeName}>{mentee.menteeName}</Text>
                    <Text style={styles.menteeId}>
                      {mentee.menteeRegNo || "CS2024001"}
                    </Text>
                    <Text style={styles.menteeGPA}>
                      CGPA: {mentee.cgpa || "3.8"}
                    </Text>
                  </View>
                  <View style={styles.menteeStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusStyle.text }]}
                      >
                        {mentee.performanceStatus || "up"}
                      </Text>
                    </View>
                    <Text style={styles.lastContact}>
                      Last contact: {mentee.lastContact || "2 days ago"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
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
              {stats.pendingReviews > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {stats.pendingReviews}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorQueries")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="message-circle" size={28} color="#10b981" />
              </View>
              <Text style={styles.actionLabel}>Answer Queries</Text>
              {stats.openQueries > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>
                    {stats.openQueries}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorProgress")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="users" size={28} color="#8b5cf6" />
              </View>
              <Text style={styles.actionLabel}>Mentee Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("MentorAnnouncements")}
            >
              <View style={styles.actionIconContainer}>
                <Feather name="send" size={28} color="#f59e0b" />
              </View>
              <Text style={styles.actionLabel}>Send Message</Text>
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
          onPress={() => navigation.navigate("Messages")}
        >
          <Feather name="message-circle" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Messages</Text>
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
    width: "48%",
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
    fontSize: 12,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menteeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  menteeId: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  menteeGPA: {
    fontSize: 12,
    color: "#6b7280",
  },
  menteeStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  lastContact: {
    fontSize: 10,
    color: "#9ca3af",
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
    position: "absolute",
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
