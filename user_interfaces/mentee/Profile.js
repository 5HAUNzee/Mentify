import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

const Profile = ({ navigation }) => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleSettings = () => {
    // Navigate to settings screen
    console.log("Settings pressed");
  };

  // Mock user data - replace with actual data from your state/context
  const userData = {
    name: "Shaun",
    email: "shaun@student.gec.ac.in",
    studentId: "CS2024001",
    college: "Goa College of Engineering",
    department: "Computer Engineering",
    cgpa: "8.8",
    academicStatus: "Good Standing",
    semester: "4th",
    year: "2nd Year",
    mentor: "Dr. Smith",
    joinDate: "Aug 2023",
    creditsCompleted: "68",
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={handleSettings}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info Section with Profile Picture */}
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=12" }}
            style={styles.profilePic}
          />
          <View style={styles.userInfoText}>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.userId}>Student ID: {userData.studentId}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{userData.academicStatus}</Text>
            </View>
          </View>
        </View>

        {/* Academic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Information</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Ionicons name="school" size={20} color="#2563EB" />
              <Text style={styles.infoCardLabel}>College</Text>
              <Text style={styles.infoCardValue}>{userData.college}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="business" size={20} color="#2563EB" />
              <Text style={styles.infoCardLabel}>Department</Text>
              <Text style={styles.infoCardValue}>{userData.department}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="trophy" size={20} color="#2563EB" />
              <Text style={styles.infoCardLabel}>CGPA</Text>
              <Text style={styles.infoCardValue}>{userData.cgpa}</Text>
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="calendar" size={20} color="#2563EB" />
              <Text style={styles.infoCardLabel}>Semester</Text>
              <Text style={styles.infoCardValue}>{userData.semester}</Text>
            </View>
          </View>
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Details</Text>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Year</Text>
              <Text style={styles.detailValue}>{userData.year}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Assigned Mentor</Text>
              <Text style={styles.detailValue}>{userData.mentor}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Join Date</Text>
              <Text style={styles.detailValue}>{userData.joinDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Credits Completed</Text>
              <Text style={styles.detailValue}>
                {userData.creditsCompleted}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="document-text" size={24} color="#2563EB" />
              <Text style={styles.actionText}>Forms</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="stats-chart" size={24} color="#2563EB" />
              <Text style={styles.actionText}>Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble" size={24} color="#2563EB" />
              <Text style={styles.actionText}>Messages</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="person" size={24} color="#2563EB" />
              <Text style={styles.actionText}>Mentor</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Additional spacing at the bottom */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f9ff",
  },
  // Fixed Header
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f6f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  settingsButton: {
    padding: 8,
  },
  // Scrollable Content
  scrollView: {
    flex: 1,
  },
  // User Info with Profile Picture
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 3,
    borderColor: "#2563EB",
  },
  userInfoText: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "600",
  },
  // Sections
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 15,
  },
  // Info Grid
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoCard: {
    backgroundColor: "white",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoCardValue: {
    fontSize: 16,
    color: "#1E3A8A",
    fontWeight: "600",
    textAlign: "center",
  },
  // Details List
  detailsList: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#1E3A8A",
    fontWeight: "600",
  },
  attendanceGood: {
    color: "#10B981",
  },
  // Actions Grid
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "white",
    alignItems: "center",
    padding: 15,
    borderRadius: 12,
    width: "23%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    fontSize: 12,
    color: "#2563EB",
    marginTop: 8,
    fontWeight: "500",
    textAlign: "center",
  },
  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoutButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default Profile;
