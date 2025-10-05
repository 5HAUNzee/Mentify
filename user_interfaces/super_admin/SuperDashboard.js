import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Alert, TouchableOpacity } from "react-native";
import {
  doc,
  getDocs,
  collection,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function SuperDashboard({ navigation }) {
  const { signOut } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  
  const VEREL_API = "https://yourproject.vercel.app/api/sendEmail"; // <- Replace with your deployed URL

  useEffect(() => {
    const fetchPendingUsers = async () => {
      const q = query(
        collection(db, "users"),
        where("status", "==", "pending"),
        where("role", "==", "collegeadmin"),
        where("college", "==", "Goa College of Engineering")
      );
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(users);
    };
    fetchPendingUsers();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const sendEmail = async (user, status) => {
    try {
      const res = await fetch(VEREL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to send email");
      console.log(`${status} email sent to ${user.email}`);
    } catch (err) {
      console.error("Email error:", err);
    }
  };

  const approveUser = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { status: "approved" });
      await sendEmail(user, "approved");
      Alert.alert("Success", `${user.firstName} approved`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to approve");
    }
  };

  const rejectUser = async (user) => {
    try {
      await updateDoc(doc(db, "users", user.id), { status: "rejected" });
      await sendEmail(user, "rejected");
      Alert.alert("Success", `${user.firstName} rejected`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to reject");
    }
  };

  const renderUser = ({ item }) => (
    <View
      style={{
        marginVertical: 10,
        padding: 15,
        borderWidth: 1,
        borderRadius: 10,
        borderColor: "#ddd",
        backgroundColor: "#f9f9f9",
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={{ marginBottom: 10, color: "#555" }}>
        {item.role || "Not set"}
      </Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <TouchableOpacity
          onPress={() => approveUser(item)}
          style={{
            backgroundColor: "#10B981",
            padding: 10,
            borderRadius: 5,
            flex: 0.48,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
            Approve
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => rejectUser(item)}
          style={{
            backgroundColor: "#EF4444",
            padding: 10,
            borderRadius: 5,
            flex: 0.48,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>
            Reject
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f2f4f7" }}>
      <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 20 }}>
        SuperAdmin Dashboard
      </Text>

      {pendingUsers.length === 0 ? (
        <Text
          style={{
            fontSize: 16,
            color: "#555",
            textAlign: "center",
            marginTop: 50,
          }}
        >
          No pending users
        </Text>
      ) : (
        <FlatList
          data={pendingUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
        />
      )}

      <TouchableOpacity
        onPress={handleSignOut}
        style={{
          backgroundColor: "#2563EB",
          padding: 15,
          borderRadius: 10,
          marginTop: 20,
        }}
      >
        <Text
          style={{ color: "white", fontWeight: "bold", textAlign: "center" }}
        >
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
