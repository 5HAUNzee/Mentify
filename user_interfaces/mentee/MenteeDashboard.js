// screens/MenteeDashboard.js - BLUE THEME
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.config";

export default function MenteeDashboard({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    rollNumber: "",
    department: "",
    college: "",
    profilePic: null,
    currentSem: "",
    sgpaHistory: [],
  });
  const [mentorData, setMentorData] = useState({
    name: "",
    department: "",
    profilePic: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.log("User not found");
        return;
      }

      const basicUserData = userSnap.data();

      const menteeDocRef = doc(db, "mentees", userId);
      const menteeSnap = await getDoc(menteeDocRef);

      let menteeData = {};
      if (menteeSnap.exists()) {
        menteeData = menteeSnap.data();
      }

      setUserData({
        firstName: basicUserData.firstName || "",
        lastName: basicUserData.lastName || "",
        rollNumber: menteeData.rollNumber || "N/A",
        department: basicUserData.department || "N/A",
        college: basicUserData.college || "N/A",
        profilePic: basicUserData.profilePic || null,
        currentSem: menteeData.currentSem || "",
        sgpaHistory: menteeData.sgpaHistory || [],
      });

      const assignmentsRef = collection(db, "assignments");
      const q = query(assignmentsRef, where("menteeId", "==", userId));
      const assignmentSnap = await getDocs(q);

      if (!assignmentSnap.empty) {
        const assignmentData = assignmentSnap.docs[0].data();
        const mentorId = assignmentData.mentorId;

        if (mentorId) {
          const mentorDocRef = doc(db, "users", mentorId);
          const mentorSnap = await getDoc(mentorDocRef);
          if (mentorSnap.exists()) {
            const mentor = mentorSnap.data();
            setMentorData({
              name: `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim(),
              department: mentor.department || "",
              profilePic: mentor.profilePic || null,
            });
          }
        }
      }
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

  const calculateCGPA = () => {
    if (!userData.sgpaHistory || userData.sgpaHistory.length === 0) {
      return "N/A";
    }
    const total = userData.sgpaHistory.reduce(
      (sum, item) => sum + item.sgpa,
      0
    );
    return (total / userData.sgpaHistory.length).toFixed(2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Dashboard</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ ...styles.scrollContent, paddingBottom: 100 }}
      >
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          {userData.profilePic ? (
            <Image
              source={{ uri: userData.profilePic }}
              style={styles.profilePic}
            />
          ) : (
            <View style={styles.profilePicPlaceholder}>
              <Ionicons name="person" size={30} color="#9ca3af" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>
              Welcome back, {userData.firstName}!
            </Text>
            <Text style={styles.detailsText}>
              {userData.rollNumber} • {userData.department}
            </Text>
            <Text style={styles.collegeText}>{userData.college}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Forms Submitted</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color="#3b82f6"
            />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Active Doubts</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={20} color="#9333EA" />
            <Text style={styles.statValue}>{calculateCGPA()}</Text>
            <Text style={styles.statLabel}>Overall CGPA</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{userData.currentSem || "N/A"}</Text>
            <Text style={styles.statLabel}>Current Semester</Text>
          </View>
        </View>

        {/* Mentor Card */}
        {mentorData.name && (
          <View style={styles.mentorCard}>
            <Text style={styles.mentorTitle}>My Mentor</Text>
            <View style={styles.mentorInfo}>
              {mentorData.profilePic ? (
                <Image
                  source={{ uri: mentorData.profilePic }}
                  style={styles.mentorPic}
                />
              ) : (
                <View style={styles.mentorPicPlaceholder}>
                  <Ionicons name="person" size={24} color="#9ca3af" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.mentorName}>{mentorData.name}</Text>
                <Text style={styles.mentorDept}>{mentorData.department}</Text>
                <Text style={styles.mentorAvail}>
                  Available for consultation
                </Text>
              </View>
              <TouchableOpacity style={styles.contactBtn} onPress={() => navigation.navigate("MenteeChat")}>
                <Ionicons name="chatbubbles-outline" size={18} color="white" />
                <Text style={styles.contactText}>Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.mentorTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("MenteeForms")}
            >
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#3b82f6"
              />
              <Text style={styles.actionText}>Submit Form</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("Insights")}
            >
              <Ionicons name="bar-chart-outline" size={24} color="#3b82f6" />
              <Text style={styles.actionText}>View Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("Attendance")}
            >
              <Ionicons name="clipboard-outline" size={24} color="#3b82f6" />
              <Text style={styles.actionText}>Track Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => navigation.navigate("MenteeProfile")}
            >
              <Ionicons name="person-outline" size={24} color="#3b82f6" />
              <Text style={styles.actionText}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeDashboard")}
        >
          <Feather name="home" size={24} color="#3b82f6" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeForms")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeChat")}
        >
          <Feather name="message-circle" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Doubts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeProfile")}
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
    backgroundColor: "#f8fafc",
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
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,

  },
  logoutButtonText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeCard: {
    flexDirection: "row",
    backgroundColor: "#93c5fd", // Light blue (changed from #6ee7b7)
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  profilePicPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  detailsText: {
    color: "#374151",
    marginTop: 2,
  },
  collegeText: {
    color: "#6b7280",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 15,
  },
  statCard: {
    backgroundColor: "white",
    flex: 0.48,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 5,
  },
  statLabel: {
    color: "#6b7280",
    textAlign: "center",
    fontSize: 12,
  },
  mentorCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  mentorTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  mentorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  mentorPic: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 10,
  },
  mentorPicPlaceholder: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  mentorName: {
    fontWeight: "bold",
    fontSize: 15,
  },
  mentorDept: {
    color: "#374151",
    marginTop: 2,
  },
  mentorAvail: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  contactBtn: {
    flexDirection: "row",
    backgroundColor: "#3b82f6", // Blue (changed from #10b981)
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    top: -15,
    alignItems: "center",
  },
  contactText: {
    color: "white",
    fontWeight: "500",
    marginLeft: 5,
  },
  actionsCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionBtn: {
    width: "48%",
    backgroundColor: "#eff6ff", // Light blue bg (changed from #ecfdf5)
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginTop: 10,
  },
  actionText: {
    color: "#1e40af", // Dark blue text (changed from #047857)
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 5,
  },
  navLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  navLabelActive: {
    color: "#3b82f6", // Blue (changed from #10b981)
    fontWeight: "600",
  },
});
