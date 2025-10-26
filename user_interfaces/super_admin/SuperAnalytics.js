import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList } from "react-native";
import { db } from "../../firebase.config";
import { collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";

const SuperApprovals = () => {
    const [pendingCollegeAdmins, setPendingCollegeAdmins] = useState([]);

    useEffect(() => {
        const fetchPendingCollegeAdmins = async () => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "collegeadmin"),
                    where("status", "==", "pending")
                );

                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setPendingCollegeAdmins(users);
            } catch (error) {
                console.error("Error fetching pending college admins:", error);
            }
        };

        fetchPendingCollegeAdmins();
    }, []);

    const handleDecision = async (id, decision) => {
        const userRef = doc(db, "users", id);
        await updateDoc(userRef, { status: decision });
        setPendingCollegeAdmins((prev) => prev.filter((u) => u.id !== id));
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
                Pending College Admin Approvals
            </Text>

            {pendingCollegeAdmins.length === 0 ? (
                <Text>No pending college admin requests.</Text>
            ) : (
                <FlatList
                    data={pendingCollegeAdmins}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                padding: 10,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: "#ccc",
                                borderRadius: 8,
                            }}
                        >
                            <Text style={{ fontWeight: "bold" }}>
                                {item.firstName} {item.lastName}
                            </Text>
                            <Text>{item.email}</Text>
                            <Text>Role: {item.role}</Text>

                            <View style={{ flexDirection: "row", marginTop: 5 }}>
                                <Button title="Approve" onPress={() => handleDecision(item.id, "approved")} />
                                <View style={{ width: 10 }} />
                                <Button title="Reject" color="red" onPress={() => handleDecision(item.id, "rejected")} />
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

export default SuperApprovals;