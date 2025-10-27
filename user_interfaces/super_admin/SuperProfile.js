import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Alert,
    Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useUser } from "@clerk/clerk-expo";

const { width } = Dimensions.get('window');

// Service function to fetch user profile
const fetchUserProfile = async (userId) => {
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                ...data,
                createdAt: data.createdAt?.toDate() || null,
                updatedAt: data.updatedAt?.toDate() || null,
                reviewedAt: data.reviewedAt?.toDate() || null,
            };
        } else {
            console.log("No such user found!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

const SuperProfile = () => {
    const navigation = useNavigation();
    const { user } = useUser();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadProfile = async () => {
        try {
            setLoading(true);
            if (!user?.id) {
                console.log("No user ID available");
                return;
            }

            const data = await fetchUserProfile(user.id);
            setProfile(data);
        } catch (error) {
            console.error("Error loading profile:", error);
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        loadProfile();
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "approved": return "#10b981";
            case "pending": return "#f59e0b";
            case "rejected": return "#ef4444";
            default: return "#6b7280";
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case "super_admin": return "#3b82f6";
            case "college_admin": return "#10b981";
            case "dept_admin": return "#f59e0b";
            case "mentor": return "#8b5cf6";
            case "mentee": return "#06b6d4";
            default: return "#6b7280";
        }
    };

    const InfoCard = ({ title, value, icon, color = "#3b82f6" }) => (
        <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
                <View style={[styles.infoIcon, { backgroundColor: color }]}>
                    <Ionicons name={icon} size={20} color="#fff" />
                </View>
                <Text style={styles.infoTitle}>{title}</Text>
            </View>
            <Text style={styles.infoValue}>{value || "N/A"}</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text style={styles.loadingText}>Loading Profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.errorContainer}>
                    <Ionicons name="person-circle-outline" size={64} color="#6b7280" />
                    <Text style={styles.errorTitle}>Profile Not Found</Text>
                    <Text style={styles.errorText}>
                        Unable to load your profile information.
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <ScrollView
                style={styles.container}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person-circle" size={80} color="#3b82f6" />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={styles.userName}>
                                {profile.firstName} {profile.lastName}
                            </Text>
                            <Text style={styles.userEmail}>{profile.email}</Text>
                            <View style={styles.badgeContainer}>
                                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(profile.role) }]}>
                                    <Text style={styles.roleText}>
                                        {profile.role?.replace('_', ' ') || 'No Role'}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(profile.status) }]}>
                                    <Text style={styles.statusText}>
                                        {profile.status || 'Unknown'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Personal Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <View style={styles.infoGrid}>
                        <InfoCard
                            title="First Name"
                            value={profile.firstName}
                            icon="person-outline"
                            color="#3b82f6"
                        />
                        <InfoCard
                            title="Last Name"
                            value={profile.lastName}
                            icon="person-outline"
                            color="#3b82f6"
                        />
                        <InfoCard
                            title="Email Address"
                            value={profile.email}
                            icon="mail-outline"
                            color="#10b981"
                        />
                        {/* <InfoCard
                            title="Phone"
                            value={profile.phone || "Not provided"}
                            icon="call-outline"
                            color="#f59e0b"
                        /> */}
                    </View>
                </View>

                {/* Institutional Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Institutional Information</Text>
                    <View style={styles.infoGrid}>
                        <InfoCard
                            title="College"
                            value={profile.college}
                            icon="business-outline"
                            color="#8b5cf6"
                        />
                        <InfoCard
                            title="Department"
                            value={profile.department}
                            icon="school-outline"
                            color="#06b6d4"
                        />
                        <InfoCard
                            title="Role"
                            value={profile.role?.replace('_', ' ')}
                            icon="shield-checkmark-outline"
                            color={getRoleColor(profile.role)}
                        />
                        <InfoCard
                            title="Status"
                            value={profile.status}
                            icon="time-outline"
                            color={getStatusColor(profile.status)}
                        />
                    </View>
                </View>

                {/* Account Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Timeline</Text>
                    <View style={styles.timeline}>
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Account Created</Text>
                                <Text style={styles.timelineDate}>
                                    {formatDate(profile.createdAt)}
                                </Text>
                            </View>
                        </View>

                        {profile.reviewedAt && (
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineDot} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Account Reviewed</Text>
                                    <Text style={styles.timelineDate}>
                                        {formatDate(profile.reviewedAt)}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {profile.updatedAt && (
                            <View style={styles.timelineItem}>
                                <View style={styles.timelineDot} />
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Last Updated</Text>
                                    <Text style={styles.timelineDate}>
                                        {formatDate(profile.updatedAt)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Additional Information
                {(profile.bio || profile.skills || profile.interests) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Additional Information</Text>
                        {profile.bio && (
                            <View style={styles.additionalInfo}>
                                <Text style={styles.additionalLabel}>Bio</Text>
                                <Text style={styles.additionalValue}>{profile.bio}</Text>
                            </View>
                        )}
                        {profile.skills && (
                            <View style={styles.additionalInfo}>
                                <Text style={styles.additionalLabel}>Skills</Text>
                                <Text style={styles.additionalValue}>{profile.skills}</Text>
                            </View>
                        )}
                        {profile.interests && (
                            <View style={styles.additionalInfo}>
                                <Text style={styles.additionalLabel}>Interests</Text>
                                <Text style={styles.additionalValue}>{profile.interests}</Text>
                            </View>
                        )}
                )}
                    </View> */}

                {/* Quick Actions */}
                {/* <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="create-outline" size={20} color="#3b82f6" />
                            <Text style={styles.actionText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="settings-outline" size={20} color="#6b7280" />
                            <Text style={styles.actionText}>Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
                            <Text style={styles.actionText}>Help & Support</Text>
                        </TouchableOpacity>
                    </View>
                </View> */}

                {/* Bottom Spacer */}
                {/* <View style={styles.bottomSpacer} /> */}
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
        backgroundColor: "#ffffff",
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
        color: "#6b7280",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        backgroundColor: "#ffffff",
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: "#111827",
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
        backgroundColor: "#3b82f6",
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
        backgroundColor: "#ffffff",
        paddingVertical: 32,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarContainer: {
        marginRight: 20,
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 16,
    },
    badgeContainer: {
        flexDirection: "row",
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
        textTransform: "capitalize",
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
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#f3f4f6",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 16,
    },
    infoGrid: {
        gap: 12,
    },
    infoCard: {
        backgroundColor: "#ffffff",
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    infoHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    infoIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: "500",
        color: "#6b7280",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    timeline: {
        gap: 16,
    },
    timelineItem: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#3b82f6",
        marginTop: 4,
        marginRight: 16,
        borderWidth: 2,
        borderColor: "#ffffff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 4,
    },
    timelineDate: {
        fontSize: 12,
        color: "#6b7280",
    },
    additionalInfo: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: "#f8fafc",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    additionalLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#6b7280",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    additionalValue: {
        fontSize: 14,
        color: "#111827",
        lineHeight: 20,
    },
    actions: {
        gap: 8,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    actionText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
        marginLeft: 12,
    },
    bottomSpacer: {
        height: 50,
    },
});

export default SuperProfile;