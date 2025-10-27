import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function Mentors({ navigation }) {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("Mentors");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Data states
  const [mentors, setMentors] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignedMenteeIds, setAssignedMenteeIds] = useState(new Set());

  // Form states
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentees, setSelectedMentees] = useState([]);
  const [showMentorDropdown, setShowMentorDropdown] = useState(false);

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserType, setDeleteUserType] = useState("mentor"); // 'mentor' or 'mentee'
  const [usersToDelete, setUsersToDelete] = useState([]);
  const [selectedUsersForDeletion, setSelectedUsersForDeletion] = useState([]);
  const [deleteSearchQuery, setDeleteSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchMentors(), fetchMentees(), fetchAssignments()]);
    } catch (err) {
      console.error("Error fetching data:", err);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMentors = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "mentor"),
        where("status", "==", "approved"),
        where("college", "==", "Goa College of Engineering"),
        where("department", "==", "Computer Engineering")
      );
      const snapshot = await getDocs(q);
      const mentorsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMentors(mentorsList);
    } catch (err) {
      console.error("Error fetching mentors:", err);
    }
  };

  const fetchMentees = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "mentee"),
        where("college", "==", "Goa College of Engineering"),
        where("department", "==", "Computer Engineering")
      );
      const snapshot = await getDocs(q);
      const menteesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMentees(menteesList);
    } catch (err) {
      console.error("Error fetching mentees:", err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const q = query(
        collection(db, "assignments"),
        orderBy("assignedAt", "desc")
      );
      const snapshot = await getDocs(q);
      const assignmentsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssignments(assignmentsList);

      // Track assigned mentee IDs
      const assignedIds = new Set(
        assignmentsList.map((assignment) => assignment.menteeId)
      );
      setAssignedMenteeIds(assignedIds);
    } catch (err) {
      console.error("Error fetching assignments:", err);
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

  const openNewAssignment = () => {
    setSelectedMentor(null);
    setSelectedMentees([]);
    setSearchQuery("");
    setShowMentorDropdown(false);
    setShowModal(true);
  };

  const toggleMenteeSelection = (menteeId) => {
    setSelectedMentees((prev) =>
      prev.includes(menteeId)
        ? prev.filter((id) => id !== menteeId)
        : [...prev, menteeId]
    );
  };

  const handleAssignMentees = async () => {
    if (!selectedMentor) {
      Alert.alert("Error", "Please select a mentor");
      return;
    }

    if (selectedMentees.length === 0) {
      Alert.alert("Error", "Please select at least one mentee");
      return;
    }

    try {
      setLoading(true);

      // Create assignments for each selected mentee
      const assignmentPromises = selectedMentees.map(async (menteeId) => {
        const mentee = mentees.find((m) => m.id === menteeId);
        return addDoc(collection(db, "assignments"), {
          mentorId: selectedMentor.id,
          mentorName: `${selectedMentor.firstName} ${selectedMentor.lastName}`,
          menteeId: menteeId,
          menteeName: `${mentee.firstName} ${mentee.lastName}`,
          department: "Computer Engineering",
          college: "Goa College of Engineering",
          assignedAt: Timestamp.now(),
          status: "active",
        });
      });

      await Promise.all(assignmentPromises);

      Alert.alert(
        "Success",
        `Successfully assigned ${selectedMentees.length} mentee(s) to ${selectedMentor.firstName} ${selectedMentor.lastName}`
      );

      // Refresh assignments and close modal
      await fetchAssignments();
      setShowModal(false);
      setSelectedMentor(null);
      setSelectedMentees([]);
    } catch (err) {
      console.error("Error creating assignments:", err);
      Alert.alert("Error", "Failed to create assignments");
    } finally {
      setLoading(false);
    }
  };

  // Filter unassigned mentees and apply search
  const getFilteredMentees = () => {
    const unassignedMentees = mentees.filter(
      (mentee) => !assignedMenteeIds.has(mentee.id)
    );

    if (!searchQuery) return unassignedMentees;

    return unassignedMentees.filter((mentee) => {
      const fullName = `${mentee.firstName} ${mentee.lastName}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });
  };

  const filteredMentees = getFilteredMentees();

  const openDeleteModal = (userType) => {
    setDeleteUserType(userType);
    setUsersToDelete(userType === "mentor" ? mentors : mentees);
    setSelectedUsersForDeletion([]);
    setDeleteSearchQuery("");
    setShowDeleteModal(true);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsersForDeletion((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDeleteUsers = async () => {
    if (selectedUsersForDeletion.length === 0) {
      Alert.alert("Error", "Please select at least one user to delete");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${selectedUsersForDeletion.length} ${deleteUserType}(s)? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // Delete from Firestore
              const deletePromises = selectedUsersForDeletion.map((userId) =>
                deleteDoc(doc(db, "users", userId))
              );
              await Promise.all(deletePromises);

              // Delete related assignments if mentors are deleted
              if (deleteUserType === "mentor") {
                const assignmentsToDelete = assignments.filter((assignment) =>
                  selectedUsersForDeletion.includes(assignment.mentorId)
                );
                const deleteAssignmentPromises = assignmentsToDelete.map(
                  (assignment) =>
                    deleteDoc(doc(db, "assignments", assignment.id))
                );
                await Promise.all(deleteAssignmentPromises);
              }

              // Delete related assignments if mentees are deleted
              if (deleteUserType === "mentee") {
                const assignmentsToDelete = assignments.filter((assignment) =>
                  selectedUsersForDeletion.includes(assignment.menteeId)
                );
                const deleteAssignmentPromises = assignmentsToDelete.map(
                  (assignment) =>
                    deleteDoc(doc(db, "assignments", assignment.id))
                );
                await Promise.all(deleteAssignmentPromises);
              }

              Alert.alert(
                "Success",
                `Successfully deleted ${selectedUsersForDeletion.length} ${deleteUserType}(s)`
              );

              // Refresh data
              await fetchData();
              setShowDeleteModal(false);
              setSelectedUsersForDeletion([]);
            } catch (err) {
              console.error("Error deleting users:", err);
              Alert.alert("Error", "Failed to delete users");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getFilteredDeleteUsers = () => {
    if (!deleteSearchQuery) return usersToDelete;

    return usersToDelete.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(deleteSearchQuery.toLowerCase());
    });
  };

  const filteredDeleteUsers = getFilteredDeleteUsers();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mentor Management</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Assignment Card */}
        <View style={styles.assignmentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mentor-Mentee Assignment</Text>
            <TouchableOpacity
              style={styles.newAssignBtn}
              onPress={openNewAssignment}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.newAssignBtnText}>New Assignment</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delete Users Section */}
        <View style={styles.deleteSection}>
          <Text style={styles.sectionTitle}>Manage Users</Text>
          <View style={styles.deleteButtonsRow}>
            <TouchableOpacity
              style={styles.deleteMentorsBtn}
              onPress={() => openDeleteModal("mentor")}
            >
              <Feather name="user-x" size={16} color="#fff" />
              <Text style={styles.deleteBtnText}>Delete Mentors</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteMenteesBtn}
              onPress={() => openDeleteModal("mentee")}
            >
              <Feather name="user-minus" size={16} color="#fff" />
              <Text style={styles.deleteBtnText}>Delete Mentees</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Assignments */}
        <View style={styles.assignmentsSection}>
          <Text style={styles.sectionTitle}>Current Assignments</Text>

          {loading && assignments.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : assignments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No assignments yet</Text>
              <Text style={styles.emptySubtext}>
                Tap "New Assignment" to get started
              </Text>
            </View>
          ) : (
            assignments.map((assignment) => (
              <View key={assignment.id} style={styles.assignmentItem}>
                <View style={styles.assignmentAvatar}>
                  <Feather name="user" size={24} color="#6b7280" />
                </View>
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentName}>
                    {assignment.menteeName}
                  </Text>
                  <Text style={styles.assignmentMentor}>
                    Mentor: {assignment.mentorName}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Mentee to Mentor</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Select Mentor */}
              <Text style={styles.inputLabel}>Select Mentor</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowMentorDropdown(!showMentorDropdown)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !selectedMentor && styles.placeholderText,
                  ]}
                >
                  {selectedMentor
                    ? `${selectedMentor.firstName} ${selectedMentor.lastName}`
                    : "Choose a mentor"}
                </Text>
                <Feather
                  name={showMentorDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>

              {showMentorDropdown && (
                <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                  {mentors.length === 0 ? (
                    <Text style={styles.noDataText}>No mentors available</Text>
                  ) : (
                    mentors.map((mentor) => (
                      <TouchableOpacity
                        key={mentor.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedMentor(mentor);
                          setShowMentorDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {mentor.firstName} {mentor.lastName}
                        </Text>
                        {mentor.email && (
                          <Text style={styles.dropdownItemSubtext}>
                            {mentor.email}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}

              {/* Select Mentees */}
              <Text style={[styles.inputLabel, styles.sectionSpacing]}>
                Select Mentee(s)
              </Text>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Feather name="search" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search mentees by name..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Feather name="x-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected Count */}
              {selectedMentees.length > 0 && (
                <View style={styles.selectedCountBadge}>
                  <Text style={styles.selectedCountText}>
                    {selectedMentees.length} mentee
                    {selectedMentees.length > 1 ? "s" : ""} selected
                  </Text>
                </View>
              )}

              {/* Mentees List */}
              <View style={styles.menteesList}>
                {filteredMentees.length === 0 ? (
                  <View style={styles.noMenteesContainer}>
                    <Feather name="inbox" size={40} color="#d1d5db" />
                    <Text style={styles.noMenteesText}>
                      {searchQuery
                        ? "No mentees found matching your search"
                        : "All mentees are already assigned"}
                    </Text>
                  </View>
                ) : (
                  filteredMentees.map((mentee) => (
                    <TouchableOpacity
                      key={mentee.id}
                      style={styles.menteeItem}
                      onPress={() => toggleMenteeSelection(mentee.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedMentees.includes(mentee.id) &&
                            styles.checkboxSelected,
                        ]}
                      >
                        {selectedMentees.includes(mentee.id) && (
                          <Feather name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.menteeItemInfo}>
                        <Text style={styles.menteeItemName}>
                          {mentee.firstName} {mentee.lastName}
                        </Text>
                        {mentee.email && (
                          <Text style={styles.menteeItemEmail}>
                            {mentee.email}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Assign Button */}
              <TouchableOpacity
                style={[
                  styles.assignButton,
                  (!selectedMentor || selectedMentees.length === 0) &&
                    styles.assignButtonDisabled,
                ]}
                onPress={handleAssignMentees}
                disabled={
                  !selectedMentor || selectedMentees.length === 0 || loading
                }
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.assignButtonText}>
                    Assign{" "}
                    {selectedMentees.length > 0 &&
                      `(${selectedMentees.length})`}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Users Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Delete {deleteUserType === "mentor" ? "Mentors" : "Mentees"}
              </Text>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Warning Message */}
              <View style={styles.warningCard}>
                <Feather name="alert-triangle" size={20} color="#f59e0b" />
                <Text style={styles.warningText}>
                  Deleting users will also remove their assignments. This action
                  cannot be undone.
                </Text>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Feather name="search" size={20} color="#9ca3af" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${deleteUserType}s by name...`}
                  placeholderTextColor="#9ca3af"
                  value={deleteSearchQuery}
                  onChangeText={setDeleteSearchQuery}
                />
                {deleteSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setDeleteSearchQuery("")}>
                    <Feather name="x-circle" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Selected Count */}
              {selectedUsersForDeletion.length > 0 && (
                <View style={styles.selectedCountBadge}>
                  <Text style={styles.selectedCountText}>
                    {selectedUsersForDeletion.length} user
                    {selectedUsersForDeletion.length > 1 ? "s" : ""} selected
                  </Text>
                </View>
              )}

              {/* Users List */}
              <View style={styles.menteesList}>
                {filteredDeleteUsers.length === 0 ? (
                  <View style={styles.noMenteesContainer}>
                    <Feather name="inbox" size={40} color="#d1d5db" />
                    <Text style={styles.noMenteesText}>
                      {deleteSearchQuery
                        ? `No ${deleteUserType}s found matching your search`
                        : `No ${deleteUserType}s available`}
                    </Text>
                  </View>
                ) : (
                  filteredDeleteUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.menteeItem}
                      onPress={() => toggleUserSelection(user.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedUsersForDeletion.includes(user.id) &&
                            styles.checkboxSelectedDelete,
                        ]}
                      >
                        {selectedUsersForDeletion.includes(user.id) && (
                          <Feather name="check" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.menteeItemInfo}>
                        <Text style={styles.menteeItemName}>
                          {user.firstName} {user.lastName}
                        </Text>
                        {user.email && (
                          <Text style={styles.menteeItemEmail}>
                            {user.email}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  selectedUsersForDeletion.length === 0 &&
                    styles.deleteButtonDisabled,
                ]}
                onPress={handleDeleteUsers}
                disabled={selectedUsersForDeletion.length === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="trash-2" size={18} color="#fff" />
                    <Text style={styles.deleteButtonText}>
                      Delete{" "}
                      {selectedUsersForDeletion.length > 0 &&
                        `(${selectedUsersForDeletion.length})`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
          <Feather
            name="users"
            size={24}
            color={activeTab === "Mentors" ? "#10b981" : "#9ca3af"}
          />

          <Text style={[styles.navLabel, styles.navLabelActive]}>Mentors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Announcements")}
        >
          <Feather name="message-circle" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>News</Text>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  assignmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  newAssignBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  newAssignBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  assignmentsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  assignmentItem: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  assignmentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  assignmentMentor: {
    fontSize: 12,
    color: "#6b7280",
  },
  statusBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#065f46",
    fontSize: 11,
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
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dropdownText: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9ca3af",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
    maxHeight: 180,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  noDataText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 13,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  selectedCountBadge: {
    backgroundColor: "#dbeafe",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  selectedCountText: {
    color: "#1e40af",
    fontSize: 12,
    fontWeight: "600",
  },
  menteesList: {
    marginBottom: 16,
  },
  noMenteesContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  noMenteesText: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  menteeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  menteeItemInfo: {
    flex: 1,
  },
  menteeItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  menteeItemEmail: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  assignButton: {
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  assignButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
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
    color: "#10b981",
    fontWeight: "600",
  },
  deleteSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  deleteButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  deleteMentorsBtn: {
    flex: 1,
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  deleteMenteesBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f59e0b",
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#92400e",
    lineHeight: 18,
  },
  checkboxSelectedDelete: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
