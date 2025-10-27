// screens/MyMentees.js - CORRECTED FIREBASE INTEGRATION
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  Image,
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
import { LineChart } from "react-native-chart-kit";

export default function MyMentees({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        
        // Fetch mentee from users collection
        const userDoc = await getDoc(doc(db, "users", assignment.menteeId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Fetch from mentees collection for academic data
          let menteeAcademicData = {};
          try {
            const menteeDoc = await getDoc(doc(db, "mentees", assignment.menteeId));
            if (menteeDoc.exists()) {
              menteeAcademicData = menteeDoc.data();
            }
          } catch (err) {
            console.log("No mentees doc for:", assignment.menteeId);
          }
          
          // Calculate CGPA from sgpaHistory
          const sgpaHistory = menteeAcademicData.sgpaHistory || [];
          const currentCGPA = calculateCGPAFromHistory(sgpaHistory);
          
          menteesData.push({
            id: assignment.menteeId,
            assignmentId: assignmentDoc.id,
            name: `${userData.firstName} ${userData.lastName}`,
            email: userData.email,
            profilePic: userData.profilePic,
            regNo: menteeAcademicData.rollNumber || userData.rollNumber || "N/A",
            cgpa: currentCGPA,
            currentSemester: `Sem ${menteeAcademicData.currentSem || 1}`,
            year: getYearFromSemester(menteeAcademicData.currentSem || 1),
            lastInteraction: assignment.lastContact || "N/A",
            performanceStatus: determinePerformance(sgpaHistory),
            progressData: formatProgressData(sgpaHistory),
            phone: userData.phone,
          });
        }
      }

      setMentees(menteesData);
      setFilteredMentees(menteesData);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Error fetching mentees:", err);
      Alert.alert("Error", "Failed to load mentees");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateCGPAFromHistory = (sgpaHistory) => {
    if (!sgpaHistory || sgpaHistory.length === 0) return "N/A";
    
    // Calculate average of all SGPAs
    const total = sgpaHistory.reduce((sum, item) => sum + (item.sgpa || 0), 0);
    const average = total / sgpaHistory.length;
    return average.toFixed(2);
  };

  const formatProgressData = (sgpaHistory) => {
    if (!sgpaHistory || sgpaHistory.length === 0) return [];
    
    return sgpaHistory.map((item, index) => ({
      semester: `Sem ${item.sem || index + 1}`,
      cgpa: item.sgpa || 0,
    }));
  };

  const determinePerformance = (sgpaHistory) => {
    if (!sgpaHistory || sgpaHistory.length < 2) return "stable";
    
    const latest = sgpaHistory[sgpaHistory.length - 1]?.sgpa || 0;
    const previous = sgpaHistory[sgpaHistory.length - 2]?.sgpa || 0;
    
    if (latest > previous) return "up";
    if (latest < previous) return "down";
    return "stable";
  };

  const getYearFromSemester = (semNum) => {
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchMentees();
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
          <Text style={styles.noProgressText}>No progress data available</Text>
        </View>
      );
    }

    const chartData = {
      labels: progressData.map(p => `S${p.semester.replace("Sem ", "")}`),
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
        <Text style={styles.chartTitle}>Academic Progress (SGPA)</Text>
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
          <Text style={styles.cgpaLabel}>Average CGPA</Text>
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
          <Text style={styles.loadingText}>Loading mentees...</Text>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />
        }
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
                    {mentee.profilePic ? (
                      <Image source={{ uri: mentee.profilePic }} style={styles.menteeAvatarImage} />
                    ) : (
                      <Text style={styles.menteeAvatarText}>
                        {mentee.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    )}
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
                    <Text style={styles.cgpaLabel}>CGPA</Text>
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

                
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Navigation - NOT TOUCHED */}
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
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
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    marginBottom: 16,
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
