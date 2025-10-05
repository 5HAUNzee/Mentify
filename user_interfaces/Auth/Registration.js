import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  doc,
  setDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";

const Registration = ({ navigation }) => {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress || "";

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [role, setRole] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");

  const handleSubmit = async () => {
    if (!firstName || !lastName || !role || !college || !department) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
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

      if (status === "approved") {
        switch (role) {
          case "mentee":
            navigation.replace("MenteeDashboard");
            break;
          case "superadmin":
            navigation.replace("SuperDashboard");
            break;
          case "collegeadmin":
            navigation.replace("CollegeAdminDashboard");
            break;
          case "deptadmin":
            navigation.replace("DeptAdminDashboard");
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
      Alert.alert("Error", "Failed to save user info");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Join Mentify</Text>
        <Text style={styles.headerSubtitle}>
          Complete your registration to continue
        </Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.label}>Email (auto-filled)</Text>
        <TextInput
          value={email}
          editable={false}
          style={[styles.input, { backgroundColor: "#f1f1f1" }]}
        />

        <Text style={styles.label}>First Name *</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Enter your first name"
          style={styles.input}
        />

        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Enter your last name"
          style={styles.input}
        />

        <Text style={styles.label}>Role *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={role}
            onValueChange={setRole}
            style={styles.picker}
          >
            <Picker.Item label="Select Role" value="" />
            <Picker.Item label="Mentee" value="mentee" />
            <Picker.Item label="Super Admin" value="superadmin" />
            <Picker.Item label="College Admin" value="collegeadmin" />
            <Picker.Item label="Dept Admin" value="deptadmin" />
            <Picker.Item label="Mentor" value="mentor" />
          </Picker>
        </View>

        <Text style={styles.label}>College *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={college}
            onValueChange={setCollege}
            style={styles.picker}
          >
            <Picker.Item label="Select College" value="" />
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

        <Text style={styles.label}>Department *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={department}
            onValueChange={setDepartment}
            style={styles.picker}
          >
            <Picker.Item label="Select Department" value="" />
            <Picker.Item
              label="Computer Engineering"
              value="Computer Engineering"
            />
            <Picker.Item
              label="Mechanical Engineering"
              value="Mechanical Engineering"
            />
            <Picker.Item label="Civil Engineering" value="Civil Engineering" />
            <Picker.Item
              label="Electronics and Telecommunication"
              value="Electronics and Telecommunication"
            />
            <Picker.Item label="VLSI" value="VLSI" />
          </Picker>
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Registration;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f9ff",
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1E3A8A",
  },
  headerSubtitle: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    fontWeight: "600",
    color: "#334155",
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#334155",
  },
  submitButton: {
    marginTop: 30,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
