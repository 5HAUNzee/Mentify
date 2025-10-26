import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function MentorProgress({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mentees, setMentees] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    lowCGPA: 0,
    lowAttendance: 0,
    atRisk: 0,
  });

  useEffect(() => {
    fetchMenteesProgress();
  }, []);

  const fetchMenteesProgress = async () => {
    try {
      setLoading(true);

      // Fetch assigned mentees
      const assignmentsRef = collection(db, "assignments");
      const assignmentsQuery = query(
        assignmentsRef,
        where("mentorId", "==", userId)
      );

      const assignmentsSnap = await getDocs(assignmentsQuery);
      const menteesList = [];
      let lowCGPACount = 0;
      let lowAttendanceCount = 0;
      let atRiskCount = 0;

      for (const assignmentDoc of assignmentsSnap.docs) {
        const menteeId = assignmentDoc.data().menteeId;

        // Get user details
        const userDoc = await getDoc(doc(db, "users", menteeId));
        if (!userDoc.exists()) continue;

        const userData = userDoc.data();

        // Get mentee academic details
        const menteeDetailsDoc = await getDoc(doc(db, "mentees", menteeId));
        if (!menteeDetailsDoc.exists()) continue;

        const menteeDetails = menteeDetailsDoc.data();

        // Calculate CGPA
        const sgpaHistory = menteeDetails.sgpaHistory || [];
        let cgpa = 0;
        if (sgpaHistory.length > 0) {
          const total = sgpaHistory.reduce((sum, item) => sum + item.sgpa, 0);
          cgpa = total / sgpaHistory.length;
        }

        // Fetch attendance data
        const subjectsRef = collection(db, "subjects");
        const subjectsQuery = query(
          subjectsRef,
          where("menteeId", "==", menteeId)
        );

        const subjectsSnap = await getDocs(subjectsQuery);
        let totalClasses = 0;
        let totalAttended = 0;
        const subjects = [];

        for (const subjectDoc of subjectsSnap.docs) {
          const subjectData = subjectDoc.data();

          // Fetch attendance records
          const attendanceRef = collection(db, "attendance");
          const attendanceQuery = query(
            attendanceRef,
            where("subjectId", "==", subjectDoc.id),
            where("menteeId", "==", menteeId)
          );

          const attendanceSnap = await getDocs(attendanceQuery);
          const records = attendanceSnap.docs.map((doc) => doc.data());

          const classCount = records.length;
          const attendedCount = records.filter((r) => r.attended).length;
          const percentage =
            classCount > 0 ? (attendedCount / classCount) * 100 : 100;

          totalClasses += classCount;
          totalAttended += attendedCount;

          subjects.push({
            name: subjectData.name,
            code: subjectData.code,
            total: classCount,
            attended: attendedCount,
            percentage: percentage,
          });
        }

        const overallAttendance =
          totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 100;

        // Determine status
        const lowCGPA = cgpa > 0 && cgpa < 6.5;
        const lowAttendance = overallAttendance < 75;
        const atRisk = lowCGPA || lowAttendance;

        if (lowCGPA) lowCGPACount++;
        if (lowAttendance) lowAttendanceCount++;
        if (atRisk) atRiskCount++;

        menteesList.push({
          id: menteeId,
          name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
          rollNumber: menteeDetails.rollNumber || "N/A",
          currentSem: menteeDetails.currentSem || 1,
          cgpa: cgpa,
          overallAttendance: overallAttendance,
          subjects: subjects,
          lowCGPA: lowCGPA,
          lowAttendance: lowAttendance,
          atRisk: atRisk,
        });
      }

      // Sort: at-risk students first, then by CGPA
      menteesList.sort((a, b) => {
        if (a.atRisk && !b.atRisk) return -1;
        if (!a.atRisk && b.atRisk) return 1;
        return a.cgpa - b.cgpa;
      });

      setMentees(menteesList);
      setStats({
        total: menteesList.length,
        lowCGPA: lowCGPACount,
        lowAttendance: lowAttendanceCount,
        atRisk: atRiskCount,
      });
    } catch (err) {
      console.error("Error fetching mentees progress:", err);
      Alert.alert("Error", "Failed to load mentees progress");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMenteesProgress();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const getCGPAColor = (cgpa) => {
    if (cgpa >= 8) return "#10B981";
    if (cgpa >= 6.5) return "#F59E0B";
    return "#ef4444";
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return "#10B981";
    if (percentage >= 75) return "#F59E0B";
    return "#ef4444";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading progress data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mentees Progress</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#EFF6FF" },
              ]}
            >
              <Feather name="users" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Mentees</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FEE2E2" },
              ]}
            >
              <Feather name="alert-triangle" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>
              {stats.atRisk}
            </Text>
            <Text style={styles.statLabel}>At Risk</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FEF3C7" },
              ]}
            >
              <Feather name="trending-down" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.statValue, { color: "#F59E0B" }]}>
              {stats.lowCGPA}
            </Text>
            <Text style={styles.statLabel}>Low CGPA</Text>
          </View>

          <View style={styles.statCard}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FFEDD5" },
              ]}
            >
              <Feather name="calendar" size={20} color="#F97316" />
            </View>
            <Text style={[styles.statValue, { color: "#F97316" }]}>
              {stats.lowAttendance}
            </Text>
            <Text style={styles.statLabel}>Low Attendance</Text>
          </View>
        </View>

        {/* Mentees List */}
        <View style={styles.menteesSection}>
          <Text style={styles.sectionTitle}>Student Performance</Text>

          {mentees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="user-x" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No mentees assigned</Text>
              <Text style={styles.emptySubtext}>
                You don't have any assigned mentees yet
              </Text>
            </View>
          ) : (
            mentees.map((mentee) => (
              <View
                key={mentee.id}
                style={[
                  styles.menteeCard,
                  mentee.atRisk && styles.menteeCardAtRisk,
                ]}
              >
                {/* Mentee Header */}
                <View style={styles.menteeHeader}>
                  <View style={styles.menteeAvatar}>
                    <Feather name="user" size={20} color="#2563EB" />
                  </View>
                  <View style={styles.menteeHeaderInfo}>
                    <Text style={styles.menteeName}>{mentee.name}</Text>
                    <Text style={styles.menteeRoll}>
                      {mentee.rollNumber} • Sem {mentee.currentSem}
                    </Text>
                  </View>
                  {mentee.atRisk && (
                    <View style={styles.riskBadge}>
                      <Feather name="alert-circle" size={14} color="#ef4444" />
                    </View>
                  )}
                </View>

                {/* Academic Performance */}
                <View style={styles.performanceSection}>
                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceLabel}>CGPA</Text>
                    <Text
                      style={[
                        styles.performanceValue,
                        { color: getCGPAColor(mentee.cgpa) },
                      ]}
                    >
                      {mentee.cgpa > 0 ? mentee.cgpa.toFixed(2) : "N/A"}
                    </Text>
                    {mentee.lowCGPA && (
                      <View style={styles.warningBadge}>
                        <Feather name="alert-triangle" size={10} color="#ef4444" />
                        <Text style={styles.warningText}>Below 6.5</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.performanceItem}>
                    <Text style={styles.performanceLabel}>Attendance</Text>
                    <Text
                      style={[
                        styles.performanceValue,
                        { color: getAttendanceColor(mentee.overallAttendance) },
                      ]}
                    >
                      {mentee.overallAttendance.toFixed(1)}%
                    </Text>
                    {mentee.lowAttendance && (
                      <View style={styles.warningBadge}>
                        <Feather name="alert-triangle" size={10} color="#ef4444" />
                        <Text style={styles.warningText}>Below 75%</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Subject-wise Attendance */}
                {mentee.subjects.length > 0 && (
                  <View style={styles.subjectsSection}>
                    <Text style={styles.subjectsSectionTitle}>
                      Subject-wise Attendance
                    </Text>
                    {mentee.subjects.map((subject, index) => (
                      <View key={index} style={styles.subjectRow}>
                        <View style={styles.subjectInfo}>
                          <Text style={styles.subjectName}>{subject.name}</Text>
                          <Text style={styles.subjectCode}>{subject.code}</Text>
                        </View>
                        <View style={styles.subjectStats}>
                          <Text
                            style={[
                              styles.subjectPercentage,
                              { color: getAttendanceColor(subject.percentage) },
                            ]}
                          >
                            {subject.percentage.toFixed(1)}%
                          </Text>
                          <Text style={styles.subjectClasses}>
                            {subject.attended}/{subject.total}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      // Navigate to send message or announcement
                      Alert.alert(
                        "Contact Student",
                        `Send a message to ${mentee.name}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Send Message",
                            onPress: () => {
                              // Navigate to announcements with pre-filled data
                              navigation.navigate("MentorAnnouncements");
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Feather name="message-circle" size={16} color="#2563EB" />
                    <Text style={styles.actionButtonText}>Message</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={() => {
                      Alert.alert(
                        "Student Details",
                        `Name: ${mentee.name}\nRoll: ${mentee.rollNumber}\nSemester: ${mentee.currentSem}\nCGPA: ${mentee.cgpa.toFixed(2)}\nAttendance: ${mentee.overallAttendance.toFixed(1)}%`
                      );
                    }}
                  >
                    <Feather name="eye" size={16} color="#fff" />
                    <Text style={styles.actionButtonTextPrimary}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Legend */}
        {mentees.length > 0 && (
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Performance Indicators</Text>
            <View style={styles.legendItems}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                <Text style={styles.legendText}>Good (CGPA ≥8, Attendance ≥85%)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
                <Text style={styles.legendText}>
                  Average (CGPA 6.5-8, Attendance 75-85%)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                <Text style={styles.legendText}>
                  At Risk (CGPA &lt;6.5, Attendance &lt;75%)
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    padding: 20,
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
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
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
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  menteesSection: {
    marginTop: 8,
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
    padding: 48,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  menteeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menteeCardAtRisk: {
    borderColor: "#fca5a5",
    backgroundColor: "#fef2f2",
  },
  menteeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  menteeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menteeHeaderInfo: {
    flex: 1,
  },
  menteeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  menteeRoll: {
    fontSize: 12,
    color: "#6b7280",
  },
  riskBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  performanceSection: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  performanceItem: {
    flex: 1,
    alignItems: "center",
  },
  performanceLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  warningText: {
    fontSize: 9,
    color: "#ef4444",
    fontWeight: "600",
  },
  divider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
  },
  subjectsSection: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    marginBottom: 12,
  },
  subjectsSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 11,
    color: "#9ca3af",
  },
  subjectStats: {
    alignItems: "flex-end",
  },
  subjectPercentage: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  subjectClasses: {
    fontSize: 11,
    color: "#6b7280",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563EB",
    backgroundColor: "#fff",
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  actionButtonPrimary: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  actionButtonTextPrimary: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  legendCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6b7280",
  },
});