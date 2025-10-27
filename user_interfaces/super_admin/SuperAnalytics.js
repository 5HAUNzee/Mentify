import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
  
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, updateDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase.config";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

const SuperApprovals = () => {
    const navigation = useNavigation();
    const [pendingCollegeAdmins, setPendingCollegeAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState(null); // Track which user is being processed

    useEffect(() => {
        fetchPendingCollegeAdmins();

        // Real-time listener for pending college admins
        const q = query(
            collection(db, "users"),
            where("role", "==", "collegeadmin"),
            where("status", "==", "pending")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const users = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setPendingCollegeAdmins(users);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    const fetchPendingCollegeAdmins = async () => {
        try {
            setRefreshing(true);
            const q = query(
                collection(db, "users"),
                where("role", "==", "collegeadmin"),
                where("status", "==", "pending")
            );

            const querySnapshot = await getDocs(q);
            const users = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            setPendingCollegeAdmins(users);
        } catch (error) {
            console.error("Error fetching pending college admins:", error);
            Alert.alert("Error", "Failed to load pending approvals");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDecision = async (id, decision, userName) => {
        Alert.alert(
            `Confirm ${decision === "approved" ? "Approval" : "Rejection"}`,
            `Are you sure you want to ${decision === "approved" ? "approve" : "reject"} ${userName}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: decision === "approved" ? "Approve" : "Reject",
                    style: decision === "approved" ? "default" : "destructive",
                    onPress: async () => {
                        try {
                            setProcessingId(id); // Set processing state

                            const userRef = doc(db, "users", id);
                            await updateDoc(userRef, {
                                status: decision,
                                updatedAt: new Date(),
                                reviewedAt: new Date() // Add review timestamp
                            });

                            // The real-time listener will automatically update the list
                            Alert.alert(
                                "Success",
                                `${userName} has been ${decision === "approved" ? "approved" : "rejected"}`,
                                [{ text: "OK" }]
                            );

                        } catch (error) {
                            console.error("Error updating user status:", error);
                            Alert.alert("Error", "Failed to update user status");
                        } finally {
                            setProcessingId(null); // Clear processing state
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        fetchPendingCollegeAdmins();
    };

    const UserCard = ({ user }) => {
        const isProcessing = processingId === user.id;

        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        return (
            <View style={[
                styles.userCard,
                isProcessing && styles.processingCard
            ]}>
                <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                        <Ionicons name="person-circle" size={40} color="#1a73e8" />
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>
                            {user.firstName} {user.lastName}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        <Text style={styles.userCollege}>{user.college}</Text>
                        {user.department && (
                            <Text style={styles.userDepartment}>{user.department}</Text>
                        )}
                    </View>
                    <View style={styles.pendingBadge}>
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#fbbc04" />
                        ) : (
                            <Ionicons name="time-outline" size={16} color="#fbbc04" />
                        )}
                        <Text style={styles.pendingText}>
                            {isProcessing ? "Processing..." : "Pending"}
                        </Text>
                    </View>
                </View>

                <View style={styles.userDetails}>
                    <View style={styles.detailItem}>
                        <Ionicons name="business-outline" size={16} color="#5f6368" />
                        <Text style={styles.detailText}>College Admin</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={16} color="#5f6368" />
                        <Text style={styles.detailText}>
                            Applied: {formatDate(user.createdAt)}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.rejectButton,
                            isProcessing && styles.disabledButton
                        ]}
                        onPress={() => handleDecision(user.id, "rejected", `${user.firstName} ${user.lastName}`)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="close" size={20} color="#ffffff" />
                                <Text style={styles.rejectButtonText}>Reject</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.approveButton,
                            isProcessing && styles.disabledButton
                        ]}
                        onPress={() => handleDecision(user.id, "approved", `${user.firstName} ${user.lastName}`)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#ffffff" />
                                <Text style={styles.approveButtonText}>Approve</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const StatCard = ({ icon, value, label, color }) => (
        <View style={styles.statCard}>
            <LinearGradient
                colors={[`${color}15`, `${color}08`]}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={icon} size={24} color={color} />
                <Text style={[styles.statValue, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </LinearGradient>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>Loading Approvals...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.container}>
                {/* Header with Back Button */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color="#1f2937" />
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="people-outline"
                            value={pendingCollegeAdmins.length}
                            label="Pending"
                            color="#fbbc04"
                        />
                        <StatCard
                            icon="business-outline"
                            value={pendingCollegeAdmins.filter(user => user.college).length}
                            label="Colleges"
                            color="#1a73e8"
                        />
                        <StatCard
                            icon="time-outline"
                            value={pendingCollegeAdmins.filter(user => {
                                const oneWeekAgo = new Date();
                                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                return user.createdAt > oneWeekAgo;
                            }).length}
                            label="This Week"
                            color="#34a853"
                        />
                    </View>
                </View>

                {/* Pending Approvals List */}
                <View style={styles.listSection}>
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>
                            {pendingCollegeAdmins.length} Pending Request(s)
                        </Text>
                        <TouchableOpacity
                            onPress={onRefresh}
                            disabled={refreshing}
                            style={refreshing && styles.disabledRefresh}
                        >
                            {refreshing ? (
                                <ActivityIndicator size="small" color="#1a73e8" />
                            ) : (
                                <Ionicons name="refresh" size={20} color="#1a73e8" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={pendingCollegeAdmins}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <UserCard user={item} />}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#1a73e8"]}
                                tintColor="#1a73e8"
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContainer,
                            pendingCollegeAdmins.length === 0 && styles.emptyListContainer
                        ]}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-done-outline" size={64} color="#34a853" />
                                <Text style={styles.emptyText}>All Caught Up!</Text>
                                <Text style={styles.emptySubtext}>
                                    No pending college admin requests at the moment.
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#5f6368",
    },
    // Header Styles
    header: {
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    backButtonText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: '600',
        color: "#1f2937",
    },
    // Stats Section
    statsSection: {
        padding: 16,
        backgroundColor: "#ffffff",
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    statCard: {
        flex: 1,
    },
    statGradient: {
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        minHeight: 100,
        justifyContent: "center",
    },
    statValue: {
        fontSize: 20,
        fontWeight: "800",
        marginVertical: 8,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5f6368",
        textTransform: "uppercase",
    },
    // List Section
    listSection: {
        flex: 1,
        backgroundColor: "#ffffff",
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e8eaed",
    },
    listTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#202124",
    },
    listContainer: {
        padding: 16,
    },
    emptyListContainer: {
        flexGrow: 1,
    },
    // User Card Styles
    userCard: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e8eaed",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    processingCard: {
        opacity: 0.7,
        backgroundColor: "#f8f9fa",
    },
    userHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    userAvatar: {
        marginRight: 12,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#202124",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: "#5f6368",
        marginBottom: 2,
    },
    userCollege: {
        fontSize: 14,
        color: "#1a73e8",
        fontWeight: "500",
        marginBottom: 2,
    },
    userDepartment: {
        fontSize: 13,
        color: "#34a853",
        fontWeight: "500",
    },
    pendingBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "#fbbc0415",
        borderWidth: 1,
        borderColor: "#fbbc04",
        gap: 4,
    },
    pendingText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fbbc04",
    },
    userDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: "#5f6368",
        fontWeight: "500",
    },
    actionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    rejectButton: {
        backgroundColor: "#ea4335",
    },
    approveButton: {
        backgroundColor: "#34a853",
    },
    disabledButton: {
        opacity: 0.6,
    },
    rejectButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
    },
    approveButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "600",
    },
    disabledRefresh: {
        opacity: 0.5,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#34a853",
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#5f6368",
        textAlign: "center",
    },
});

export default SuperApprovals;