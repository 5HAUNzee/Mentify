import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
    ScrollView,
    Dimensions,

    StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const SuperAdminUsersScreen = () => {
    const navigation = useNavigation();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    const tabs = [
        { id: "all", label: "All", icon: "people" },
        { id: "students", label: "Students", icon: "school" },
        { id: "faculty", label: "Faculty", icon: "person" },
        { id: "admins", label: "Admins", icon: "shield" },
        { id: "pending", label: "Pending", icon: "time" },
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, activeTab]);

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, "users");
            const snapshot = await getDocs(usersCollection);
            const userList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setUsers(userList);
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [];

        switch (activeTab) {
            case "all":
                filtered = users;
                break;
            case "students":
                filtered = users.filter(user =>
                    user.role?.toLowerCase().includes("student")
                );
                break;
            case "faculty":
                filtered = users.filter(user =>
                    user.role?.toLowerCase().includes("faculty") ||
                    user.role?.toLowerCase().includes("professor")
                );
                break;
            case "admins":
                filtered = users.filter(user =>
                    user.role?.toLowerCase().includes("admin")
                );
                break;
            case "pending":
                filtered = users.filter(user =>
                    user.status?.toLowerCase() === "pending"
                );
                break;
            default:
                filtered = users;
        }

        setFilteredUsers(filtered);
    };

    const handleDelete = async (id, name) => {
        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${name}? This action cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "users", id));
                            setUsers(users.filter((user) => user.id !== id));
                            Alert.alert("Success", `${name} has been deleted successfully.`);
                        } catch (error) {
                            console.error("Error deleting user:", error);
                            Alert.alert("Error", "Failed to delete user. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const getUserIcon = (role) => {
        const roleLower = role?.toLowerCase() || '';
        if (roleLower.includes('student')) return 'school-outline';
        if (roleLower.includes('faculty') || roleLower.includes('professor')) return 'person-outline';
        if (roleLower.includes('admin')) return 'shield-checkmark-outline';
        return 'person-circle-outline';
    };

    const getUserColor = (role) => {
        const roleLower = role?.toLowerCase() || '';
        if (roleLower.includes('student')) return '#10b981';
        if (roleLower.includes('faculty') || roleLower.includes('professor')) return '#f59e0b';
        if (roleLower.includes('admin')) return '#ef4444';
        return '#3b82f6';
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase() || 'active';
        if (statusLower === 'active') return '#10b981';
        if (statusLower === 'pending') return '#f59e0b';
        if (statusLower === 'suspended') return '#ef4444';
        return '#6b7280';
    };

    const getStatusText = (status) => {
        const statusLower = status?.toLowerCase() || 'active';
        return statusLower.charAt(0).toUpperCase() + statusLower.slice(1);
    };

    const formatDate = (timestamp) => {
        if (!timestamp?.toDate) return "N/A";
        return timestamp.toDate().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const renderUserItem = ({ item }) => (
        <View style={styles.userCard}>
            <View style={styles.userMainInfo}>
                <View style={styles.userAvatar}>
                    <Ionicons
                        name={getUserIcon(item.role)}
                        size={isTablet ? 28 : 24}
                        color={getUserColor(item.role)}
                    />
                </View>

                <View style={styles.userDetails}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.firstName} {item.lastName}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {item.email}
                    </Text>

                    <View style={styles.userMeta}>
                        <View style={[styles.roleBadge, { backgroundColor: getUserColor(item.role) + '20' }]}>
                            <Text style={[styles.roleText, { color: getUserColor(item.role) }]}>
                                {item.role}
                            </Text>
                        </View>

                        <View style={styles.statusContainer}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {getStatusText(item.status)}
                            </Text>
                        </View>
                    </View>

                    {(item.college || item.department) && (
                        <View style={styles.extraInfo}>
                            {item.college && (
                                <Text style={styles.extraText} numberOfLines={1}>
                                    🏫 {item.college}
                                </Text>
                            )}
                            {item.department && (
                                <Text style={styles.extraText} numberOfLines={1}>
                                    📚 {item.department}
                                </Text>
                            )}
                        </View>
                    )}

                    <Text style={styles.joinDate}>
                        Joined: {formatDate(item.createdAt)}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, `${item.firstName} ${item.lastName}`)}
            >
                <Ionicons name="trash-outline" size={isTablet ? 20 : 18} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    const getTabStats = () => {
        return {
            all: users.length,
            students: users.filter(user =>
                user.role?.toLowerCase().includes("student")
            ).length,
            faculty: users.filter(user =>
                user.role?.toLowerCase().includes("faculty") ||
                user.role?.toLowerCase().includes("professor")
            ).length,
            admins: users.filter(user =>
                user.role?.toLowerCase().includes("admin")
            ).length,
            pending: users.filter(user =>
                user.status?.toLowerCase() === "pending"
            ).length,
        };
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const tabStats = getTabStats();

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
                        {/* <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>User Management</Text>
                            <Text style={styles.headerSubtitle}>
                                Manage all system users efficiently
                            </Text>
                        </View> */}
                        <View style={styles.headerRight}>
                            <View style={styles.statsContainer}>
                                <Text style={styles.totalUsers}>{users.length} Total Users</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsContent}
                    >
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.tab,
                                    activeTab === tab.id && styles.activeTab
                                ]}
                                onPress={() => setActiveTab(tab.id)}
                            >
                                <Ionicons
                                    name={tab.icon}
                                    size={isTablet ? 18 : 16}
                                    color={activeTab === tab.id ? "#fff" : "#6b7280"}
                                />
                                <Text style={[
                                    styles.tabText,
                                    activeTab === tab.id && styles.activeTabText
                                ]}>
                                    {isSmallPhone ? tab.label.split(' ')[0] : tab.label}
                                </Text>
                                <View style={[
                                    styles.tabBadge,
                                    activeTab === tab.id && styles.activeTabBadge
                                ]}>
                                    <Text style={styles.tabBadgeText}>
                                        {tabStats[tab.id]}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.contentHeader}>
                        <Text style={styles.sectionTitle}>
                            {tabs.find(tab => tab.id === activeTab)?.label}
                        </Text>
                        <Text style={styles.resultCount}>
                            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                        </Text>
                    </View>

                    {filteredUsers.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons
                                name="people-outline"
                                size={isTablet ? 80 : 60}
                                color="#d1d5db"
                            />
                            <Text style={styles.emptyTitle}>No users found</Text>
                            <Text style={styles.emptyDescription}>
                                {activeTab === 'pending'
                                    ? 'No users pending approval at the moment'
                                    : `No ${activeTab} users found in the system`
                                }
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredUsers}
                            keyExtractor={(item) => item.id}
                            renderItem={renderUserItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContent}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
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
        justifyContent: "space-between",
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
    headerTitleContainer: {
        flex: 1,
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1f2937",
        marginBottom: 4,
        textAlign: "center",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },
    headerRight: {
        alignItems: 'flex-end',
        minWidth: 100,
    },
    statsContainer: {
        marginTop: 0,
    },
    totalUsers: {
        fontSize: isTablet ? 16 : 14,
        fontWeight: '600',
        color: "#1a73e8",
        backgroundColor: "#dbeafe",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    tabsWrapper: {
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    tabsContent: {
        paddingHorizontal: isTablet ? 24 : 16,
        paddingVertical: 12,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: isTablet ? 20 : 16,
        paddingVertical: isTablet ? 12 : 10,
        marginRight: 8,
        borderRadius: 12,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        minWidth: isTablet ? 100 : 80,
    },
    activeTab: {
        backgroundColor: "#1a73e8",
        borderColor: "#1a73e8",
    },
    tabText: {
        marginLeft: 6,
        marginRight: 6,
        fontSize: isTablet ? 15 : 13,
        fontWeight: "600",
        color: "#6b7280",
    },
    activeTabText: {
        color: "#fff",
    },
    tabBadge: {
        backgroundColor: "rgba(0,0,0,0.1)",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
    },
    activeTabBadge: {
        backgroundColor: "rgba(255,255,255,0.3)",
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: "bold",
        textAlign: "center",
        color: "#6b7280",
    },
    content: {
        flex: 1,
        padding: isTablet ? 24 : 16,
    },
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: isTablet ? 20 : 18,
        fontWeight: "bold",
        color: "#1f2937",
    },
    resultCount: {
        fontSize: isTablet ? 15 : 13,
        color: "#6b7280",
        fontWeight: '500',
    },
    listContent: {
        paddingBottom: 20,
    },
    separator: {
        height: 8,
    },
    userCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: isTablet ? 20 : 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: "#f3f4f6",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    userMainInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    userAvatar: {
        width: isTablet ? 48 : 40,
        height: isTablet ? 48 : 40,
        borderRadius: 20,
        backgroundColor: "#f8fafc",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: isTablet ? 18 : 16,
        fontWeight: "600",
        color: "#1f2937",
        marginBottom: 2,
    },
    userEmail: {
        fontSize: isTablet ? 15 : 13,
        color: "#6b7280",
        marginBottom: 8,
    },
    userMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleText: {
        fontSize: isTablet ? 13 : 11,
        fontWeight: "600",
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        fontSize: isTablet ? 13 : 11,
        fontWeight: "500",
    },
    extraInfo: {
        marginBottom: 6,
    },
    extraText: {
        fontSize: isTablet ? 13 : 12,
        color: "#6b7280",
        marginBottom: 2,
    },
    joinDate: {
        fontSize: isTablet ? 13 : 11,
        color: "#9ca3af",
        fontStyle: 'italic',
    },
    deleteButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#fef2f2",
        marginLeft: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: isTablet ? 80 : 60,
    },
    emptyTitle: {
        fontSize: isTablet ? 20 : 18,
        color: "#6b7280",
        marginTop: 16,
        fontWeight: '600',
    },
    emptyDescription: {
        fontSize: isTablet ? 16 : 14,
        color: "#9ca3af",
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
});

export default SuperAdminUsersScreen;