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
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function MenteeChat({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [mentorData, setMentorData] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [monthlyLimits, setMonthlyLimits] = useState({
    mentorship: 0,
    studies: 0,
  });

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [doubtType, setDoubtType] = useState("mentorship"); // 'mentorship' or 'studies'
  const [doubtText, setDoubtText] = useState("");
  const [doubtSubject, setDoubtSubject] = useState("");

  useEffect(() => {
    fetchChatData();
  }, []);

  const fetchChatData = async () => {
    try {
      setLoading(true);

      // Get mentor assignment
      const assignmentsRef = collection(db, "assignments");
      const assignmentQuery = query(
        assignmentsRef,
        where("menteeId", "==", userId)
      );
      const assignmentSnap = await getDocs(assignmentQuery);

      if (assignmentSnap.empty) {
        Alert.alert("No Mentor", "You don't have a mentor assigned yet.");
        setLoading(false);
        return;
      }

      const mentorId = assignmentSnap.docs[0].data().mentorId;

      // Get mentor info
      const mentorDoc = await getDoc(doc(db, "users", mentorId));
      if (mentorDoc.exists()) {
        const mentor = mentorDoc.data();
        setMentorData({
          id: mentorId,
          name: `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim(),
          department: mentor.department || "",
          profilePic: mentor.profilePic || null,
        });
      }

      // Fetch doubts
      await fetchDoubts(mentorId);
    } catch (err) {
      console.error("Error fetching chat data:", err);
      Alert.alert("Error", "Failed to load chat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoubts = async (mentorId) => {
    try {
      const doubtsRef = collection(db, "doubts");
      const doubtsQuery = query(
        doubtsRef,
        where("menteeId", "==", userId),
        where("mentorId", "==", mentorId),
        orderBy("createdAt", "desc")
      );

      const doubtsSnap = await getDocs(doubtsQuery);
      const doubtsList = doubtsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDoubts(doubtsList);

      // Calculate monthly limits
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const mentorshipCount = doubtsList.filter((d) => {
        const doubtDate = d.createdAt?.toDate();
        return (
          d.type === "mentorship" &&
          doubtDate &&
          doubtDate.getMonth() === currentMonth &&
          doubtDate.getFullYear() === currentYear
        );
      }).length;

      const studiesCount = doubtsList.filter((d) => {
        const doubtDate = d.createdAt?.toDate();
        return (
          d.type === "studies" &&
          doubtDate &&
          doubtDate.getMonth() === currentMonth &&
          doubtDate.getFullYear() === currentYear
        );
      }).length;

      setMonthlyLimits({
        mentorship: mentorshipCount,
        studies: studiesCount,
      });
    } catch (err) {
      console.error("Error fetching doubts:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (mentorData) {
      await fetchDoubts(mentorData.id);
    }
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

  const openDoubtModal = (type) => {
    // Check if limit reached
    if (monthlyLimits[type] >= 5) {
      Alert.alert(
        "Limit Reached",
        `You have already asked 5 ${type} questions this month. Please wait until next month.`
      );
      return;
    }

    setDoubtType(type);
    setDoubtText("");
    setDoubtSubject("");
    setModalVisible(true);
  };

  const submitDoubt = async () => {
    if (!doubtSubject.trim()) {
      Alert.alert("Error", "Please enter a subject for your doubt");
      return;
    }

    if (!doubtText.trim()) {
      Alert.alert("Error", "Please enter your doubt");
      return;
    }

    if (!mentorData) {
      Alert.alert("Error", "Mentor information not available");
      return;
    }

    try {
      setSending(true);

      const doubtData = {
        menteeId: userId,
        mentorId: mentorData.id,
        type: doubtType,
        subject: doubtSubject.trim(),
        question: doubtText.trim(),
        reply: null,
        status: "pending",
        createdAt: Timestamp.now(),
        repliedAt: null,
      };

      await addDoc(collection(db, "doubts"), doubtData);

      Alert.alert("Success", "Your doubt has been sent to your mentor!");
      setModalVisible(false);
      setDoubtText("");
      setDoubtSubject("");

      // Refresh doubts list
      await fetchDoubts(mentorData.id);
    } catch (err) {
      console.error("Error submitting doubt:", err);
      Alert.alert("Error", "Failed to send doubt. Please try again.");
    } finally {
      setSending(false);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "replied":
        return "#10B981";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending Reply";
      case "replied":
        return "Replied";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!mentorData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ask Mentor</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.logoutBtn}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Feather name="user-x" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No mentor assigned yet</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ask Mentor</Text>
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
        {/* Mentor Info Card */}
        <View style={styles.mentorCard}>
          <View style={styles.mentorHeader}>
            <View style={styles.mentorAvatar}>
              <Feather name="user" size={24} color="#2563EB" />
            </View>
            <View style={styles.mentorInfo}>
              <Text style={styles.mentorName}>{mentorData.name}</Text>
              <Text style={styles.mentorDept}>{mentorData.department}</Text>
            </View>
          </View>
        </View>

        {/* Monthly Limit Cards */}
        <View style={styles.limitsContainer}>
          <View style={styles.limitCard}>
            <View style={styles.limitHeader}>
              <Feather name="file-text" size={18} color="#2563EB" />
              <Text style={styles.limitTitle}>Mentorship Forms</Text>
            </View>
            <Text style={styles.limitCount}>
              {monthlyLimits.mentorship} / 5 asked this month
            </Text>
            <TouchableOpacity
              style={[
                styles.askButton,
                monthlyLimits.mentorship >= 5 && styles.askButtonDisabled,
              ]}
              onPress={() => openDoubtModal("mentorship")}
              disabled={monthlyLimits.mentorship >= 5}
            >
              <Feather
                name="plus"
                size={16}
                color={monthlyLimits.mentorship >= 5 ? "#9ca3af" : "#fff"}
              />
              <Text
                style={[
                  styles.askButtonText,
                  monthlyLimits.mentorship >= 5 && styles.askButtonTextDisabled,
                ]}
              >
                Ask Question
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.limitCard}>
            <View style={styles.limitHeader}>
              <Feather name="book-open" size={18} color="#10B981" />
              <Text style={styles.limitTitle}>Study Doubts</Text>
            </View>
            <Text style={styles.limitCount}>
              {monthlyLimits.studies} / 5 asked this month
            </Text>
            <TouchableOpacity
              style={[
                styles.askButton,
                styles.askButtonGreen,
                monthlyLimits.studies >= 5 && styles.askButtonDisabled,
              ]}
              onPress={() => openDoubtModal("studies")}
              disabled={monthlyLimits.studies >= 5}
            >
              <Feather
                name="plus"
                size={16}
                color={monthlyLimits.studies >= 5 ? "#9ca3af" : "#fff"}
              />
              <Text
                style={[
                  styles.askButtonText,
                  monthlyLimits.studies >= 5 && styles.askButtonTextDisabled,
                ]}
              >
                Ask Question
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Doubts List */}
        <View style={styles.doubtsSection}>
          <Text style={styles.sectionTitle}>Your Questions & Replies</Text>

          {doubts.length === 0 ? (
            <View style={styles.emptyDoubts}>
              <Feather name="message-circle" size={48} color="#9ca3af" />
              <Text style={styles.emptyDoubtsText}>No questions asked yet</Text>
              <Text style={styles.emptyDoubtsSubtext}>
                Start by asking a question to your mentor
              </Text>
            </View>
          ) : (
            doubts.map((doubt) => (
              <View key={doubt.id} style={styles.doubtCard}>
                <View style={styles.doubtHeader}>
                  <View
                    style={[
                      styles.doubtTypeBadge,
                      doubt.type === "mentorship"
                        ? styles.doubtTypeBadgeBlue
                        : styles.doubtTypeBadgeGreen,
                    ]}
                  >
                    <Feather
                      name={
                        doubt.type === "mentorship" ? "file-text" : "book-open"
                      }
                      size={12}
                      color={
                        doubt.type === "mentorship" ? "#2563EB" : "#10B981"
                      }
                    />
                    <Text
                      style={[
                        styles.doubtTypeText,
                        doubt.type === "mentorship"
                          ? styles.doubtTypeTextBlue
                          : styles.doubtTypeTextGreen,
                      ]}
                    >
                      {doubt.type === "mentorship"
                        ? "Mentorship Form"
                        : "Study Doubt"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(doubt.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(doubt.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.doubtSubject}>{doubt.subject}</Text>

                {/* Question */}
                <View style={styles.messageContainer}>
                  <View style={styles.messageHeader}>
                    <Feather name="user" size={14} color="#6b7280" />
                    <Text style={styles.messageLabel}>Your Question</Text>
                  </View>
                  <Text style={styles.questionText}>{doubt.question}</Text>
                  <Text style={styles.messageDate}>
                    {formatDate(doubt.createdAt)}
                  </Text>
                </View>

                {/* Reply */}
                {doubt.reply ? (
                  <View style={styles.replyContainer}>
                    <View style={styles.messageHeader}>
                      <Feather name="user-check" size={14} color="#2563EB" />
                      <Text style={styles.replyLabel}>Mentor's Reply</Text>
                    </View>
                    <Text style={styles.replyText}>{doubt.reply}</Text>
                    <Text style={styles.messageDate}>
                      {formatDate(doubt.repliedAt)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pendingReply}>
                    <Feather name="clock" size={16} color="#F59E0B" />
                    <Text style={styles.pendingReplyText}>
                      Waiting for mentor's reply...
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Ask Doubt Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Ask{" "}
                {doubtType === "mentorship" ? "Mentorship Form" : "Study Doubt"}{" "}
                Question
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject *</Text>
                <TextInput
                  style={styles.input}
                  value={doubtSubject}
                  onChangeText={setDoubtSubject}
                  placeholder="Brief subject of your question"
                  placeholderTextColor="#9ca3af"
                  maxLength={100}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Question *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={doubtText}
                  onChangeText={setDoubtText}
                  placeholder="Describe your doubt in detail..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitDoubt}
                  disabled={sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="send" size={16} color="#fff" />
                      <Text style={styles.submitButtonText}>Send Question</Text>
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
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeForms")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeChat")}
        >
          <Feather name="message-circle" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Doubts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MenteeProfile")}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  mentorCard: {
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
  mentorHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  mentorDept: {
    fontSize: 14,
    color: "#6b7280",
  },
  limitsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  limitCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  limitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginLeft: 6,
  },
  limitCount: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  askButtonGreen: {
    backgroundColor: "#10B981",
  },
  askButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  askButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  askButtonTextDisabled: {
    color: "#9ca3af",
  },
  doubtsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  emptyDoubts: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyDoubtsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
  },
  emptyDoubtsSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  doubtCard: {
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
  doubtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  doubtTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  doubtTypeBadgeBlue: {
    backgroundColor: "#EFF6FF",
  },
  doubtTypeBadgeGreen: {
    backgroundColor: "#ECFDF5",
  },
  doubtTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  doubtTypeTextBlue: {
    color: "#2563EB",
  },
  doubtTypeTextGreen: {
    color: "#10B981",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  doubtSubject: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  messageContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 4,
  },
  questionText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    marginBottom: 6,
  },
  messageDate: {
    fontSize: 11,
    color: "#9ca3af",
  },
  replyContainer: {
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#2563EB",
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 4,
  },
  replyText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    marginBottom: 6,
  },
  pendingReply: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    gap: 8,
  },
  pendingReplyText: {
    fontSize: 13,
    color: "#F59E0B",
    fontWeight: "500",
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
    maxHeight: "80%",
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
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
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
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "space-around",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 5,
  },
  navLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  navLabelActive: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
