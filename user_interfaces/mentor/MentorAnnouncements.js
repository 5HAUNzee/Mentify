// screens/MentorAnnouncements.js - IMPROVED UI
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
  orderBy,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth, useClerk } from "@clerk/clerk-expo";

export default function MentorAnnouncements({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [mentees, setMentees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch mentees
      const assignmentsRef = collection(db, "assignments");
      const assignmentsQuery = query(
        assignmentsRef,
        where("mentorId", "==", userId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);
      const menteesList = [];

      for (const assignmentDoc of assignmentsSnap.docs) {
        const menteeId = assignmentDoc.data().menteeId;
        const userDoc = await getDoc(doc(db, "users", menteeId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const menteeDetailsDoc = await getDoc(doc(db, "mentees", menteeId));
          let rollNumber = "N/A";
          if (menteeDetailsDoc.exists()) {
            rollNumber = menteeDetailsDoc.data().rollNumber || "N/A";
          }
          menteesList.push({
            id: menteeId,
            name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
            rollNumber,
            email: userData.email || "",
          });
        }
      }
      setMentees(menteesList);

      // Fetch announcements
      const announcementsRef = collection(db, "announcements");
      const announcementsQuery = query(
        announcementsRef,
        where("mentorId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const announcementsSnap = await getDocs(announcementsQuery);
      const announcementsList = announcementsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAnnouncements(announcementsList);
    } catch (err) {
      console.error("Error fetching data:", err);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case "high":
        return { bg: "#fee2e2", text: "#dc2626", icon: "alert-circle" };
      case "low":
        return { bg: "#dbeafe", text: "#2563eb", icon: "info" };
      default:
        return { bg: "#fef3c7", text: "#d97706", icon: "bell" };
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    Alert.alert(
      "Delete Announcement",
      "Are you sure you want to delete this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "announcements", announcementId));
              Alert.alert("Success", "Announcement deleted");
              await fetchData();
            } catch (err) {
              console.error("Error deleting announcement:", err);
              Alert.alert("Error", "Failed to delete announcement");
            }
          },
        },
      ]
    );
  };

  const openAnnouncementModal = () => {
    setAnnouncementTitle("");
    setAnnouncementMessage("");
    setPriority("normal");
    setModalVisible(true);
  };

  const sendAnnouncement = async () => {
    if (!announcementTitle.trim()) {
      Alert.alert("Error", "Please enter announcement title");
      return;
    }
    if (!announcementMessage.trim()) {
      Alert.alert("Error", "Please enter announcement message");
      return;
    }
    if (mentees.length === 0) {
      Alert.alert("No Mentees", "You don't have any assigned mentees");
      return;
    }

    Alert.alert(
      "Send Announcement",
      `Send this announcement to ${mentees.length} mentee(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            try {
              setSending(true);
              const announcementData = {
                mentorId: userId,
                title: announcementTitle.trim(),
                message: announcementMessage.trim(),
                priority,
                recipientCount: mentees.length,
                recipients: mentees.map((m) => m.id),
                createdAt: Timestamp.now(),
              };
              await addDoc(collection(db, "announcements"), announcementData);
              Alert.alert(
                "Success",
                `Announcement sent to ${mentees.length} mentee(s)!`
              );
              setModalVisible(false);
              setAnnouncementTitle("");
              setAnnouncementMessage("");
              await fetchData();
            } catch (err) {
              console.error("Error sending announcement:", err);
              Alert.alert("Error", "Failed to send announcement");
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />
        }
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsIconCircle}>
            <Feather name="users" size={28} color="#f59e0b" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsValue}>{mentees.length}</Text>
            <Text style={styles.statsLabel}>Your Mentees</Text>
          </View>
          <View style={styles.statsIconCircle}>
            <Feather name="megaphone" size={28} color="#f59e0b" />
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsValue}>{announcements.length}</Text>
            <Text style={styles.statsLabel}>Announcements</Text>
          </View>
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={openAnnouncementModal}
        >
          <Feather name="plus-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Announcement</Text>
        </TouchableOpacity>

        {/* Announcements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Announcements</Text>
          {announcements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="megaphone" size={40} color="#d1d5db" />
              </View>
              <Text style={styles.emptyText}>No announcements yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first announcement
              </Text>
            </View>
          ) : (
            announcements.map((announcement) => {
              const priorityConfig = getPriorityConfig(announcement.priority);
              return (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityConfig.bg },
                      ]}
                    >
                      <Feather
                        name={priorityConfig.icon}
                        size={12}
                        color={priorityConfig.text}
                      />
                      <Text
                        style={[
                          styles.priorityText,
                          { color: priorityConfig.text },
                        ]}
                      >
                        {announcement.priority}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteAnnouncement(announcement.id)}
                    >
                      <Feather name="trash-2" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.announcementTitle}>
                    {announcement.title}
                  </Text>
                  <Text style={styles.announcementMessage}>
                    {announcement.message}
                  </Text>
                  <View style={styles.announcementFooter}>
                    <View style={styles.recipientInfo}>
                      <Feather name="users" size={14} color="#6b7280" />
                      <Text style={styles.recipientText}>
                        {announcement.recipientCount} recipient(s)
                      </Text>
                    </View>
                    <Text style={styles.announcementDate}>
                      {formatDate(announcement.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Announcement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={announcementTitle}
                  onChangeText={setAnnouncementTitle}
                  placeholder="e.g., Important: Exam Schedule"
                  placeholderTextColor="#9ca3af"
                  maxLength={100}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={announcementMessage}
                  onChangeText={setAnnouncementMessage}
                  placeholder="Type your announcement message..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityOptions}>
                  {["low", "normal", "high"].map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityOption,
                        priority === p && styles.priorityOptionActive,
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Feather
                        name={
                          p === "low"
                            ? "info"
                            : p === "normal"
                            ? "bell"
                            : "alert-circle"
                        }
                        size={16}
                        color={priority === p ? "#f59e0b" : "#9ca3af"}
                      />
                      <Text
                        style={[
                          styles.priorityOptionText,
                          priority === p && styles.priorityOptionTextActive,
                        ]}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.recipientPreview}>
                <Feather name="users" size={16} color="#f59e0b" />
                <Text style={styles.recipientPreviewText}>
                  Will be sent to {mentees.length} mentee(s)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={sendAnnouncement}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="send" size={18} color="#fff" />
                    <Text style={styles.submitButtonText}>
                      Send Announcement
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbbf24",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statsIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  statsInfo: {
    alignItems: "center",
  },
  statsValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#92400e",
  },
  statsLabel: {
    fontSize: 12,
    color: "#b45309",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
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
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9ca3af",
  },
  announcementCard: {
    backgroundColor: "#fff",
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  deleteButton: {
    padding: 4,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  announcementMessage: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipientText: {
    fontSize: 12,
    color: "#6b7280",
  },
  announcementDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  textArea: {
    height: 120,
  },
  priorityOptions: {
    flexDirection: "row",
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    gap: 6,
  },
  priorityOptionActive: {
    borderColor: "#f59e0b",
    backgroundColor: "#fef3c7",
  },
  priorityOptionText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  priorityOptionTextActive: {
    color: "#f59e0b",
    fontWeight: "600",
  },
  recipientPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  recipientPreviewText: {
    fontSize: 13,
    color: "#92400e",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
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
});
