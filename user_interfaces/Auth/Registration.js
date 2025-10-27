// screens/Registration.js - MODERN CLEAN UI
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import {
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";

const Registration = ({ navigation }) => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "";

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [role, setRole] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName || !lastName || !role || !college || !department) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.id);
      let status = "pending";

      if (role === "mentee") status = "approved";

      if (role === "superadmin") {
        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          status = "approved";
        } else {
          Alert.alert(
            "Error",
            "Superadmin credentials do not match pre-created record"
          );
          setLoading(false);
          return;
        }
      }

      await setDoc(
        userRef,
        {
          firstName,
          lastName,
          role,
          college,
          department,
          email,
          status,
          createdAt: new Date(),
        },
        { merge: true }
      );

      setLoading(false);

      if (status === "approved") {
        switch (role) {
          case "mentee":
            navigation.replace("MenteeDashboard");
            break;
          case "superadmin":
            navigation.replace("SuperAdminDashboard");
            break;
          case "collegeadmin":
            navigation.replace("CollegeDashboard");
            break;
          case "deptadmin":
            navigation.replace("DeptDashboard");
            break;
          case "mentor":
            navigation.replace("MentorDashboard");
            break;
          default:
            navigation.replace("Dashboard");
        }
      } else {
        navigation.replace("ApprovalPendingScreen");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      Alert.alert("Error", "Failed to save user info");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={["#1e40af", "#3b82f6"]}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Feather name="clipboard" size={28} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Registration</Text>
            <Text style={styles.headerSubtitle}>
              Create your account
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.disabledInputWrapper}>
                <TextInput
                  value={email}
                  editable={false}
                  style={styles.disabledInput}
                />
                <Feather name="lock" size={16} color="#9ca3af" />
              </View>
            </View>

            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Role */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={role}
                  onValueChange={setRole}
                  style={styles.picker}
                >
                  <Picker.Item label="Select your role" value="" />
                  <Picker.Item label="Mentee" value="mentee" />
                  <Picker.Item label="Mentor" value="mentor" />
                  <Picker.Item label="Department Admin" value="deptadmin" />
                  <Picker.Item label="College Admin" value="collegeadmin" />
                  <Picker.Item label="Super Admin" value="superadmin" />
                </Picker>
              </View>
            </View>

            {/* College */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>College *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={college}
                  onValueChange={setCollege}
                  style={styles.picker}
                >
                  <Picker.Item label="Select your college" value="" />
                  <Picker.Item
                    label="Goa College of Engineering"
                    value="Goa College of Engineering"
                  />
                  <Picker.Item
                    label="Agnel Institute of Technology and Design"
                    value="Agnel Institute of Technology and Design"
                  />
                </Picker>
              </View>
            </View>

            {/* Department */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Department *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={department}
                  onValueChange={setDepartment}
                  style={styles.picker}
                >
                  <Picker.Item label="Select your department" value="" />
                  <Picker.Item
                    label="Computer Engineering"
                    value="Computer Engineering"
                  />
                  <Picker.Item
                    label="Mechanical Engineering"
                    value="Mechanical Engineering"
                  />
                  <Picker.Item
                    label="Civil Engineering"
                    value="Civil Engineering"
                  />
                  <Picker.Item
                    label="Electronics and Telecommunication"
                    value="Electronics and Telecommunication"
                  />
                  <Picker.Item label="VLSI" value="VLSI" />
                </Picker>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={loading ? ["#9ca3af", "#6b7280"] : ["#3b82f6", "#2563eb"]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <Text style={styles.submitText}>Creating Account...</Text>
                ) : (
                  <>
                    <Text style={styles.submitText}>Create Account</Text>
                    <Feather name="arrow-right" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default Registration;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 35,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#dbeafe",
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 28,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#fff",
  },
  disabledInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f9fafb",
  },
  disabledInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#6b7280",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 52,
    color: "#111827",
  },
  submitButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
