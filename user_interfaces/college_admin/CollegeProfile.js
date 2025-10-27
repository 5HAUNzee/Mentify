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

export default function CollegeProfile({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageType, setImageType] = useState(null); // 'profile' or 'signature'

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

  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

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

  const openImageModal = (type) => {
    setImageType(type);
    setImageModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need camera roll permissions to upload images");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: imageType === "profile" ? [1, 1] : [4, 3],
        quality: 0.7,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0].uri, imageType);
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
      data.append("upload_preset", "Mentify"); // <-- replace with your Cloudinary preset

      const cloudName = "dfqa2ojqr"; // <-- replace with your Cloudinary name
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();
      if (!result.secure_url) throw new Error(result.error?.message || "Upload failed");

      const downloadURL = result.secure_url;

      const userDocRef = doc(db, "users", userId);
      const updateField = type === "profile" ? "profilePic" : "signature";
      await updateDoc(userDocRef, { [updateField]: downloadURL });

      setUserData((prev) => ({ ...prev, [updateField]: downloadURL }));

      Alert.alert("Success", `${type === "profile" ? "Profile picture" : "Signature"} uploaded successfully`);
      setImageModalVisible(false);
    } catch (err) {
      console.error("Error uploading:", err);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
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

      {/* Scroll Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
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

        {/* Role + Status */}
        <View style={styles.roleBadgeContainer}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {userData.role === "superadmin"
                ? "Super Admin"
                : userData.role === "collegeadmin"
                ? "College Admin"
                : userData.role}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              userData.status === "approved" ? styles.statusApproved : styles.statusPending,
            ]}
          >
            <Text style={styles.statusBadgeText}>{userData.status}</Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing && (
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Feather name="edit-2" size={16} color="#2563eb" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing ? (
            <>
              {["firstName", "lastName", "email"].map((field, idx) => (
                <View style={styles.inputGroup} key={idx}>
                  <Text style={styles.inputLabel}>
                    {field === "firstName"
                      ? "First Name"
                      : field === "lastName"
                      ? "Last Name"
                      : "Email"}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={editData[field]}
                    onChangeText={(text) => setEditData((prev) => ({ ...prev, [field]: text }))}
                    placeholder={field === "email" ? "Email" : field}
                    placeholderTextColor="#9ca3af"
                    keyboardType={field === "email" ? "email-address" : "default"}
                  />
                </View>
              ))}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
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
              {[
                { icon: "user", label: "Full Name", value: `${userData.firstName} ${userData.lastName}` },
                { icon: "mail", label: "Email", value: userData.email },
                { icon: "book", label: "Department", value: userData.department },
                { icon: "home", label: "College", value: userData.college },
              ].map((item, idx) => (
                <View style={styles.infoRow} key={idx}>
                  <Feather name={item.icon} size={18} color="#6b7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
              ))}

              {/* Signature Section */}
              <TouchableOpacity
                style={[styles.infoRow, { marginTop: 20 }]}
                onPress={() => openImageModal("signature")}
              >
                <Feather name="pen-tool" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Digital Signature</Text>
                  {userData.signature ? (
                    <Image
                      source={{ uri: userData.signature }}
                      style={{ width: 120, height: 60, marginTop: 5, borderRadius: 6 }}
                    />
                  ) : (
                    <Text style={{ color: "#9ca3af", marginTop: 5 }}>Upload your signature</Text>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Image Upload Modal */}
      <Modal
        visible={imageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Upload {imageType === "signature" ? "Signature" : "Profile Picture"}
              </Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.imageOptionButton}
              onPress={pickImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <>
                  <Feather name="image" size={24} color="#2563eb" />
                  <Text style={styles.imageOptionText}>Choose from Gallery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate("CollegeDashboard")} style={styles.navItem}>
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Users")} style={styles.navItem}>
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Forms")} style={styles.navItem}>
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: "#6b7280" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: "600" },
  logoutBtn: { color: "#ef4444", fontWeight: "500" },
  content: { flex: 1, padding: 16 },
  profileSection: { alignItems: "center", marginBottom: 20 },
  profilePicContainer: { position: "relative" },
  profilePic: { width: 100, height: 100, borderRadius: 50 },
  profilePicPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    padding: 6,
    borderRadius: 12,
  },
  profileName: { fontSize: 20, fontWeight: "600", marginTop: 10 },
  profileRole: { color: "#6b7280" },
  roleBadgeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  roleBadge: {
    backgroundColor: "#dbeafe",
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  roleBadgeText: { color: "#2563eb", fontWeight: "500" },
  statusBadge: { padding: 6, borderRadius: 6 },
  statusApproved: { backgroundColor: "#dcfce7" },
  statusPending: { backgroundColor: "#fef9c3" },
  statusBadgeText: { fontWeight: "500" },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "600" },
  editButton: { flexDirection: "row", alignItems: "center" },
  editButtonText: { marginLeft: 4, color: "#2563eb", fontWeight: "500" },
  inputGroup: { marginTop: 12 },
  inputLabel: { color: "#6b7280", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 8,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: { color: "#fff", fontWeight: "500" },
  cancelButton: {
    borderColor: "#9ca3af",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  cancelButtonText: { color: "#6b7280", fontWeight: "500" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  infoContent: { marginLeft: 10 },
  infoLabel: { color: "#6b7280" },
  infoValue: { fontSize: 16, fontWeight: "500" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  imageOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 8,
  },
  imageOptionText: { color: "#2563eb", marginLeft: 8, fontWeight: "500" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#fff",
    elevation: 4,
  },
  navItem: { alignItems: "center" },
  navLabel: { color: "#9ca3af", fontSize: 12 },
  navLabelActive: { color: "#2563eb", fontWeight: "600" },
});
