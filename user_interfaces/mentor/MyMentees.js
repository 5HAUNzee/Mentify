import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";
import { LineChart } from "react-native-chart-kit";

export default function MyMentees({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mentees, setMentees] = useState([]);
  const [filteredMentees, setFilteredMentees] = useState([]);
  const [selectedYear, setSelectedYear] = useState("All");

  const years = ["All", "FE", "SE", "TE", "BE"];

  useEffect(() => {
    fetchMentees();
  }, []);

  useEffect(() => {
    filterMenteesByYear();
  }, [selectedYear, mentees]);

  const fetchMentees = async () => {
    try {
      setLoading(true);

      // Fetch assignments for this mentor
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("mentorId", "==", userId),
        where("status", "==", "active")
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      // Fetch mentee details
      const menteesData = [];
      for (const assignmentDoc of assignmentsSnap.docs) {
        const assignment = assignmentDoc.data();
        
        // Fetch mentee user data
        const menteeQuery = query(
          collection(db, "users"),
          where("__name__", "==", assignment.menteeId)
        );
        const menteeSnap = await getDocs(menteeQuery);
        
        if (!menteeSnap.empty) {
          const menteeData = menteeSnap.docs[0].data();
          
          // Fetch academic progress (you can customize this based on your data structure)
          const progressData = await fetchMenteeProgress(assignment.menteeId);
          
          menteesData.push({
            id: assignment.menteeId,
            assignmentId: assignmentDoc.id,
            name: `${menteeData.firstName} ${menteeData.lastName}`,
            regNo: menteeData.regNo || "CS2024001",
            cgpa: menteeData.cgpa || calculateCGPA(progressData),
            currentSemester: menteeData.currentSemester || "Sem 3",
            year: getYearFromSemester(menteeData.currentSemester),
            lastInteraction: assignment.lastContact || "4 days ago",
            performanceStatus: menteeData.performanceStatus || "up",
            progressData: progressData,
            email: menteeData.email,
            phone: menteeData.phone,
          });
        }
      }

      setMentees(menteesData);
      setFilteredMentees(menteesData);
    } catch (err) {
      console.error("Error fetching mentees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenteeProgress = async (menteeId) => {
    try {
      // Fetch form submissions to get academic progress
      const formsQuery = query(
        collection(db, "formSubmissions"),
        where("menteeId", "==", menteeId),
        where("status", "==", "submitted")
      );
      const formsSnap = await getDocs(formsQuery);
      
      const progress = [];
      formsSnap.docs.forEach(doc => {
        const data = doc.data();
        if (data.responses && data.responses.cgpa) {
          progress.push({
            semester: data.semester,
            cgpa: parseFloat(data.responses.cgpa) || 0,
          });
        }
      });

      // Sort by semester
      progress.sort((a, b) => {
        const semA = parseInt(a.semester.replace("Sem ", ""));
        const semB = parseInt(b.semester.replace("Sem ", ""));
        return semA - semB;
      });

      return progress;
    } catch (err) {
      console.error("Error fetching progress:", err);
      return [];
    }
  };

  const calculateCGPA = (progressData) => {
    if (progressData.length === 0) return "3.8";
    const latest = progressData[progressData.length - 1];
    return latest.cgpa.toFixed(1);
  };

  const getYearFromSemester = (semester) => {
    if (!semester) return "FE";
    const semNum = parseInt(semester.replace("Sem ", ""));
    if (semNum <= 2) return "FE";
    if (semNum <= 4) return "SE";
    if (semNum <= 6) return "TE";
    return "BE";
  };

  const filterMenteesByYear = () => {
    if (selectedYear === "All") {
      setFilteredMentees(mentees);
    } else {
      setFilteredMentees(mentees.filter(m => m.year === selectedYear));
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
        return { bg: "#d1fae5", text: "#065f46", icon: "trending-up" };
      case "stable":
        return { bg: "#fef3c7", text: "#92400e", icon: "minus" };
      case "down":
        return { bg: "#fee2e2", text: "#991b1b", icon: "trending-down" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", icon: "minus" };
    }
  };

  const renderProgressChart = (progressData, cgpa) => {
    if (!progressData || progressData.length === 0) {
      return (
        <View style={styles.noProgressContainer}>
          <Text style={styles.noProgressText}>No progress data yet</Text>
        </View>
      );
    }

    const chartData = {
      labels: progressData.map(p => p.semester.replace("Semester ", "S")),
      datasets: [
        {
          data: progressData.map(p => p.cgpa),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Academic Progress</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 80}
          height={150}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 8,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#10b981",
            },
          }}
          bezier
          style={styles.chart}
        />
        <View style={styles.cgpaIndicator}>
          <Text style={styles.cgpaLabel}>Current CGPA</Text>
          <Text style={styles.cgpaValue}>{cgpa}</Text>
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>My Mentees</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Year Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter by Year</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterButtons}
        >
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.filterBtn,
                selectedYear === year && styles.filterBtnActive,
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  selectedYear === year && styles.filterBtnTextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Page Title */}
        <Text style={styles.pageTitle}>Mentee Progress Overview</Text>

        {filteredMentees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {selectedYear === "All"
                ? "No mentees assigned yet"
                : `No mentees in ${selectedYear}`}
            </Text>
          </View>
        ) : (
          filteredMentees.map((mentee) => {
            const statusStyle = getStatusColor(mentee.performanceStatus);
            return (
              <View key={mentee.id} style={styles.menteeCard}>
                {/* Mentee Header */}
                <View style={styles.menteeHeader}>
                  <View style={styles.menteeAvatar}>
                    <Feather name="user" size={24} color="#6b7280" />
                  </View>
                  <View style={styles.menteeBasicInfo}>
                    <Text style={styles.menteeName}>{mentee.name}</Text>
                    <Text style={styles.menteeId}>{mentee.regNo}</Text>
                    <Text style={styles.lastInteraction}>
                      Last interaction: {mentee.lastInteraction}
                    </Text>
                  </View>
                  <View style={styles.menteeStats}>
                    <Text style={styles.cgpaLarge}>{mentee.cgpa}</Text>
                    <Text style={styles.cgpaLabel}>Current CGPA</Text>
                    <View
                      style={[
                        styles.performanceBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Feather
                        name={statusStyle.icon}
                        size={12}
                        color={statusStyle.text}
                      />
                      <Text
                        style={[
                          styles.performanceText,
                          { color: statusStyle.text },
                        ]}
                      >
                        {mentee.performanceStatus}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Chart */}
                {renderProgressChart(mentee.progressData, mentee.cgpa)}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() =>
                      navigation.navigate("MenteeDetails", {
                        menteeId: mentee.id,
                      })
                    }
                  >
                    <Feather name="eye" size={16} color="#f59e0b" />
                    <Text style={styles.viewDetailsBtnText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.messageBtn}
                    onPress={() =>
                      navigation.navigate("SendMessage", {
                        menteeId: mentee.id,
                        menteeName: mentee.name,
                      })
                    }
                  >
                    <Feather name="message-circle" size={16} color="#fff" />
                    <Text style={styles.messageBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MentorDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="users" size={24} color="#f59e0b" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Mentees</Text>
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
  filterSection: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterBtnActive: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterBtnTextActive: {
    color: "#f59e0b",
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
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
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
    textAlign: "center",
  },
  menteeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  menteeHeader: {
    flexDirection: "row",
    marginBottom: 16,
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
  menteeBasicInfo: {
    flex: 1,
  },
  menteeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  menteeId: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  lastInteraction: {
    fontSize: 11,
    color: "#9ca3af",
  },
  menteeStats: {
    alignItems: "flex-end",
  },
  cgpaLarge: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10b981",
  },
  cgpaLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 4,
  },
  performanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  performanceText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  cgpaIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  cgpaValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
  },
  noProgressContainer: {
    padding: 20,
    alignItems: "center",
  },
  noProgressText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  viewDetailsBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
    gap: 6,
  },
  viewDetailsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f59e0b",
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f59e0b",
    gap: 6,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
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