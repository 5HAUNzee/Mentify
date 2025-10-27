// screens/MentorProfile.js - IMPROVED UI WITH ORANGE THEME
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
import { useAuth, useClerk } from "@clerk/clerk-expo";

export default function MentorProfile({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    college: "",
    specialization: "",
    experience: "",
    qualification: "",
    role: "",
    profilePic: null,
    signature: null,
  });

  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    qualification: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageType, setImageType] = useState(null);

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
          phone: data.phone || "",
          specialization: data.specialization || "",
          experience: data.experience || "",
          qualification: data.qualification || "",
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

  const pickImage = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need camera roll permissions to upload images"
        );
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

      const data = new FormData();
      data.append("file", {
        uri,
        type: "image/jpeg",
        name: `${type}_${userId}_${Date.now()}.jpg`,
      });
      data.append("upload_preset", "Mentify");

      const cloudName = "dfqa2ojqr";
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();

      if (!result.secure_url) {
        throw new Error(result.error?.message || "Upload failed");
      }

      const downloadURL = result.secure_url;

      const userDocRef = doc(db, "users", userId);
      const updateField = type === "profile" ? "profilePic" : "signature";
      await updateDoc(userDocRef, {
        [updateField]: downloadURL,
      });

      setUserData((prev) => ({
        ...prev,
        [updateField]: downloadURL,
      }));

      Alert.alert(
        "Success",
        `${type === "profile" ? "Profile picture" : "Signature"} uploaded successfully`
      );
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
        phone: editData.phone.trim(),
        specialization: editData.specialization.trim(),
        experience: editData.experience.trim(),
        qualification: editData.qualification.trim(),
      });

      setUserData((prev) => ({
        ...prev,
        ...editData,
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
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <TouchableOpacity
            style={styles.profilePicContainer}
            onPress={() => openImageModal("profile")}
          >
            {userData.profilePic ? (
              <Image
                source={{ uri: userData.profilePic }}
                style={styles.profilePic}
              />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Feather name="user" size={48} color="#f59e0b" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Feather name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {userData.firstName} {userData.lastName}
          </Text>
          <Text style={styles.profileRole}>Mentor</Text>
          
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Feather name="award" size={12} color="#f59e0b" />
              <Text style={styles.roleBadgeText}>Mentor</Text>
            </View>
            <View style={styles.statusBadge}>
              <Feather name="check-circle" size={12} color="#10b981" />
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Feather name="edit-2" size={16} color="#f59e0b" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
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
                <Text style={styles.inputLabel}>Last Name *</Text>
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

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={editData.phone}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, phone: text }))
                  }
                  placeholder="Phone Number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialization</Text>
                <TextInput
                  style={styles.input}
                  value={editData.specialization}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, specialization: text }))
                  }
                  placeholder="e.g., Machine Learning, AI"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Experience</Text>
                <TextInput
                  style={styles.input}
                  value={editData.experience}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, experience: text }))
                  }
                  placeholder="e.g., 8 years"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Qualification</Text>
                <TextInput
                  style={styles.input}
                  value={editData.qualification}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, qualification: text }))
                  }
                  placeholder="e.g., Ph.D. in Computer Science"
                  placeholderTextColor="#9ca3af"
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
                    <>
                      <Feather name="check" size={18} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    </>
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
                      phone: userData.phone,
                      specialization: userData.specialization,
                      experience: userData.experience,
                      qualification: userData.qualification,
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
                <View style={styles.infoIconCircle}>
                  <Feather name="user" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Full Name</Text>
                  <Text style={styles.infoValue}>
                    {userData.firstName} {userData.lastName}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="mail" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{userData.email}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="phone" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>
                    {userData.phone || "Not provided"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="book" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>{userData.department}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="home" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>College</Text>
                  <Text style={styles.infoValue}>{userData.college}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="award" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Specialization</Text>
                  <Text style={styles.infoValue}>
                    {userData.specialization || "Not specified"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="briefcase" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Experience</Text>
                  <Text style={styles.infoValue}>
                    {userData.experience || "Not specified"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <Feather name="file-text" size={16} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Qualification</Text>
                  <Text style={styles.infoValue}>
                    {userData.qualification || "Not specified"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Signature Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Digital Signature</Text>
          <TouchableOpacity
            style={styles.signatureContainer}
            onPress={() => openImageModal("signature")}
          >
            {userData.signature ? (
              <Image
                source={{ uri: userData.signature }}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Feather name="edit-3" size={32} color="#f59e0b" />
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
                  <ActivityIndicator size="small" color="#f59e0b" />
                ) : (
                  <>
                    <Feather name="image" size={24} color="#f59e0b" />
                    <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MentorDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MyMentees")}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Mentees</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("MentorForms")}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color="#f59e0b" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
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
  profileHeaderCard: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  profilePicContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#f59e0b",
  },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#f59e0b",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#f59e0b",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: "#b45309",
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#f59e0b",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
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
    color: "#f59e0b",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
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
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#f9fafb",
  },
  editActions: {
    marginTop: 8,
    gap: 10,
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: "#f59e0b",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  signatureContainer: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#fbbf24",
    borderRadius: 10,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  signatureImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
    backgroundColor: "#fef3c7",
  },
  signaturePlaceholder: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef3c7",
  },
  signaturePlaceholderText: {
    fontSize: 14,
    color: "#92400e",
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
  imageOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f59e0b",
    gap: 12,
  },
  imageOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f59e0b",
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
    color: "#f59e0b",
    fontWeight: "600",
  },
});
