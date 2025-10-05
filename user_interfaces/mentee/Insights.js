import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";

export default function Insights({ navigation }) {
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
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mentor Insights</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Event */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Join the Programming Club
          </Text>
          <View style={styles.priorityTag}>
            <Text style={styles.priorityText}>low priority</Text>
          </View>
          <Text style={styles.cardDescription}>
            Participating in coding competitions could help improve your
            problem-solving skills and build your portfolio.
          </Text>
          <Text style={styles.dateText}>2024-12-19</Text>
        </View>

        {/* Study Plan Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={18} color="#111" />
            <Text style={styles.sectionTitle}>
              Recommended Study Plan
            </Text>
          </View>

          {/* Cards */}
          <View style={styles.tasksContainer}>
            {/* Task 1 */}
            <View style={[styles.taskCard, styles.taskCardBlue]}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitleBlue}>Complete Algorithm Practice</Text>
                <View style={[styles.timeTag, styles.timeTagBlue]}>
                  <Text style={styles.timeText}>This Week</Text>
                </View>
              </View>
              <Text style={styles.taskDescription}>
                Focus on dynamic programming problems
              </Text>
            </View>

            {/* Task 2 */}
            <View style={[styles.taskCard, styles.taskCardGreen]}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitleGreen}>Database Project Review</Text>
                <View style={[styles.timeTag, styles.timeTagGreen]}>
                  <Text style={styles.timeText}>Next Week</Text>
                </View>
              </View>
              <Text style={styles.taskDescription}>
                Prepare for final project presentation
              </Text>
            </View>

            {/* Task 3 */}
            <View style={[styles.taskCard, styles.taskCardPurple]}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskTitlePurple}>Start System Design Studies</Text>
                <View style={[styles.timeTag, styles.timeTagPurple]}>
                  <Text style={styles.timeText}>Next Month</Text>
                </View>
              </View>
              <Text style={styles.taskDescription}>
                Begin preparing for advanced courses
              </Text>
            </View>
          </View>
        </View>

        {/* Additional spacing at the bottom */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  // Fixed Header - Same as other screens
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "600",
    color: '#000000'
  },
  logoutButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  logoutButtonText: { 
    color: "white", 
    fontWeight: "600",
    fontSize: 14,
  },
  // Scrollable Content
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  // Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: '#000000',
  },
  priorityTag: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  priorityText: { 
    color: "#0284C7", 
    fontWeight: "500",
    fontSize: 12,
  },
  cardDescription: { 
    color: "#555", 
    marginBottom: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  dateText: { 
    color: "#9CA3AF", 
    fontSize: 12 
  },
  // Section Header
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
    color: '#000000',
  },
  // Tasks Container
  tasksContainer: { 
    marginTop: 15 
  },
  // Task Cards
  taskCard: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  taskCardBlue: {
    backgroundColor: "#EFF6FF",
  },
  taskCardGreen: {
    backgroundColor: "#ECFDF5",
  },
  taskCardPurple: {
    backgroundColor: "#F5F3FF",
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  taskTitleBlue: { 
    fontWeight: "600", 
    color: "#1E3A8A",
    fontSize: 14,
    flex: 1,
  },
  taskTitleGreen: { 
    fontWeight: "600", 
    color: "#065F46",
    fontSize: 14,
    flex: 1,
  },
  taskTitlePurple: { 
    fontWeight: "600", 
    color: "#6D28D9",
    fontSize: 14,
    flex: 1,
  },
  timeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timeTagBlue: {
    backgroundColor: "#3B82F6",
  },
  timeTagGreen: {
    backgroundColor: "#10B981",
  },
  timeTagPurple: {
    backgroundColor: "#A855F7",
  },
  timeText: { 
    color: "white", 
    fontSize: 12,
    fontWeight: '500',
  },
  taskDescription: { 
    color: "#475569", 
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
});