import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function UserManagement({ navigation }) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptAdmins, setDeptAdmins] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch Department Administrators
      const adminsSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "deptadmin"),
          where("college", "==", "Goa College of Engineering")
        )
      );
      setDeptAdmins(
        adminsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch Mentors
      const mentorsSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "mentor"),
          where("college", "==", "Goa College of Engineering")
        )
      );
      setMentors(
        mentorsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );

      // Fetch Students (Mentees)
      const studentsSnap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "mentee"),
          where("college", "==", "Goa College of Engineering")
        )
      );
      setStudents(
        studentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
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

  const filterUsers = (users) => {
    if (!searchQuery) return users;
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const dept = user.department?.toLowerCase() || "";
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        dept.includes(searchQuery.toLowerCase())
      );
    });
  };

  const filteredAdmins = filterUsers(deptAdmins);
  const filteredMentors = filterUsers(mentors);
  const filteredStudents = filterUsers(students);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "deptadmin":
        return { bg: "#dbeafe", text: "#1e40af", label: "Admin" };
      case "mentor":
        return { bg: "#fed7aa", text: "#c2410c", label: "Mentor" };
      case "mentee":
        return { bg: "#d1fae5", text: "#065f46", label: "Student" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", label: role };
    }
  };

  const renderUserItem = (user) => {
    const badge = getRoleBadgeColor(user.role);
    return (
      <TouchableOpacity key={user.id} style={styles.userItem}>
        <View style={styles.userAvatar}>
          {user.profilePic ? (
            <Image source={{ uri: user.profilePic }} style={styles.avatarImage} />
          ) : (
            <Feather name="user" size={20} color="#6b7280" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userDept}>{user.department}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.roleBadgeText, { color: badge.text }]}>
            {badge.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search college users..."
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
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Department Administrators */}
        <View style={styles.userSection}>
          <View style={styles.sectionHeader}>
            <Feather name="shield" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>
              Department Administrators ({filteredAdmins.length})
            </Text>
          </View>
          {filteredAdmins.length === 0 ? (
            <Text style={styles.emptyText}>No administrators found</Text>
          ) : (
            filteredAdmins.map(renderUserItem)
          )}
        </View>

        {/* Mentors */}
        <View style={styles.userSection}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>
              Mentors ({filteredMentors.length})
            </Text>
          </View>
          {filteredMentors.length === 0 ? (
            <Text style={styles.emptyText}>No mentors found</Text>
          ) : (
            filteredMentors.map(renderUserItem)
          )}
        </View>

        {/* Students */}
        <View style={styles.userSection}>
          <View style={styles.sectionHeader}>
            <Feather name="user-check" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>
              Students ({filteredStudents.length})
            </Text>
          </View>
          {filteredStudents.length === 0 ? (
            <Text style={styles.emptyText}>No students found</Text>
          ) : (
            filteredStudents.map(renderUserItem)
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CollegeDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="users" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Forms")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CollegeProfile")}
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
  searchSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  userItem: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userDept: {
    fontSize: 12,
    color: "#6b7280",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
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
  navLabelActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
});