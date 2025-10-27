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
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function Profile({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // User data
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    college: "",
    role: "",
    status: "",
    profilePic: null,
    signature: null,
  });

  // Edit form data
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageType, setImageType] = useState(null); // 'profile' or 'signature'

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);
        setEditData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      Alert.alert("Error", "Failed to load profile");
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

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need camera roll permissions to upload images");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "profile" ? [1, 1] : [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri, type);
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", "Failed to pick image");
    }
  };

 const uploadImage = async (uri, type) => {
  try {
    setUploadingImage(true);

    // Convert local URI to form data
    const data = new FormData();
    data.append("file", {
      uri,
      type: "image/jpeg",
      name: `${type}_${userId}_${Date.now()}.jpg`,
    });
    data.append("upload_preset", "Mentify"); // <-- replace with your preset

    // Upload to Cloudinary
    const cloudName = "dfqa2ojqr"; // <-- replace with your Cloudinary cloud name
   const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
  method: "POST",
  body: data,
});

const result = await response.json();
console.log("Cloudinary response:", result);

if (!result.secure_url) {
  throw new Error(result.error?.message || "Upload failed");
}
    const downloadURL = result.secure_url;

    // Update Firestore
    const userDocRef = doc(db, "users", userId);
    const updateField = type === "profile" ? "profilePic" : "signature";
    await updateDoc(userDocRef, {
      [updateField]: downloadURL,
    });

    // Update local state
    setUserData((prev) => ({
      ...prev,
      [updateField]: downloadURL,
    }));

    Alert.alert("Success", `${type === "profile" ? "Profile picture" : "Signature"} uploaded successfully`);
    setImageModalVisible(false);
  } catch (err) {
    console.error("Error uploading to Cloudinary:", err);
    Alert.alert("Error", "Failed to upload image");
  } finally {
    setUploadingImage(false);
  }
};


  const handleSaveProfile = async () => {
    if (!editData.firstName.trim() || !editData.lastName.trim()) {
      Alert.alert("Error", "First name and last name are required");
      return;
    }

    try {
      setSaving(true);
      const userDocRef = doc(db, "users", userId);
      
      await updateDoc(userDocRef, {
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        email: editData.email.trim(),
      });

      setUserData((prev) => ({
        ...prev,
        firstName: editData.firstName.trim(),
        lastName: editData.lastName.trim(),
        email: editData.email.trim(),
      }));

      Alert.alert("Success", "Profile updated successfully");
      setEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const openImageModal = (type) => {
    setImageType(type);
    setImageModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.profilePicContainer}
            onPress={() => openImageModal("profile")}
          >
            {userData.profilePic ? (
              <Image source={{ uri: userData.profilePic }} style={styles.profilePic} />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Feather name="user" size={48} color="#9ca3af" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {userData.firstName} {userData.lastName}
          </Text>
          <Text style={styles.profileRole}>{userData.role}</Text>
        </View>

        {/* Role Badge */}
        <View style={styles.roleBadgeContainer}>
          <View style={[styles.roleBadge, getRoleBadgeStyle(userData.role)]}>
            <Text style={styles.roleBadgeText}>{userData.role}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusBadgeStyle(userData.status)]}>
            <Text style={styles.statusBadgeText}>{userData.status}</Text>
          </View>
        </View>

        {/* Personal Information Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Feather name="edit-2" size={16} color="#10b981" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={editData.firstName}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, firstName: text }))
                  }
                  placeholder="First Name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={editData.lastName}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, lastName: text }))
                  }
                  placeholder="Last Name"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editData.email}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, email: text }))
                  }
                  placeholder="Email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditing(false);
                    setEditData({
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      email: userData.email,
                    });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Feather name="user" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="mail" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="book" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{userData.department}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="home" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>College</Text>
                  <Text style={styles.infoValue}>{userData.college}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Signature Section */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Digital Signature</Text>
          <TouchableOpacity
            style={styles.signatureContainer}
            onPress={() => openImageModal("signature")}
          >
            {userData.signature ? (
              <Image source={{ uri: userData.signature }} style={styles.signatureImage} />
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Feather name="edit-3" size={32} color="#9ca3af" />
                <Text style={styles.signaturePlaceholderText}>
                  Tap to upload signature
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Upload Modal */}
      <Modal
        visible={imageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Upload {imageType === "profile" ? "Profile Picture" : "Signature"}
              </Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={styles.imageOptionButton}
                onPress={() => pickImage(imageType)}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <>
                    <Feather name="image" size={24} color="#10b981" />
                    <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                  </>
                )}
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
          <Feather name="message-circle" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>News</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color="#10b981" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getRoleBadgeStyle = (role) => {
  switch (role) {
    case "superadmin":
      return { backgroundColor: "#dbeafe", borderColor: "#3b82f6" };
    case "mentor":
      return { backgroundColor: "#d1fae5", borderColor: "#10b981" };
    case "mentee":
      return { backgroundColor: "#fef3c7", borderColor: "#f59e0b" };
    default:
      return { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" };
  }
};

const getStatusBadgeStyle = (status) => {
  switch (status) {
    case "approved":
      return { backgroundColor: "#d1fae5", borderColor: "#10b981" };
    case "pending":
      return { backgroundColor: "#fef3c7", borderColor: "#f59e0b" };
    case "rejected":
      return { backgroundColor: "#fee2e2", borderColor: "#ef4444" };
    default:
      return { backgroundColor: "#f3f4f6", borderColor: "#d1d5db" };
  }
};

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
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  profilePicContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#10b981",
  },
  profilePicPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e5e7eb",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10b981",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: "#6b7280",
    textTransform: "capitalize",
  },
  roleBadgeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  infoCard: {
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
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
  editActions: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#10b981",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
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
  signatureContainer: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  signatureImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
    backgroundColor: "#f9fafb",
  },
  signaturePlaceholder: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  signaturePlaceholderText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
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
  imageOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10b981",
    gap: 12,
  },
  imageOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#10b981",
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
});