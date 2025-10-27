// screens/ViewProgress.js
import React, { useState, useEffect } from "react";
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
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

const { width } = Dimensions.get("window");

export default function Insights({ navigation }) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      // Fetch mentee's progress data from Firebase
      const menteeDoc = await getDoc(doc(db, "mentees", userId));

      if (menteeDoc.exists()) {
        const data = menteeDoc.data();

        // Sample course data - replace with actual data from Firebase
        const courseData = data.courses || [
          {
            name: "Data Structures",
            credits: 3,
            semester: "SEM 2",
            grade: "A",
            percentage: 94,
          },
          {
            name: "Database Systems",
            credits: 3,
            semester: "SEM 2",
            grade: "A-",
            percentage: 88,
          },
          {
            name: "Software Engineering",
            credits: 4,
            semester: "SEM 2",
            grade: "B+",
            percentage: 85,
          },
          {
            name: "Computer Networks",
            credits: 3,
            semester: "SEM 2",
            grade: "A",
            percentage: 94,
          },
          {
            name: "Operating Systems",
            credits: 4,
            semester: "SEM 2",
            grade: "B+",
            percentage: 87,
          },
        ];

        setCourses(courseData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading progress:", error);
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === "A" || grade === "A-") return "#10b981";
    if (grade === "B+" || grade === "B") return "#3b82f6";
    if (grade === "B-" || grade === "C+") return "#f59e0b";
    return "#ef4444";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate("MenteeDashboard")}
        >
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Academic Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Courses</Text>

          {courses.map((course, index) => (
            <View key={index} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseDetails}>
                    {course.credits} credits • {course.semester}
                  </Text>
                </View>
                <View style={styles.gradeContainer}>
                  <View
                    style={[
                      styles.gradeBadge,
                      { backgroundColor: `${getGradeColor(course.grade)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.gradeText,
                        { color: getGradeColor(course.grade) },
                      ]}
                    >
                      {course.grade}
                    </Text>
                  </View>
                  <Text style={styles.percentage}>{course.percentage}%</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Course Performance Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Performance</Text>

          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {courses.map((course, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${course.percentage}%`,
                          backgroundColor: "#10b981",
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel} numberOfLines={1}>
                    {course.name.split(" ")[0]}
                  </Text>
                </View>
              ))}
            </View>

            {/* Y-axis labels */}
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisLabel}>100</Text>
              <Text style={styles.yAxisLabel}>75</Text>
              <Text style={styles.yAxisLabel}>50</Text>
              <Text style={styles.yAxisLabel}>25</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  courseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  courseDetails: {
    fontSize: 13,
    color: "#6b7280",
  },
  gradeContainer: {
    alignItems: "flex-end",
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  percentage: {
    fontSize: 12,
    color: "#6b7280",
  },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
  },
  yAxisLabels: {
    justifyContent: "space-between",
    paddingRight: 8,
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
  },
  chartContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 200,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    width: "80%",
    height: 180,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});
