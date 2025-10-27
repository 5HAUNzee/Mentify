// screens/UserManagement.js - FIXED UI
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth, useClerk } from "@clerk/clerk-expo";

export default function UserManagement({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All Roles");

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      const userData = userDoc.exists() ? userDoc.data() : null;

      if (userData && userData.role === "superadmin") {
        loadUsers();
      } else {
        Alert.alert(
          "Access Denied",
          "Only Super Admins can access this screen.",
          [
            {
              text: "OK",
              onPress: () => {
                switch (userData?.role) {
                  case "mentor":
                    navigation.replace("MentorDashboard");
                    break;
                  case "mentee":
                    navigation.replace("MenteeDashboard");
                    break;
                  case "collegeadmin":
                    navigation.replace("CollegeDashboard");
                    break;
                  case "deptadmin":
                    navigation.replace("DeptDashboard");
                    break;
                  default:
                    navigation.replace("Auth");
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Access error:", error);
      Alert.alert("Error", "Failed to verify access");
      navigation.replace("Auth");
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading users:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            navigation.replace("Auth");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      "Delete User",
      "Are you sure you want to permanently delete this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", userId));
              Alert.alert("Success", "User deleted successfully.");
              loadUsers();
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to delete user.");
            }
          },
        },
      ]
    );
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    filterUsers(text, selectedRole);
  };

  const handleRoleFilter = (role) => {
    setSelectedRole(role);
    filterUsers(searchQuery, role);
  };

  const filterUsers = (search, role) => {
    let filtered = users;
    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (role !== "All Roles") {
      filtered = filtered.filter((user) => user.role === role);
    }
    setFilteredUsers(filtered);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "superadmin":
        return { bg: "#fee2e2", text: "#ef4444" };
      case "collegeadmin":
        return { bg: "#fef3c7", text: "#f59e0b" };
      case "deptadmin":
        return { bg: "#dbeafe", text: "#2563eb" };
      case "mentor":
        return { bg: "#d1fae5", text: "#10b981" };
      case "mentee":
        return { bg: "#e0e7ff", text: "#6366f1" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Role Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          "All Roles",
          "mentee",
          "mentor",
          "deptadmin",
          "collegeadmin",
          "superadmin",
        ].map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterChip,
              selectedRole === role && styles.filterChipActive,
            ]}
            onPress={() => handleRoleFilter(role)}
          >
            <Text
              style={[
                styles.filterText,
                selectedRole === role && styles.filterTextActive,
              ]}
            >
              {role}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* User List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const colors = getRoleBadgeColor(user.role);
            return (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfo}>
                  {user.profilePic ? (
                    <Image
                      source={{ uri: user.profilePic }}
                      style={styles.userAvatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {user.firstName?.[0] || "?"}
                        {user.lastName?.[0] || ""}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.college && (
                      <Text style={styles.userCollege}>{user.college}</Text>
                    )}
                  </View>
                </View>

                <View
                  style={[styles.roleBadge, { backgroundColor: colors.bg }]}
                >
                  <Text style={[styles.roleText, { color: colors.text }]}>
                    {user.role || "N/A"}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: "#10b981" },
                      ]}
                    />
                    <Text style={styles.statusText}>Active</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteUser(user.id)}
                  >
                    <Feather name="trash-2" size={16} color="#ef4444" />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
            );
            
          })
        )}
        
      </ScrollView>
      {/* Bottom Navigation */}
              <View style={styles.bottomNav}>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => navigation.navigate("SuperAdminDashboard")}
                >
                  <Feather name="home" size={24} color="#9ca3af" />
                  <Text style={styles.navLabel}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => navigation.navigate("UserManagement")}
                >
                  <Feather name="users" size={24} color="#2563eb" />
                  <Text style={[styles.navLabel, { color: "#2563eb" }]}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => navigation.navigate("CollegeManagement")}
                >
                  <Feather name="grid" size={24} color="#9ca3af" />
                  <Text style={styles.navLabel}>Colleges</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => navigation.navigate("ApprovalRequests")}
                >
                  <Feather name="file-text" size={24} color="#9ca3af" />
                  <Text style={styles.navLabel}>Requests</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => navigation.navigate("AdminAnalytics")}
                >
                  <Feather name="bar-chart-2" size={24} color="#9ca3af" />
                  <Text style={styles.navLabel}>Analytics</Text>
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
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    maxHeight: 40,
  },
  filterContent: {
    alignItems: "center",
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  filterText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 12,
  },
  userCard: {
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 2,
  },
  userCollege: {
    fontSize: 12,
    color: "#9ca3af",
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fee2e2",
    borderRadius: 6,
  },
  deleteText: {
    color: "#ef4444",
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  navItem: { flex: 1, alignItems: "center", paddingVertical: 8 },
  navLabel: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
});
