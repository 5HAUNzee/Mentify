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
import { useAuth } from "@clerk/clerk-expo";

export default function MentorAnnouncements({ navigation }) {
  const { signOut, userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [mentees, setMentees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [priority, setPriority] = useState("normal"); // 'low', 'normal', 'high'

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
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
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

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case "high":
        return { bg: "#FEE2E2", text: "#DC2626", icon: "alert-circle" };
      case "low":
        return { bg: "#DBEAFE", text: "#2563EB", icon: "info" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", icon: "bell" };
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
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Feather name="users" size={24} color="#2563EB" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Mentees</Text>
            <Text style={styles.infoValue}>{mentees.length} students</Text>
            <Text style={styles.infoSubtext}>
              Send announcements to all your mentees
            </Text>
          </View>
        </View>

        {/* Create Announcement Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={openAnnouncementModal}
        >
          <Feather name="plus-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Announcement</Text>
        </TouchableOpacity>

        {/* Announcements List */}
        <View style={styles.announcementsSection}>
          <Text style={styles.sectionTitle}>Recent Announcements</Text>
          {announcements.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="message-square" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No announcements yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first announcement to notify your mentees
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

        {/* Mentees List */}
        <View style={styles.menteesSection}>
          <Text style={styles.sectionTitle}>Your Mentees</Text>
          {mentees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="user-x" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No mentees assigned</Text>
            </View>
          ) : (
            mentees.map((mentee) => (
              <View key={mentee.id} style={styles.menteeCard}>
                <View style={styles.menteeAvatar}>
                  <Feather name="user" size={20} color="#2563EB" />
                </View>
                <View style={styles.menteeInfo}>
                  <Text style={styles.menteeName}>{mentee.name}</Text>
                  <Text style={styles.menteeRoll}>{mentee.rollNumber}</Text>
                  <Text style={styles.menteeEmail}>{mentee.email}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal for Announcement */}
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
                  placeholder="Type your announcement message here..."
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
                        color={priority === p ? "#2563EB" : "#9ca3af"}
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
                <Feather name="users" size={16} color="#6b7280" />
                <Text style={styles.recipientPreviewText}>
                  Will be sent to {mentees.length} mentee(s)
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={sendAnnouncement}
                  disabled={sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="send" size={16} color="#fff" />
                      <Text style={styles.submitButtonText}>
                        Send Announcement
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                  disabled={sending}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6b7280" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  logoutBtn: { color: "#ef4444", fontWeight: "bold" },
  content: { flex: 1 },
  contentContainer: { paddingBottom: 40 },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  infoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  infoValue: { fontSize: 20, fontWeight: "bold", marginTop: 4 },
  infoSubtext: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
  },
  createButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", margin: 16, color: "#111827" },
  announcementsSection: {},
  emptyContainer: { justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 16, color: "#6b7280", marginTop: 8 },
  emptySubtext: { fontSize: 12, color: "#9ca3af", marginTop: 4, textAlign: "center" },
  announcementCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  announcementHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  priorityBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 12, marginLeft: 4, fontWeight: "bold" },
  announcementTitle: { fontSize: 16, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  announcementMessage: { fontSize: 14, color: "#374151" },
  announcementFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  recipientInfo: { flexDirection: "row", alignItems: "center" },
  recipientText: { fontSize: 12, color: "#6b7280", marginLeft: 4 },
  announcementDate: { fontSize: 12, color: "#6b7280" },
  menteesSection: {},
  menteeCard: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  menteeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#DBEAFE", justifyContent: "center", alignItems: "center", marginRight: 12 },
  menteeInfo: { flex: 1 },
  menteeName: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  menteeRoll: { fontSize: 14, color: "#6b7280" },
  menteeEmail: { fontSize: 12, color: "#9ca3af" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
  modalContent: { margin: 16, backgroundColor: "#fff", borderRadius: 12, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalBody: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: "bold", color: "#111827", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 8, color: "#111827", backgroundColor: "#f9fafb" },
  textArea: { height: 100 },
  priorityOptions: { flexDirection: "row", justifyContent: "space-between" },
  priorityOption: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  priorityOptionActive: { borderColor: "#2563EB", backgroundColor: "#DBEAFE" },
  priorityOptionText: { marginLeft: 4, color: "#6b7280", fontWeight: "bold" },
  priorityOptionTextActive: { color: "#2563EB" },
  recipientPreview: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  recipientPreviewText: { marginLeft: 4, color: "#6b7280" },
  modalActions: { flexDirection: "row", justifyContent: "space-between" },
  submitButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563EB", padding: 12, borderRadius: 8, flex: 1, marginRight: 8 },
  submitButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 4 },
  cancelButton: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  cancelButtonText: { fontWeight: "bold", color: "#6b7280" },
});
