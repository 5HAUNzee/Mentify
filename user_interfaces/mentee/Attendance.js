import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";
import { deleteDoc } from "firebase/firestore";

export default function AttendanceTracker({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subjects, setSubjects] = useState([]);

  // Modal states
  const [addSubjectModalVisible, setAddSubjectModalVisible] = useState(false);
  const [addClassModalVisible, setAddClassModalVisible] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [classDate, setClassDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attended, setAttended] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);

      // Fetch subjects
      const subjectsRef = collection(db, "subjects");
      const subjectsQuery = query(
        subjectsRef,
        where("menteeId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const subjectsSnap = await getDocs(subjectsQuery);
      const subjectsList = [];

      for (const subjectDoc of subjectsSnap.docs) {
        const subjectData = {
          id: subjectDoc.id,
          ...subjectDoc.data(),
        };

        // Fetch attendance records for this subject
        const attendanceRef = collection(db, "attendance");
        const attendanceQuery = query(
          attendanceRef,
          where("subjectId", "==", subjectDoc.id),
          where("menteeId", "==", userId),
          orderBy("date", "desc")
        );

        const attendanceSnap = await getDocs(attendanceQuery);
        const attendanceRecords = attendanceSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate attendance percentage
        const totalClasses = attendanceRecords.length;
        const attendedClasses = attendanceRecords.filter(
          (record) => record.attended
        ).length;
        const percentage =
          totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 100;

        subjectData.totalClasses = totalClasses;
        subjectData.attendedClasses = attendedClasses;
        subjectData.percentage = percentage;
        subjectData.records = attendanceRecords;

        subjectsList.push(subjectData);
      }

      setSubjects(subjectsList);
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      Alert.alert("Error", "Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (subjectId) => {
    Alert.alert(
      "Delete Subject",
      "Are you sure you want to delete this subject and all its attendance records?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);

              // Delete all attendance records for this subject
              const attendanceRef = collection(db, "attendance");
              const attendanceQuery = query(
                attendanceRef,
                where("subjectId", "==", subjectId),
                where("menteeId", "==", userId)
              );
              const attendanceSnap = await getDocs(attendanceQuery);

              const deletePromises = attendanceSnap.docs.map((docSnap) =>
                updateDoc(doc(db, "attendance", docSnap.id), {
                  deleted: true,
                })
              );

              // You can use deleteDoc instead of updateDoc if you want to remove them entirely:
              // import { deleteDoc } from "firebase/firestore";
              // const deletePromises = attendanceSnap.docs.map((docSnap) =>
              //   deleteDoc(doc(db, "attendance", docSnap.id))
              // );

              await Promise.all(deletePromises);

              // Delete the subject itself
              const subjectRef = doc(db, "subjects", subjectId);
              await deleteDoc(subjectRef);

              Alert.alert(
                "Deleted",
                "Subject and all records deleted successfully!"
              );
              await fetchAttendanceData();
            } catch (err) {
              console.error("Error deleting subject:", err);
              Alert.alert("Error", "Failed to delete subject");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceData();
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

  const addSubject = async () => {
    if (!subjectName.trim()) {
      Alert.alert("Error", "Please enter subject name");
      return;
    }

    if (!subjectCode.trim()) {
      Alert.alert("Error", "Please enter subject code");
      return;
    }

    try {
      setSaving(true);

      const subjectData = {
        menteeId: userId,
        name: subjectName.trim(),
        code: subjectCode.trim().toUpperCase(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "subjects"), subjectData);

      Alert.alert("Success", "Subject added successfully!");
      setAddSubjectModalVisible(false);
      setSubjectName("");
      setSubjectCode("");
      await fetchAttendanceData();
    } catch (err) {
      console.error("Error adding subject:", err);
      Alert.alert("Error", "Failed to add subject");
    } finally {
      setSaving(false);
    }
  };

  const openAddClassModal = (subject) => {
    setSelectedSubject(subject);
    setClassDate(new Date().toISOString().split("T")[0]);
    setAttended(true);
    setAddClassModalVisible(true);
  };

  const addClass = async () => {
    if (!selectedSubject) {
      Alert.alert("Error", "No subject selected");
      return;
    }

    if (!classDate) {
      Alert.alert("Error", "Please select a date");
      return;
    }

    try {
      setSaving(true);

      const attendanceData = {
        menteeId: userId,
        subjectId: selectedSubject.id,
        date: classDate,
        attended: attended,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, "attendance"), attendanceData);

      Alert.alert("Success", "Attendance recorded successfully!");
      setAddClassModalVisible(false);
      await fetchAttendanceData();
    } catch (err) {
      console.error("Error recording attendance:", err);
      Alert.alert("Error", "Failed to record attendance");
    } finally {
      setSaving(false);
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage < 75) return "#ef4444"; // Red
    if (percentage < 85) return "#F59E0B"; // Orange
    return "#10B981"; // Green
  };

  const getPercentageBackground = (percentage) => {
    if (percentage < 75) return "#FEE2E2"; // Light red
    if (percentage < 85) return "#FEF3C7"; // Light orange
    return "#D1FAE5"; // Light green
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Tracker</Text>
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
        {/* Add Subject Button */}
        <TouchableOpacity
          style={styles.addSubjectButton}
          onPress={() => setAddSubjectModalVisible(true)}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addSubjectButtonText}>Add New Subject</Text>
        </TouchableOpacity>

        {/* Overall Stats */}
        {subjects.length > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Overall Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{subjects.length}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {subjects.reduce((sum, s) => sum + s.totalClasses, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {subjects.reduce((sum, s) => sum + s.attendedClasses, 0)}
                </Text>
                <Text style={styles.statLabel}>Attended</Text>
              </View>
            </View>
          </View>
        )}

        {/* Subjects List */}
        {subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="book-open" size={64} color="#9ca3af" />
            <Text style={styles.emptyText}>No subjects added yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first subject to start tracking attendance
            </Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.id} style={styles.subjectCard}>
              {/* Subject Header */}
              <View style={styles.subjectHeader}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectCode}>{subject.code}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    style={styles.addClassButton}
                    onPress={() => openAddClassModal(subject)}
                  >
                    <Feather name="plus" size={16} color="#2563EB" />
                    <Text style={styles.addClassButtonText}>Add Class</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteSubject(subject.id)}
                  >
                    <Feather name="trash-2" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Attendance Stats */}
              <View
                style={[
                  styles.attendanceStats,
                  {
                    backgroundColor: getPercentageBackground(
                      subject.percentage
                    ),
                  },
                ]}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statsColumn}>
                    <Text style={styles.statsNumber}>
                      {subject.attendedClasses}/{subject.totalClasses}
                    </Text>
                    <Text style={styles.statsText}>Classes Attended</Text>
                  </View>
                  <View style={styles.percentageContainer}>
                    <Text
                      style={[
                        styles.percentageText,
                        { color: getPercentageColor(subject.percentage) },
                      ]}
                    >
                      {subject.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${subject.percentage}%`,
                        backgroundColor: getPercentageColor(subject.percentage),
                      },
                    ]}
                  />
                </View>

                {/* Warning for low attendance */}
                {subject.percentage < 75 && (
                  <View style={styles.warningContainer}>
                    <Feather name="alert-triangle" size={16} color="#ef4444" />
                    <Text style={styles.warningText}>
                      Warning: Attendance below 75%! You need to attend{" "}
                      {Math.ceil(
                        (0.75 * subject.totalClasses -
                          subject.attendedClasses) /
                          0.25
                      )}{" "}
                      more consecutive classes to reach 75%
                    </Text>
                  </View>
                )}
              </View>

              {/* Recent Classes */}
              {subject.records.length > 0 && (
                <View style={styles.recentClasses}>
                  <Text style={styles.recentClassesTitle}>Recent Classes</Text>
                  {subject.records.slice(0, 5).map((record) => (
                    <View key={record.id} style={styles.classRecord}>
                      <View style={styles.classRecordLeft}>
                        <Feather
                          name={record.attended ? "check-circle" : "x-circle"}
                          size={16}
                          color={record.attended ? "#10B981" : "#ef4444"}
                        />
                        <Text style={styles.classDate}>{record.date}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: record.attended
                              ? "#D1FAE5"
                              : "#FEE2E2",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: record.attended ? "#10B981" : "#ef4444",
                            },
                          ]}
                        >
                          {record.attended ? "Present" : "Absent"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Subject Modal */}
      <Modal
        visible={addSubjectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddSubjectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Subject</Text>
              <TouchableOpacity
                onPress={() => setAddSubjectModalVisible(false)}
              >
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject Name *</Text>
                <TextInput
                  style={styles.input}
                  value={subjectName}
                  onChangeText={setSubjectName}
                  placeholder="e.g., Data Structures"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject Code *</Text>
                <TextInput
                  style={styles.input}
                  value={subjectCode}
                  onChangeText={setSubjectCode}
                  placeholder="e.g., CS201"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={addSubject}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="plus" size={16} color="#fff" />
                      <Text style={styles.submitButtonText}>Add Subject</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setAddSubjectModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Class Modal */}
      <Modal
        visible={addClassModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddClassModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Record Attendance - {selectedSubject?.name}
              </Text>
              <TouchableOpacity onPress={() => setAddClassModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TextInput
                  style={styles.input}
                  value={classDate}
                  onChangeText={setClassDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Attendance Status *</Text>
                <View style={styles.attendanceOptions}>
                  <TouchableOpacity
                    style={[
                      styles.attendanceOption,
                      attended && styles.attendanceOptionActive,
                    ]}
                    onPress={() => setAttended(true)}
                  >
                    <Feather
                      name="check-circle"
                      size={20}
                      color={attended ? "#10B981" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.attendanceOptionText,
                        attended && styles.attendanceOptionTextActive,
                      ]}
                    >
                      Present
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.attendanceOption,
                      !attended && styles.attendanceOptionActive,
                    ]}
                    onPress={() => setAttended(false)}
                  >
                    <Feather
                      name="x-circle"
                      size={20}
                      color={!attended ? "#ef4444" : "#9ca3af"}
                    />
                    <Text
                      style={[
                        styles.attendanceOptionText,
                        !attended && styles.attendanceOptionTextActive,
                      ]}
                    >
                      Absent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={addClass}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="save" size={16} color="#fff" />
                      <Text style={styles.submitButtonText}>
                        Record Attendance
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setAddClassModalVisible(false)}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  deleteButton: {
    backgroundColor: "#FEE2E2",
    padding: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  addSubjectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addSubjectButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
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
  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  subjectCode: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  addClassButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addClassButtonText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "600",
  },
  attendanceStats: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statsColumn: {
    flex: 1,
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  statsText: {
    fontSize: 12,
    color: "#6b7280",
  },
  percentageContainer: {
    alignItems: "flex-end",
  },
  percentageText: {
    fontSize: 28,
    fontWeight: "700",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 6,
    gap: 8,
    marginTop: 4,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
    lineHeight: 16,
  },
  recentClasses: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  recentClassesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  classRecord: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  classRecordLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  classDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  modalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  attendanceOptions: {
    flexDirection: "row",
    gap: 12,
  },
  attendanceOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    gap: 8,
  },
  attendanceOptionActive: {
    backgroundColor: "#fff",
    borderColor: "#2563EB",
  },
  attendanceOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  attendanceOptionTextActive: {
    color: "#111827",
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});
