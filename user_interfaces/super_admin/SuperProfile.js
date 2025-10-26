import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
} from "react-native";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const SuperAdminProfile = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const navigation = useNavigation();

    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleSignOut = async () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            navigation.replace("Auth");
                        } catch (err) {
                            console.error("Sign out error:", err);
                            Alert.alert("Error", "Failed to sign out. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return;

            try {
                const userRef = doc(db, "users", user.id);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    console.log("Fetched user data:", data); // For debugging
                    setUserData(data);
                } else {
                    console.log("No user data found in Firestore for ID:", user.id);
                    Alert.alert("Error", "No user data found in the system.");
                }
            } catch (error) {
                console.error("Error fetching superadmin data:", error);
                Alert.alert("Error", "Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    const formatDate = (timestamp) => {
        if (!timestamp?.toDate) return "N/A";
        return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getRoleColor = (role) => {
        const roleLower = role?.toLowerCase() || '';
        if (roleLower.includes('superadmin')) return '#dc2626';
        if (roleLower.includes('admin')) return '#ea580c';
        if (roleLower.includes('faculty')) return '#d97706';
        if (roleLower.includes('student')) return '#059669';
        return '#3b82f6';
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower === 'approved') return '#059669';
        if (statusLower === 'pending') return '#d97706';
        if (statusLower === 'rejected') return '#dc2626';
        if (statusLower === 'suspended') return '#6b7280';
        return '#3b82f6';
    };

    const InfoCard = ({ icon, label, value, valueColor = "#1f2937" }) => (
        <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
                <Ionicons name={icon} size={20} color="#1a73e8" />
                <Text style={styles.cardLabel}>{label}</Text>
            </View>
            <Text style={[styles.cardValue, { color: valueColor }]} numberOfLines={2}>
                {value || "Not specified"}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>Loading Profile Data...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!userData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#d93025" />
                    <Text style={styles.errorTitle}>Profile Not Found</Text>
                    <Text style={styles.errorText}>Unable to load your profile data.</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => window.location.reload()}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const { firstName, lastName, email, role, college, department, status, createdAt } = userData;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {firstName?.[0]}{lastName?.[0]}
                            </Text>
                        </View>
                        <View style={[styles.verifiedBadge, { backgroundColor: getRoleColor(role) }]}>
                            <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
                        </View>
                    </View>

                    <Text style={styles.userName}>{firstName} {lastName}</Text>

                    <View style={styles.badgesContainer}>
                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(role) }]}>
                            <Ionicons name="star" size={14} color="#ffffff" />
                            <Text style={styles.roleText}>{role}</Text>
                        </View>

                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                            <View style={[styles.statusDot, { backgroundColor: '#ffffff' }]} />
                            <Text style={styles.statusText}>{status}</Text>
                        </View>
                    </View>
                </View>

                {/* Personal Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <InfoCard
                        icon="person-outline"
                        label="Full Name"
                        value={`${firstName} ${lastName}`}
                    />

                    <InfoCard
                        icon="mail-outline"
                        label="Email Address"
                        value={email}
                    />

                    <InfoCard
                        icon="call-outline"
                        label="User ID"
                        value={user?.id}
                        valueColor="#6b7280"
                    />
                </View>

                {/* College Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>College Information</Text>

                    <InfoCard
                        icon="business-outline"
                        label="College"
                        value={college}
                    />

                    <InfoCard
                        icon="library-outline"
                        label="Department"
                        value={department}
                    />
                </View>

                {/* Account Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <InfoCard
                        icon="shield-checkmark-outline"
                        label="Role"
                        value={role}
                        valueColor={getRoleColor(role)}
                    />

                    <InfoCard
                        icon="time-outline"
                        label="Member Since"
                        value={formatDate(createdAt)}
                    />

                    <InfoCard
                        icon="checkmark-circle-outline"
                        label="Account Status"
                        value={status}
                        valueColor={getStatusColor(status)}
                    />
                </View>

                {/* Quick Stats Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>System Overview</Text>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Ionicons name="people-outline" size={24} color="#1a73e8" />
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Total Users</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="school-outline" size={24} color="#1a73e8" />
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Colleges</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="document-outline" size={24} color="#1a73e8" />
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Reports</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons Section */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate("EditProfile")}
                    >
                        <Ionicons name="create-outline" size={20} color="#ffffff" />
                        <Text style={styles.primaryButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton}>
                        <Ionicons name="settings-outline" size={20} color="#1a73e8" />
                        <Text style={styles.secondaryButtonText}>Account Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleSignOut}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#dc2626" />
                        <Text style={styles.logoutButtonText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        User ID: {user?.id}
                    </Text>
                    <Text style={styles.footerSubtext}>
                        Last updated: {formatDate(createdAt)}
                    </Text>
                </View>
            </ScrollView>
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
        backgroundColor: "#f8fafc",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#6b7280",
        fontWeight: "500",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#ffffff",
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#dc2626",
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: "#6b7280",
        textAlign: "center",
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: "#1a73e8",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    header: {
        alignItems: "center",
        paddingVertical: 32,
        paddingHorizontal: 24,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#1a73e8",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: "600",
        color: "#ffffff",
    },
    verifiedBadge: {
        position: "absolute",
        bottom: 4,
        right: 4,
        borderRadius: 12,
        width: 28,
        height: 28,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    userName: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 12,
        textAlign: "center",
    },
    badgesContainer: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    roleBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
        textTransform: "capitalize",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
        textTransform: "capitalize",
    },
    section: {
        backgroundColor: "#ffffff",
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: "#1a73e8",
    },
    infoHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    cardLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    cardValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
        lineHeight: 22,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: "#f8fafc",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    statNumber: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a73e8",
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "500",
        color: "#6b7280",
        textTransform: "uppercase",
        textAlign: "center",
    },
    actionsSection: {
        padding: 16,
        gap: 12,
        marginTop: 16,
    },
    primaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#1a73e8",
        padding: 16,
        borderRadius: 12,
        gap: 8,
        shadowColor: "#1a73e8",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
    },
    secondaryButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#1a73e8",
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a73e8",
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#fecaca",
        gap: 8,
        marginTop: 8,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#dc2626",
    },
    footer: {
        alignItems: "center",
        padding: 20,
        marginTop: 16,
    },
    footerText: {
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "center",
    },
    footerSubtext: {
        fontSize: 11,
        color: "#d1d5db",
        marginTop: 4,
        textAlign: "center",
    },
});

export default SuperAdminProfile;