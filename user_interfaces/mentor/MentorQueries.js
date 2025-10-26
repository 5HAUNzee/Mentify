import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function MentorQueries({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [doubts, setDoubts] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    replied: 0,
    mentorship: 0,
    studies: 0,
  });

  // Modal states
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      setLoading(true);

      const doubtsRef = collection(db, "doubts");
      const doubtsQuery = query(
        doubtsRef,
        where("mentorId", "==", userId),
        orderBy("createdAt", "desc")
      );

      const doubtsSnap = await getDocs(doubtsQuery);
      const doubtsList = [];

      for (const doubtDoc of doubtsSnap.docs) {
        const doubtData = {
          id: doubtDoc.id,
          ...doubtDoc.data(),
        };

        // Fetch mentee details
        const menteeDocRef = doc(db, "users", doubtData.menteeId);
        const menteeSnap = await getDoc(menteeDocRef);

        if (menteeSnap.exists()) {
          const menteeData = menteeSnap.data();
          doubtData.menteeName = `${menteeData.firstName || ""} ${
            menteeData.lastName || ""
          }`.trim();

          // Get roll number from mentees collection
          const menteeDetailsRef = doc(db, "mentees", doubtData.menteeId);
          const menteeDetailsSnap = await getDoc(menteeDetailsRef);
          if (menteeDetailsSnap.exists()) {
            doubtData.rollNumber = menteeDetailsSnap.data().rollNumber || "N/A";
          }
        }

        doubtsList.push(doubtData);
      }

      setDoubts(doubtsList);

      // Calculate stats
      const pending = doubtsList.filter((d) => d.status === "pending").length;
      const replied = doubtsList.filter((d) => d.status === "replied").length;
      const mentorship = doubtsList.filter((d) => d.type === "mentorship").length;
      const studies = doubtsList.filter((d) => d.type === "studies").length;

      setStats({ pending, replied, mentorship, studies });
    } catch (err) {
      console.error("Error fetching queries:", err);
      Alert.alert("Error", "Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchQueries();
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

  const openReplyModal = (doubt) => {
    setSelectedDoubt(doubt);
    setReplyText(doubt.reply || "");
    setReplyModalVisible(true);
  };

  const submitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Please enter a reply");
      return;
    }

    if (!selectedDoubt) {
      Alert.alert("Error", "No doubt selected");
      return;
    }

    try {
      setSending(true);

      const doubtRef = doc(db, "doubts", selectedDoubt.id);
      await updateDoc(doubtRef, {
        reply: replyText.trim(),
        status: "replied",
        repliedAt: Timestamp.now(),
      });

      Alert.alert("Success", "Reply sent successfully!");
      setReplyModalVisible(false);
      setReplyText("");
      setSelectedDoubt(null);
      await fetchQueries();
    } catch (err) {
      console.error("Error submitting reply:", err);
      Alert.alert("Error", "Failed to send reply");
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
    return status === "pending" ? "#F59E0B" : "#10B981";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading queries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Queries</Text>
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
            <View style={styles.statIconContainer} >
              <Feather name="clock" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#D1FAE5" }]}>
              <Feather name="check-circle" size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.replied}</Text>
            <Text style={styles.statLabel}>Replied</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#EFF6FF" }]}>
              <Feather name="file-text" size={20} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{stats.mentorship}</Text>
            <Text style={styles.statLabel}>Mentorship</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: "#F5F3FF" }]}>
              <Feather name="book-open" size={20} color="#9333EA" />
            </View>
            <Text style={styles.statValue}>{stats.studies}</Text>
            <Text style={styles.statLabel}>Study Doubts</Text>
          </View>
        </View>

        {/* Queries List */}
        <View style={styles.queriesSection}>
          <Text style={styles.sectionTitle}>All Queries</Text>

          {doubts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No queries yet</Text>
              <Text style={styles.emptySubtext}>
                Your mentees haven't asked any questions
              </Text>
            </View>
          ) : (
            doubts.map((doubt) => (
              <View key={doubt.id} style={styles.queryCard}>
                <View style={styles.queryHeader}>
                  <View style={styles.menteeInfo}>
                    <View style={styles.menteeAvatar}>
                      <Feather name="user" size={16} color="#2563EB" />
                    </View>
                    <View>
                      <Text style={styles.menteeName}>{doubt.menteeName}</Text>
                      <Text style={styles.menteeRoll}>{doubt.rollNumber}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(doubt.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {doubt.status === "pending" ? "Pending" : "Replied"}
                    </Text>
                  </View>
                </View>

                <View style={styles.queryContent}>
                  <View
                    style={[
                      styles.typeBadge,
                      doubt.type === "mentorship"
                        ? styles.typeBadgeBlue
                        : styles.typeBadgeGreen,
                    ]}
                  >
                    <Feather
                      name={
                        doubt.type === "mentorship" ? "file-text" : "book-open"
                      }
                      size={12}
                      color={doubt.type === "mentorship" ? "#2563EB" : "#10B981"}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        doubt.type === "mentorship"
                          ? styles.typeTextBlue
                          : styles.typeTextGreen,
                      ]}
                    >
                      {doubt.type === "mentorship"
                        ? "Mentorship Form"
                        : "Study Doubt"}
                    </Text>
                  </View>

                  <Text style={styles.querySubject}>{doubt.subject}</Text>
                  <Text style={styles.queryQuestion} numberOfLines={3}>
                    {doubt.question}
                  </Text>
                  <Text style={styles.queryDate}>
                    Asked on {formatDate(doubt.createdAt)}
                  </Text>

                  {doubt.reply && (
                    <View style={styles.replyPreview}>
                      <Feather name="corner-down-right" size={14} color="#2563EB" />
                      <Text style={styles.replyPreviewText} numberOfLines={2}>
                        {doubt.reply}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.replyButton,
                    doubt.status === "replied" && styles.replyButtonSecondary,
                  ]}
                  onPress={() => openReplyModal(doubt)}
                >
                  <Feather
                    name={doubt.status === "pending" ? "send" : "edit-2"}
                    size={16}
                    color={doubt.status === "pending" ? "#fff" : "#2563EB"}
                  />
                  <Text
                    style={[
                      styles.replyButtonText,
                      doubt.status === "replied" &&
                        styles.replyButtonTextSecondary,
                    ]}
                  >
                    {doubt.status === "pending" ? "Reply" : "Edit Reply"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Reply Modal */}
      <Modal
        visible={replyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Query</Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedDoubt && (
                <>
                  <View style={styles.queryPreview}>
                    <Text style={styles.queryPreviewLabel}>Student</Text>
                    <Text style={styles.queryPreviewValue}>
                      {selectedDoubt.menteeName} ({selectedDoubt.rollNumber})
                    </Text>

                    <Text style={styles.queryPreviewLabel}>Subject</Text>
                    <Text style={styles.queryPreviewValue}>
                      {selectedDoubt.subject}
                    </Text>

                    <Text style={styles.queryPreviewLabel}>Question</Text>
                    <Text style={styles.queryPreviewQuestion}>
                      {selectedDoubt.question}
                    </Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Your Reply *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Type your detailed reply here..."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={8}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={submitReply}
                      disabled={sending}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="send" size={16} color="#fff" />
                          <Text style={styles.submitButtonText}>
                            Send Reply
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setReplyModalVisible(false)}
                      disabled={sending}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
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
  queriesSection: {
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
  queryCard: {
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
  queryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  menteeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menteeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  menteeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  menteeRoll: {
    fontSize: 12,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  queryContent: {
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 8,
  },
  typeBadgeBlue: {
    backgroundColor: "#EFF6FF",
  },
  typeBadgeGreen: {
    backgroundColor: "#ECFDF5",
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  typeTextBlue: {
    color: "#2563EB",
  },
  typeTextGreen: {
    color: "#10B981",
  },
  querySubject: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
  },
  queryQuestion: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  queryDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  replyPreview: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  replyPreviewText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  replyButtonSecondary: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  replyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  replyButtonTextSecondary: {
    color: "#2563EB",
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
    maxHeight: "85%",
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
  },
  modalBody: {
    padding: 16,
  },
  queryPreview: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  queryPreviewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 8,
    marginBottom: 4,
  },
  queryPreviewValue: {
    fontSize: 14,
    color: "#111827",
  },
  queryPreviewQuestion: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
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
    backgroundColor: "#fff",
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  modalActions: {
    gap: 12,
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