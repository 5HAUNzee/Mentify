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
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function MenteeProfile({ navigation }) {
  const { signOut, userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [editing, setEditing] = useState(false);

  // User data
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    college: "",
    role: "mentee",
    status: "pending",
    rollNumber: "",
    currentSem: "",
    sgpaHistory: [], // [{sem: 1, sgpa: 8.5}, {sem: 2, sgpa: 9.0}]
    profilePic: null,
    studentSignature: null,
    parentSignature: null,
    mentorName: "",
    mentorId: null,
  });

  // Edit form data
  const [editData, setEditData] = useState({
    rollNumber: "",
    currentSem: "",
  });

  const [sgpaInputs, setSgpaInputs] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageType, setImageType] = useState(null); // 'profile', 'studentSignature', 'parentSignature'

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Fetch basic user info from users collection
      const userDocRef = doc(db, "users", userId);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        Alert.alert("Error", "User not found");
        return;
      }

      const basicUserData = userSnap.data();

      // Fetch mentee-specific data from mentees collection
      const menteeDocRef = doc(db, "mentees", userId);
      const menteeSnap = await getDoc(menteeDocRef);

      // Fetch mentor assignment
      let mentorName = "";
      let mentorId = null;
      try {
        const assignmentsRef = collection(db, "assignments");
        const q = query(assignmentsRef, where("menteeId", "==", userId));
        const assignmentSnap = await getDocs(q);

        if (!assignmentSnap.empty) {
          const assignmentData = assignmentSnap.docs[0].data();
          mentorId = assignmentData.mentorId;

          // Fetch mentor name from users collection
          if (mentorId) {
            const mentorDocRef = doc(db, "users", mentorId);
            const mentorSnap = await getDoc(mentorDocRef);
            if (mentorSnap.exists()) {
              const mentorData = mentorSnap.data();
              mentorName = `${mentorData.firstName || ""} ${
                mentorData.lastName || ""
              }`.trim();
            }
          }
        }
      } catch (err) {
        console.error("Error fetching mentor:", err);
      }

      if (menteeSnap.exists()) {
        const menteeData = menteeSnap.data();
        const combinedData = {
          ...basicUserData,
          ...menteeData,
          mentorName,
          mentorId,
        };

        setUserData(combinedData);
        setEditData({
          rollNumber: menteeData.rollNumber || "",
          currentSem: menteeData.currentSem?.toString() || "",
        });
        setIsFirstTime(false);
      } else {
        // First time user - set basic info from users collection
        setUserData({
          firstName: basicUserData.firstName || "",
          lastName: basicUserData.lastName || "",
          email: basicUserData.email || "",
          department: basicUserData.department || "",
          college: basicUserData.college || "",
          role: "mentee",
          status: basicUserData.status || "pending",
          rollNumber: "",
          currentSem: "",
          sgpaHistory: [],
          profilePic: basicUserData.profilePic || null,
          studentSignature: null,
          parentSignature: null,
          mentorName,
          mentorId,
        });
        setIsFirstTime(true);
        setEditing(true);
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

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
      console.log("Cloudinary response:", result);

      if (!result.secure_url) {
        throw new Error(result.error?.message || "Upload failed");
      }

      const downloadURL = result.secure_url;

      // Update Firestore
      const userDocRef = doc(db, "mentees", userId);
      const updateField =
        type === "profile"
          ? "profilePic"
          : type === "studentSignature"
          ? "studentSignature"
          : "parentSignature";

      if (isFirstTime) {
        // For first time, just update local state
        setUserData((prev) => ({
          ...prev,
          [updateField]: downloadURL,
        }));
      } else {
        // Update Firestore for existing users
        await updateDoc(userDocRef, {
          [updateField]: downloadURL,
        });
        setUserData((prev) => ({
          ...prev,
          [updateField]: downloadURL,
        }));
      }

      Alert.alert(
        "Success",
        `${
          type === "profile"
            ? "Profile picture"
            : type === "studentSignature"
            ? "Student signature"
            : "Parent signature"
        } uploaded successfully`
      );
      setImageModalVisible(false);
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err);
      Alert.alert("Error", "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSemesterChange = (sem) => {
    const semNumber = parseInt(sem);
    setEditData((prev) => ({ ...prev, currentSem: sem }));

    // Generate SGPA inputs for previous semesters
    if (semNumber > 1) {
      const existingSgpa = userData.sgpaHistory || [];
      const inputs = [];
      for (let i = 1; i < semNumber; i++) {
        const existing = existingSgpa.find((s) => s.sem === i);
        inputs.push({
          sem: i,
          sgpa: existing?.sgpa?.toString() || "",
        });
      }
      setSgpaInputs(inputs);
    } else {
      setSgpaInputs([]);
    }
  };

  const updateSgpa = (sem, value) => {
    setSgpaInputs((prev) =>
      prev.map((item) => (item.sem === sem ? { ...item, sgpa: value } : item))
    );
  };

  const validateAndSaveProfile = async () => {
    // Validation
    if (!editData.rollNumber.trim()) {
      Alert.alert("Error", "Roll number is required");
      return;
    }

    if (!editData.currentSem || parseInt(editData.currentSem) < 1) {
      Alert.alert("Error", "Please enter a valid current semester");
      return;
    }

    // Validate SGPA inputs if semester > 1
    const currentSem = parseInt(editData.currentSem);
    if (currentSem > 1) {
      for (let input of sgpaInputs) {
        if (
          !input.sgpa ||
          parseFloat(input.sgpa) < 0 ||
          parseFloat(input.sgpa) > 10
        ) {
          Alert.alert(
            "Error",
            `Please enter valid SGPA for Semester ${input.sem} (0-10)`
          );
          return;
        }
      }
    }

    // Check if signatures are uploaded for first time users
    if (isFirstTime) {
      if (!userData.studentSignature) {
        Alert.alert("Error", "Please upload student signature");
        return;
      }
      if (!userData.parentSignature) {
        Alert.alert("Error", "Please upload parent signature");
        return;
      }
    }

    try {
      setSaving(true);
      const menteeDocRef = doc(db, "mentees", userId);

      // Prepare SGPA history
      const sgpaHistory = sgpaInputs.map((input) => ({
        sem: input.sem,
        sgpa: parseFloat(input.sgpa),
      }));

      const menteeData = {
        rollNumber: editData.rollNumber.trim().toUpperCase(),
        currentSem: parseInt(editData.currentSem),
        sgpaHistory: sgpaHistory,
        studentSignature: userData.studentSignature || null,
        parentSignature: userData.parentSignature || null,
        updatedAt: new Date().toISOString(),
      };

      if (isFirstTime) {
        // Create new document with createdAt
        await setDoc(menteeDocRef, {
          ...menteeData,
          createdAt: new Date().toISOString(),
        });
        Alert.alert("Success", "Profile created successfully!");
        setIsFirstTime(false);
      } else {
        // Update existing document
        await updateDoc(menteeDocRef, menteeData);
        Alert.alert("Success", "Profile updated successfully");
      }

      setUserData((prev) => ({
        ...prev,
        ...menteeData,
      }));

      setEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const openImageModal = (type) => {
    setImageType(type);
    setImageModalVisible(true);
  };

  const calculateCGPA = () => {
    if (!userData.sgpaHistory || userData.sgpaHistory.length === 0) {
      return "N/A";
    }
    const total = userData.sgpaHistory.reduce(
      (sum, item) => sum + item.sgpa,
      0
    );
    const cgpa = total / userData.sgpaHistory.length;
    return cgpa.toFixed(2);
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

  // First-time setup screen
  if (isFirstTime) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Complete Your Profile</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.welcomeCard}>
            <Feather name="user-plus" size={48} color="#10b981" />
            <Text style={styles.welcomeTitle}>Welcome to Mentify!</Text>
            <Text style={styles.welcomeText}>
              Please complete your profile to get started
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name (from users db)</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userData.firstName}
                editable={false}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name (from users db)</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userData.lastName}
                editable={false}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (from users db)</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={userData.email}
                editable={false}
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Roll Number *</Text>
              <TextInput
                style={styles.input}
                value={editData.rollNumber}
                onChangeText={(text) =>
                  setEditData((prev) => ({ ...prev, rollNumber: text }))
                }
                placeholder="Enter roll number"
                placeholderTextColor="#9ca3af"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Semester *</Text>
              <TextInput
                style={styles.input}
                value={editData.currentSem}
                onChangeText={(text) => handleSemesterChange(text)}
                placeholder="Enter current semester (1-8)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                maxLength={1}
              />
            </View>
          </View>

          {/* SGPA History for Previous Semesters */}
          {sgpaInputs.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Previous Semester SGPA</Text>
              <Text style={styles.cardSubtitle}>
                Enter your SGPA for each completed semester
              </Text>

              {sgpaInputs.map((input) => (
                <View key={input.sem} style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Semester {input.sem} SGPA *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={input.sgpa}
                    onChangeText={(text) => updateSgpa(input.sem, text)}
                    placeholder="Enter SGPA (0-10)"
                    placeholderTextColor="#9ca3af"
                    keyboardType="decimal-pad"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Signatures */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Digital Signatures *</Text>

            <Text style={styles.signatureLabel}>Student Signature</Text>
            <TouchableOpacity
              style={styles.signatureContainer}
              onPress={() => openImageModal("studentSignature")}
            >
              {userData.studentSignature ? (
                <Image
                  source={{ uri: userData.studentSignature }}
                  style={styles.signatureImage}
                />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Feather name="edit-3" size={32} color="#9ca3af" />
                  <Text style={styles.signaturePlaceholderText}>
                    Tap to upload student signature
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.signatureLabel, { marginTop: 16 }]}>
              Parent Signature
            </Text>
            <TouchableOpacity
              style={styles.signatureContainer}
              onPress={() => openImageModal("parentSignature")}
            >
              {userData.parentSignature ? (
                <Image
                  source={{ uri: userData.parentSignature }}
                  style={styles.signatureImage}
                />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Feather name="edit-3" size={32} color="#9ca3af" />
                  <Text style={styles.signaturePlaceholderText}>
                    Tap to upload parent signature
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={validateAndSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Complete Profile</Text>
            )}
          </TouchableOpacity>
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
                  Upload{" "}
                  {imageType === "profile"
                    ? "Profile Picture"
                    : imageType === "studentSignature"
                    ? "Student Signature"
                    : "Parent Signature"}
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
                      <Text style={styles.imageOptionText}>
                        Choose from Gallery
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Regular profile view
  return (
    <SafeAreaView style={styles.container}>
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
              <Image
                source={{ uri: userData.profilePic }}
                style={styles.profilePic}
              />
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
          <Text style={styles.profileRole}>{userData.rollNumber}</Text>
        </View>

        {/* Academic Summary */}
        <View style={styles.academicSummary}>
          <View style={styles.academicCard}>
            <Text style={styles.academicValue}>{userData.currentSem}</Text>
            <Text style={styles.academicLabel}>Current Sem</Text>
          </View>
          <View style={styles.academicCard}>
            <Text style={styles.academicValue}>{calculateCGPA()}</Text>
            <Text style={styles.academicLabel}>CGPA</Text>
          </View>
          <View style={styles.academicCard}>
            <Text style={styles.academicValue}>
              {userData.sgpaHistory?.length || 0}
            </Text>
            <Text style={styles.academicLabel}>Completed Sems</Text>
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
                <Text style={styles.inputLabel}>
                  First Name (from users db)
                </Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={userData.firstName}
                  editable={false}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name (from users db)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={userData.lastName}
                  editable={false}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (from users db)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={userData.email}
                  editable={false}
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.input}
                  value={editData.rollNumber}
                  onChangeText={(text) =>
                    setEditData((prev) => ({ ...prev, rollNumber: text }))
                  }
                  placeholder="Roll Number"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Semester</Text>
                <TextInput
                  style={styles.input}
                  value={editData.currentSem}
                  onChangeText={(text) => handleSemesterChange(text)}
                  placeholder="Current Semester"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>

              {sgpaInputs.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Update SGPA</Text>
                  {sgpaInputs.map((input) => (
                    <View key={input.sem} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>
                        Semester {input.sem} SGPA
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={input.sgpa}
                        onChangeText={(text) => updateSgpa(input.sem, text)}
                        placeholder="Enter SGPA (0-10)"
                        placeholderTextColor="#9ca3af"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
                </>
              )}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={validateAndSaveProfile}
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
                      rollNumber: userData.rollNumber,
                      currentSem: userData.currentSem?.toString(),
                    });
                    setSgpaInputs([]);
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
                <Feather name="hash" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Roll Number</Text>
                  <Text style={styles.infoValue}>{userData.rollNumber}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="book-open" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Current Semester</Text>
                  <Text style={styles.infoValue}>
                    Semester {userData.currentSem}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="book" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Department</Text>
                  <Text style={styles.infoValue}>
                    {userData.department || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="home" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>College</Text>
                  <Text style={styles.infoValue}>
                    {userData.college || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Feather name="user-check" size={18} color="#6b7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Assigned Mentor</Text>
                  <Text style={styles.infoValue}>
                    {userData.mentorName || "Not assigned yet"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* SGPA History */}
        {userData.sgpaHistory && userData.sgpaHistory.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Academic Performance</Text>
            <View style={styles.sgpaGrid}>
              {userData.sgpaHistory.map((item) => (
                <View key={item.sem} style={styles.sgpaItem}>
                  <Text style={styles.sgpaSem}>Sem {item.sem}</Text>
                  <Text style={styles.sgpaValue}>{item.sgpa.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signatures Section */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Digital Signatures</Text>

          <Text style={styles.signatureLabel}>Student Signature</Text>
          <TouchableOpacity
            style={styles.signatureContainer}
            onPress={() => openImageModal("studentSignature")}
          >
            {userData.studentSignature ? (
              <Image
                source={{ uri: userData.studentSignature }}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Feather name="edit-3" size={32} color="#9ca3af" />
                <Text style={styles.signaturePlaceholderText}>
                  Tap to upload student signature
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={[styles.signatureLabel, { marginTop: 16 }]}>
            Parent Signature
          </Text>
          <TouchableOpacity
            style={styles.signatureContainer}
            onPress={() => openImageModal("parentSignature")}
          >
            {userData.parentSignature ? (
              <Image
                source={{ uri: userData.parentSignature }}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signaturePlaceholder}>
                <Feather name="edit-3" size={32} color="#9ca3af" />
                <Text style={styles.signaturePlaceholderText}>
                  Tap to upload parent signature
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
                Upload{" "}
                {imageType === "profile"
                  ? "Profile Picture"
                  : imageType === "studentSignature"
                  ? "Student Signature"
                  : "Parent Signature"}
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
                    <Text style={styles.imageOptionText}>
                      Choose from Gallery
                    </Text>
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
          <Feather name="message-circle" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Doubts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color="#2563EB" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Only replacing the green colors (#10b981) with blue (#3b82f6)
// All other code remains exactly the same

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
    color: "red",
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
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
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
    borderColor: "#3b82f6", // Changed from #10b981
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
    backgroundColor: "#3b82f6", // Changed from #10b981
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
    fontWeight: "600",
  },
  academicSummary: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  academicCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  academicValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3b82f6", // Changed from #10b981
    marginBottom: 4,
  },
  academicLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
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
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6", // Changed from #10b981
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
  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
    marginBottom: 12,
  },
  editActions: {
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#3b82f6", // Changed from #10b981
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
  sgpaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  sgpaItem: {
    backgroundColor: "#eff6ff", // Changed from #f0fdf4
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe", // Changed from #d1fae5
  },
  sgpaSem: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  sgpaValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b82f6", // Changed from #10b981
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  signatureContainer: {
    marginTop: 4,
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
    backgroundColor: "#eff6ff", // Changed from #f0fdf4
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3b82f6", // Changed from #10b981
    gap: 12,
  },
  imageOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3b82f6", // Changed from #10b981
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "space-around",
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
