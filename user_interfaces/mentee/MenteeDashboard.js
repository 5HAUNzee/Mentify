import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

export default function MenteeDashboard({ navigation }) {
    const { signOut } = useAuth();
    const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <View style={styles.container}>
  {/* Header */}
  <View style={styles.header}>
    <Text style={styles.headerTitle}>My Dashboard</Text>
    <TouchableOpacity
      onPress={handleSignOut}
      style={{
        backgroundColor: "#2563EB",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: "white", fontWeight: "600" }}>Logout</Text>
    </TouchableOpacity>
  </View>


      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=3" }}
            style={styles.profilePic}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome back, Alex!</Text>
            <Text style={styles.detailsText}>CS2024001 • Computer Science</Text>
            <Text style={styles.collegeText}>Goa College of Engineering</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={20} color="#2563EB" />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Forms Submitted</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#10B981" />
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Active Doubts</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up-outline" size={20} color="#9333EA" />
            <Text style={styles.statValue}>3.8</Text>
            <Text style={styles.statLabel}>Overall CGPA</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>2.1h</Text>
            <Text style={styles.statLabel}>Mentor Response</Text>
          </View>
        </View>

        {/* Performance Chart Placeholder */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Academic Performance Trend</Text>
          <Image
            source={{ uri: "https://quickchart.io/chart?c={type:'line',data:{labels:['Spring 2024','Fall 2024'],datasets:[{label:'CGPA',data:[3.25,3.5,3.65,3.9],fill:false,borderColor:'green'}]}}" }}
            style={styles.chartImage}
          />
        </View>

        {/* Mentor Card */}
        <View style={styles.mentorCard}>
          <Text style={styles.mentorTitle}>My Mentor</Text>
          <View style={styles.mentorInfo}>
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=5" }}
              style={styles.mentorPic}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.mentorName}>Dr. Emily Rodriguez</Text>
              <Text style={styles.mentorDept}>Computer Science</Text>
              <Text style={styles.mentorAvail}>Available for consultation</Text>
            </View>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="chatbubbles-outline" size={18} color="white" />
              <Text style={styles.contactText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.mentorTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: "Submit Form", icon: "document-text-outline" },
              { label: "Ask Doubt", icon: "chatbubble-ellipses-outline" },
              { label: "View Insights", icon: "bar-chart-outline" },
              { label: "My Profile", icon: "person-outline" },
            ].map((item, index) => (
              <TouchableOpacity key={index} style={styles.actionBtn}>
                <Ionicons name={item.icon} size={24} color="#2563EB" />
                <Text style={styles.actionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  logoutText: { color: "#2563EB", fontWeight: "500" },

  welcomeCard: {
    flexDirection: "row",
    backgroundColor: "#d1fae5",
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  profilePic: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  welcomeText: { fontSize: 16, fontWeight: "bold" },
  detailsText: { color: "#374151" },
  collegeText: { color: "#6b7280" },

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
  statValue: { fontSize: 20, fontWeight: "bold", marginVertical: 5 },
  statLabel: { color: "#6b7280" },

  chartCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  chartTitle: { fontSize: 15, fontWeight: "600", marginBottom: 10 },
  chartImage: { width: "100%", height: 180, borderRadius: 8 },

  mentorCard: {
    backgroundColor: "white",
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  mentorTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  mentorInfo: { flexDirection: "row", alignItems: "center" },
  mentorPic: { width: 55, height: 55, borderRadius: 30, marginRight: 10 },
  mentorName: { fontWeight: "bold", fontSize: 15 },
  mentorDept: { color: "#374151" },
  mentorAvail: { color: "#6b7280", fontSize: 12 },
  contactBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    flexDirection: "row",
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
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionBtn: {
    width: "48%",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 20,
    alignItems: "center",
    marginTop: 10,
  },
  actionText: { color: "#1e3a8a", fontWeight: "500", marginTop: 8 },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 10,
    backgroundColor: "white",
  },
  navItem: { alignItems: "center" },
  navLabel: { color: "#2563EB", fontSize: 12, marginTop: 2 },
});
