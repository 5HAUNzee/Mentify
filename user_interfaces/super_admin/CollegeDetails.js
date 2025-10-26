import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Dimensions
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
    collection,
    query,
    where,
    getDocs,
    getCountFromServer,
    onSnapshot
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

const CollegeDetails = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { college } = route.params;

    const [departments, setDepartments] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("departments");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchCollegeData();

        // Real-time listeners
        const collegeQuery = query(
            collection(db, "users"),
            where("college", "==", college.name)
        );

        const unsubscribe = onSnapshot(collegeQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            organizeCollegeData(usersData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [college.name]);

    const fetchCollegeData = async () => {
        try {
            const collegeQuery = query(
                collection(db, "users"),
                where("college", "==", college.name)
            );

            const querySnapshot = await getDocs(collegeQuery);
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            organizeCollegeData(usersData);
        } catch (error) {
            console.error("Error fetching college data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const organizeCollegeData = (usersData) => {
        // Get unique departments
        const departmentSet = new Set();
        const deptAdmins = [];
        const mentorsList = [];
        const menteesList = [];

        usersData.forEach(user => {
            if (user.department) {
                departmentSet.add(user.department);
            }

            switch (user.role) {
                case "deptadmin":
                    deptAdmins.push(user);
                    break;
                case "mentor":
                    mentorsList.push(user);
                    break;
                case "mentee":
                    menteesList.push(user);
                    break;
            }
        });

        // Create departments array with admin info
        const departmentsData = Array.from(departmentSet).map(deptName => {
            const deptAdmin = deptAdmins.find(admin => admin.department === deptName);
            const deptMentors = mentorsList.filter(mentor => mentor.department === deptName);
            const deptMentees = menteesList.filter(mentee => mentee.department === deptName);

            return {
                name: deptName,
                admin: deptAdmin,
                mentorCount: deptMentors.length,
                menteeCount: deptMentees.length,
                totalUsers: deptMentors.length + deptMentees.length
            };
        });

        setDepartments(departmentsData);
        setMentors(mentorsList);
        setMentees(menteesList);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCollegeData();
    };

    const getFilteredData = () => {
        const searchLower = searchQuery.toLowerCase();

        switch (activeTab) {
            case "departments":
                return departments.filter(dept =>
                    dept.name.toLowerCase().includes(searchLower) ||
                    dept.admin?.firstName?.toLowerCase().includes(searchLower) ||
                    dept.admin?.lastName?.toLowerCase().includes(searchLower)
                );
            case "mentors":
                return mentors.filter(mentor =>
                    mentor.firstName.toLowerCase().includes(searchLower) ||
                    mentor.lastName.toLowerCase().includes(searchLower) ||
                    mentor.department?.toLowerCase().includes(searchLower) ||
                    mentor.email.toLowerCase().includes(searchLower)
                );
            case "mentees":
                return mentees.filter(mentee =>
                    mentee.firstName.toLowerCase().includes(searchLower) ||
                    mentee.lastName.toLowerCase().includes(searchLower) ||
                    mentee.department?.toLowerCase().includes(searchLower) ||
                    mentee.email.toLowerCase().includes(searchLower)
                );
            default:
                return [];
        }
    };

    const DepartmentCard = ({ department }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("DepartmentDetails", {
                college: college.name,
                department: department.name
            })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{department.name}</Text>
                    {department.admin && (
                        <Text style={styles.cardSubtitle}>
                            Admin: {department.admin.firstName} {department.admin.lastName}
                        </Text>
                    )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#5f6368" />
            </View>

            <View style={styles.stats}>
                <View style={styles.stat}>
                    <Ionicons name="person-outline" size={16} color="#1a73e8" />
                    <Text style={styles.statNumber}>{department.mentorCount}</Text>
                    <Text style={styles.statLabel}>Mentors</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="school-outline" size={16} color="#34a853" />
                    <Text style={styles.statNumber}>{department.menteeCount}</Text>
                    <Text style={styles.statLabel}>Mentees</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="people-outline" size={16} color="#673ab7" />
                    <Text style={styles.statNumber}>{department.totalUsers}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const UserCard = ({ user, type }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>
                        {user.firstName} {user.lastName}
                    </Text>
                    <Text style={styles.cardSubtitle}>{user.email}</Text>
                    <Text style={styles.cardDepartment}>{user.department}</Text>
                </View>
                <View style={[
                    styles.roleBadge,
                    { backgroundColor: type === 'mentor' ? '#1a73e8' : '#34a853' }
                ]}>
                    <Text style={styles.roleText}>
                        {type === 'mentor' ? 'MENTOR' : 'STUDENT'}
                    </Text>
                </View>
            </View>

            <View style={styles.userFooter}>
                <Text style={styles.userStatus}>
                    Status: <Text style={styles.statusApproved}>Approved</Text>
                </Text>
                <Text style={styles.userDate}>
                    Joined: {user.createdAt.toLocaleDateString()}
                </Text>
            </View>
        </View>
    );

    const TabButton = ({ title, count, isActive, onPress }) => (
        <TouchableOpacity
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={onPress}
        >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {title}
            </Text>
            <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                <Text style={styles.tabCountText}>{count}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>Loading College Details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <LinearGradient
                colors={['#1a73e8', '#4285f4']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={styles.collegeInfo}>
                        <Text style={styles.collegeName}>{college.name}</Text>
                        <Text style={styles.collegeStats}>
                            {departments.length} Departments • {mentors.length} Mentors • {mentees.length} Students
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TabButton
                    title="Departments"
                    count={departments.length}
                    isActive={activeTab === "departments"}
                    onPress={() => setActiveTab("departments")}
                />
                <TabButton
                    title="Mentors"
                    count={mentors.length}
                    isActive={activeTab === "mentors"}
                    onPress={() => setActiveTab("mentors")}
                />
                <TabButton
                    title="Students"
                    count={mentees.length}
                    isActive={activeTab === "mentees"}
                    onPress={() => setActiveTab("mentees")}
                />
            </View>

            {/* Search */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#5f6368" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9aa0a6"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color="#5f6368" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Content */}
            <View style={styles.contentSection}>
                <FlatList
                    data={getFilteredData()}
                    keyExtractor={(item, index) =>
                        activeTab === "departments" ? item.name : item.id
                    }
                    renderItem={({ item }) =>
                        activeTab === "departments" ? (
                            <DepartmentCard department={item} />
                        ) : activeTab === "mentors" ? (
                            <UserCard user={item} type="mentor" />
                        ) : (
                            <UserCard user={item} type="mentee" />
                        )
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={
                                    activeTab === "departments" ? "library-outline" :
                                        activeTab === "mentors" ? "person-outline" : "school-outline"
                                }
                                size={64}
                                color="#5f6368"
                            />
                            <Text style={styles.emptyText}>
                                No {activeTab} found
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery ? "Try adjusting your search" : `No ${activeTab} registered for this college`}
                            </Text>
                        </View>
                    }
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
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
        color: "#5f6368",
    },
    header: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    collegeInfo: {
        flex: 1,
    },
    collegeName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 4,
    },
    collegeStats: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.9)",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e8eaed",
    },
    tabButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    tabButtonActive: {
        backgroundColor: "#1a73e8",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5f6368",
        marginRight: 6,
    },
    tabTextActive: {
        color: "#ffffff",
    },
    tabCount: {
        backgroundColor: "#f0f0f0",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    tabCountActive: {
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    tabCountText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5f6368",
    },
    searchSection: {
        padding: 16,
        backgroundColor: "#ffffff",
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        fontSize: 16,
        color: "#202124",
    },
    contentSection: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    listContainer: {
        padding: 16,
    },
    card: {
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
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#202124",
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: "#5f6368",
        marginBottom: 2,
    },
    cardDepartment: {
        fontSize: 14,
        color: "#1a73e8",
        fontWeight: "500",
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#ffffff",
    },
    stats: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    stat: {
        alignItems: "center",
        flex: 1,
    },
    statNumber: {
        fontSize: 16,
        fontWeight: "700",
        color: "#202124",
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 10,
        color: "#5f6368",
        fontWeight: "500",
        textTransform: "uppercase",
    },
    userFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f0f0f0",
    },
    userStatus: {
        fontSize: 12,
        color: "#5f6368",
    },
    statusApproved: {
        color: "#34a853",
        fontWeight: "600",
    },
    userDate: {
        fontSize: 12,
        color: "#5f6368",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#5f6368",
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#5f6368",
        textAlign: "center",
    },
});

export default CollegeDetails;