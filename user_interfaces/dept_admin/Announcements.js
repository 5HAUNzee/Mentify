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
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
  onSnapshot,
  orderBy,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function Announcements({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          Alert.alert("Error", "User data not found");
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const userDept = userData.department;
        const userCollege = userData.college;

        const announcementsRef = collection(db, "announcements");
        const q = query(
          announcementsRef,
          where("department", "==", userDept),
          where("college", "==", userCollege),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const announcementsList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setAnnouncements(announcementsList);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching announcements:", error);
            Alert.alert("Error", "Could not fetch announcements.");
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching announcements:", error);
        Alert.alert("Error", "Failed to load announcements");
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Error", "Title and content cannot be empty");
      return;
    }

    try {
      setPosting(true);
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;

      const userData = userSnap.data();

      const newAnnouncement = {
        title: title.trim(),
        content: content.trim(),
        department: userData.department,
        college: userData.college,
        createdBy: userId,
        createdAt: Timestamp.now(),
        author: "Department Admin",
      };

      await addDoc(collection(db, "announcements"), newAnnouncement);

      Alert.alert("Success", "Announcement posted successfully");
      setTitle("");
      setContent("");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to post announcement");
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteAnnouncement = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "announcements", id));
              Alert.alert("Deleted", "Announcement deleted successfully");
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Failed to delete announcement");
            }
          },
        },
      ]
    );
  };

  const openEditModal = (announcement) => {
    setEditingAnnouncement(announcement);
    setEditTitle(announcement.title);
    setEditContent(announcement.content);
    setModalVisible(true);
  };

  const handleEditAnnouncement = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      Alert.alert("Error", "Title and content cannot be empty");
      return;
    }

    try {
      const docRef = doc(db, "announcements", editingAnnouncement.id);
      await updateDoc(docRef, {
        title: editTitle.trim(),
        content: editContent.trim(),
      });

      Alert.alert("Success", "Announcement updated successfully");
      setModalVisible(false);
      setEditingAnnouncement(null);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update announcement");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.pageTitle}>Department Announcements</Text>

          {/* Create Announcement */}
          <View style={styles.createCard}>
            <Text style={styles.createCardTitle}>Create New Announcement</Text>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Announcement title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.inputLabel, styles.inputSpacing]}>Content</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Announcement content"
              placeholderTextColor="#9ca3af"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.postButton,
                (!title.trim() || !content.trim() || posting) && styles.postButtonDisabled,
              ]}
              onPress={handlePostAnnouncement}
              disabled={!title.trim() || !content.trim() || posting}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.postButtonText}>Post Announcement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Announcements List */}
          <View style={styles.announcementsSection}>
            {loading ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
            ) : announcements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="bell-off" size={48} color="#d1d5db" />
                <Text style={styles.emptyText}>No announcements yet</Text>
                <Text style={styles.emptySubtext}>Create your first announcement above</Text>
              </View>
            ) : (
              announcements.map((announcement) => (
                <View key={announcement.id} style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <Text style={styles.announcementTitle}>{announcement.title}</Text>
                  </View>
                  <Text style={styles.announcementContent}>{announcement.content}</Text>
                  <View style={styles.announcementFooter}>
                    <Text style={styles.announcementAuthor}>
                      By {announcement.author || "Admin"}
                    </Text>
                    <Text style={styles.announcementDate}>
                      {formatDate(announcement.createdAt)}
                    </Text>
                  </View>

                  {/* Edit & Delete (only if created by current user) */}
                  {announcement.createdBy === userId && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openEditModal(announcement)}
                      >
                        <Text style={styles.actionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteAnnouncement(announcement.id)}
                      >
                        <Text style={styles.actionText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.createCardTitle}>Edit Announcement</Text>
            <TextInput
              style={styles.input}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="Content"
              multiline
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <TouchableOpacity style={styles.postButton} onPress={handleEditAnnouncement}>
                <Text style={styles.postButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.postButton, { backgroundColor: "#ef4444" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.postButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("DeptDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Mentors")}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Mentors</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Announcements")}
        >
          <Feather name="message-circle" size={24} color="#10b981" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>News</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Feather name="user" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#2563eb",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  logoutBtn: { color: "#fff", fontWeight: "600" },
  keyboardView: { flex: 1 },
  content: { flex: 1, padding: 16 },
  contentContainer: { paddingBottom: 100 },
  pageTitle: { fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  createCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  createCardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 8 },
  inputLabel: { fontSize: 14, color: "#4b5563", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14, color: "#111827" },
  inputSpacing: { marginTop: 8 },
  textArea: { height: 100 },
  postButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#2563eb", borderRadius: 8, paddingVertical: 10, marginTop: 12 },
  postButtonDisabled: { backgroundColor: "#93c5fd" },
  postButtonText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
  announcementsSection: { marginTop: 12 },
  announcementCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
  announcementHeader: { marginBottom: 6 },
  announcementTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  announcementContent: { fontSize: 14, color: "#374151", marginVertical: 6 },
  announcementFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  announcementAuthor: { fontSize: 13, color: "#6b7280" },
  announcementDate: { fontSize: 13, color: "#6b7280" },
  actionButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  editButton: { backgroundColor: "#f59e0b", padding: 6, borderRadius: 6, marginRight: 6 },
  deleteButton: { backgroundColor: "#ef4444", padding: 6, borderRadius: 6 },
  actionText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 16, color: "#9ca3af", marginTop: 8 },
  emptySubtext: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  loadingContainer: { marginTop: 40, alignItems: "center" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, backgroundColor: "#fff", borderTopWidth: 1, borderColor: "#e5e7eb" },
  navItem: { alignItems: "center" },
  navLabel: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  navLabelActive: { color: "#10b981", fontWeight: "600" },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "90%", backgroundColor: "#fff", borderRadius: 12, padding: 16 },
});
