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
    Alert,
    Dimensions
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
    collection,
    getDocs,
    query,
    where,
    getCountFromServer,
    onSnapshot,
    doc,
    updateDoc,
    orderBy
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get('window');

const SuperColleges = () => {
    const navigation = useNavigation();
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // all, approved, pending, rejected
    const [stats, setStats] = useState({
        totalColleges: 0,
        approvedColleges: 0,
        pendingColleges: 0,
        rejectedColleges: 0
    });

    useEffect(() => {
        fetchColleges();

        // Real-time listener for college admins
        const collegeAdminsQuery = query(
            collection(db, "users"),
            where("role", "==", "collegeadmin")
        );

        const unsubscribe = onSnapshot(collegeAdminsQuery, (snapshot) => {
            const collegesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            // Remove duplicates and organize by college name
            const uniqueColleges = getUniqueColleges(collegesData);
            setColleges(uniqueColleges);
            calculateStats(uniqueColleges);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, []);

    // Get unique colleges based on college name
    const getUniqueColleges = (collegeAdmins) => {
        const collegeMap = new Map();

        collegeAdmins.forEach(admin => {
            const collegeName = admin.college;
            if (collegeName && !collegeMap.has(collegeName)) {
                collegeMap.set(collegeName, {
                    id: admin.id,
                    name: collegeName,
                    email: admin.email,
                    department: admin.department,
                    status: admin.status,
                    createdAt: admin.createdAt,
                    adminName: `${admin.firstName} ${admin.lastName}`,
                    adminEmail: admin.email,
                    // Collect all admins for this college
                    admins: collegeAdmins.filter(a => a.college === collegeName).map(a => ({
                        id: a.id,
                        name: `${a.firstName} ${a.lastName}`,
                        email: a.email,
                        department: a.department,
                        status: a.status
                    }))
                });
            }
        });

        return Array.from(collegeMap.values());
    };

    const fetchColleges = async () => {
        try {
            // Query users with collegeadmin role
            const collegeAdminsQuery = query(
                collection(db, "users"),
                where("role", "==", "collegeadmin")
            );

            const querySnapshot = await getDocs(collegeAdminsQuery);
            const collegeAdmins = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));

            const uniqueColleges = getUniqueColleges(collegeAdmins);
            setColleges(uniqueColleges);
            calculateStats(uniqueColleges);
        } catch (error) {
            console.error("Error fetching colleges:", error);
            Alert.alert("Error", "Failed to load colleges");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const calculateStats = (collegesData) => {
        const total = collegesData.length;
        const approved = collegesData.filter(college => college.status === "approved").length;
        const pending = collegesData.filter(college => college.status === "pending").length;
        const rejected = collegesData.filter(college => college.status === "rejected").length;

        setStats({
            totalColleges: total,
            approvedColleges: approved,
            pendingColleges: pending,
            rejectedColleges: rejected
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchColleges();
    };

    const handleStatusChange = async (collegeName, newStatus) => {
        try {
            // Find all college admins for this college
            const collegeAdminsQuery = query(
                collection(db, "users"),
                where("role", "==", "collegeadmin"),
                where("college", "==", collegeName)
            );

            const querySnapshot = await getDocs(collegeAdminsQuery);

            // Update status for all admins of this college
            const updatePromises = querySnapshot.docs.map(docSnapshot =>
                updateDoc(doc(db, "users", docSnapshot.id), {
                    status: newStatus,
                    updatedAt: new Date()
                })
            );

            await Promise.all(updatePromises);
            Alert.alert("Success", `College status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating college status:", error);
            Alert.alert("Error", "Failed to update college status");
        }
    };

    const filteredColleges = colleges.filter(college => {
        const matchesSearch = college.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            college.adminEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            college.department?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || college.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const CollegeCard = ({ college }) => {
        const getStatusColor = (status) => {
            switch (status) {
                case "approved": return "#34a853";
                case "pending": return "#fbbc04";
                case "rejected": return "#ea4335";
                default: return "#5f6368";
            }
        };

        const getStatusText = (status) => {
            switch (status) {
                case "approved": return "Approved";
                case "pending": return "Pending Review";
                case "rejected": return "Rejected";
                default: return "Unknown";
            }
        };

        const getAdminCount = async (collegeName) => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "collegeadmin"),
                    where("college", "==", collegeName)
                );
                const snapshot = await getCountFromServer(q);
                return snapshot.data().count;
            } catch (error) {
                console.error("Error counting admins:", error);
                return college.admins?.length || 0;
            }
        };

        const getStudentCount = async (collegeName) => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("college", "==", collegeName),
                    where("role", "==", "mentee")
                );
                const snapshot = await getCountFromServer(q);
                return snapshot.data().count;
            } catch (error) {
                console.error("Error counting students:", error);
                return 0;
            }
        };

        const [adminCount, setAdminCount] = useState(0);
        const [studentCount, setStudentCount] = useState(0);

        useEffect(() => {
            const fetchCounts = async () => {
                const admins = await getAdminCount(college.name);
                const students = await getStudentCount(college.name);
                setAdminCount(admins);
                setStudentCount(students);
            };
            fetchCounts();
        }, [college.name]);

        return (
            <TouchableOpacity
                style={styles.collegeCard}
                onPress={() => navigation.navigate("CollegeDetails", { college })}
            >
                <View style={styles.collegeHeader}>
                    <View style={styles.collegeInfo}>
                        <Text style={styles.collegeName}>{college.name}</Text>
                        <Text style={styles.collegeDepartment}>{college.department}</Text>
                        <Text style={styles.collegeEmail}>{college.adminEmail}</Text>
                        <Text style={styles.adminName}>Admin: {college.adminName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(college.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(college.status)}</Text>
                    </View>
                </View>

                <View style={styles.collegeStats}>
                    <View style={styles.stat}>
                        <Ionicons name="people-outline" size={16} color="#1a73e8" />
                        <Text style={styles.statNumber}>{adminCount}</Text>
                        <Text style={styles.statLabel}>Admins</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="school-outline" size={16} color="#34a853" />
                        <Text style={styles.statNumber}>{studentCount}</Text>
                        <Text style={styles.statLabel}>Students</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="calendar-outline" size={16} color="#673ab7" />
                        <Text style={styles.statNumber}>
                            {college.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </Text>
                        <Text style={styles.statLabel}>Joined</Text>
                    </View>
                </View>

                <View style={styles.collegeFooter}>
                    <View style={styles.footerLeft}>
                        <Text style={styles.createdDate}>
                            Registered: {college.createdAt.toLocaleDateString()}
                        </Text>
                        {college.admins && college.admins.length > 1 && (
                            <Text style={styles.adminsCount}>
                                {college.admins.length} admin(s) total
                            </Text>
                        )}
                    </View>

                    <View style={styles.actionButtons}>
                        {college.status === "pending" && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.approveButton]}
                                    onPress={() => handleStatusChange(college.name, "approved")}
                                >
                                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleStatusChange(college.name, "rejected")}
                                >
                                    <Ionicons name="close" size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </>
                        )}
                        <Ionicons name="chevron-forward" size={20} color="#5f6368" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const StatCard = ({ icon, value, label, color, onPress }) => (
        <TouchableOpacity style={styles.statCard} onPress={onPress}>
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
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>Loading Colleges...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={styles.container}>
                {/* Header */}


                {/* Quick Stats */}
                <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="business-outline"
                            value={stats.totalColleges}
                            label="Total"
                            color="#1a73e8"
                            onPress={() => setStatusFilter("all")}
                        />
                        <StatCard
                            icon="checkmark-circle-outline"
                            value={stats.approvedColleges}
                            label="Approved"
                            color="#34a853"
                            onPress={() => setStatusFilter("approved")}
                        />
                        <StatCard
                            icon="time-outline"
                            value={stats.pendingColleges}
                            label="Pending"
                            color="#fbbc04"
                            onPress={() => setStatusFilter("pending")}
                        />
                        <StatCard
                            icon="close-circle-outline"
                            value={stats.rejectedColleges}
                            label="Rejected"
                            color="#ea4335"
                            onPress={() => setStatusFilter("rejected")}
                        />
                    </View>
                </View>

                {/* Search and Filter */}
                <View style={styles.filterSection}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#5f6368" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search colleges by name, email, or department..."
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

                    <View style={styles.filterButtons}>
                        {["all", "approved", "pending", "rejected"].map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    styles.filterButton,
                                    statusFilter === filter && styles.filterButtonActive
                                ]}
                                onPress={() => setStatusFilter(filter)}
                            >
                                <Text style={[
                                    styles.filterButtonText,
                                    statusFilter === filter && styles.filterButtonTextActive
                                ]}>
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Colleges List */}
                <View style={styles.listSection}>
                    <View style={styles.listHeader}>
                        <Text style={styles.listTitle}>
                            {filteredColleges.length} College(s) Found
                        </Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Ionicons name="refresh" size={20} color="#1a73e8" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={filteredColleges}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <CollegeCard college={item} />}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="business-outline" size={64} color="#5f6368" />
                                <Text style={styles.emptyText}>No colleges found</Text>
                                <Text style={styles.emptySubtext}>
                                    {searchQuery || statusFilter !== "all"
                                        ? "Try adjusting your search or filter"
                                        : "No college admins have registered yet"
                                    }
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

// ... (Keep the same styles as previous code, just update the colors if needed)
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
    header: {
        paddingVertical: 30,
        paddingHorizontal: 24,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "rgba(255, 255, 255, 0.9)",
    },
    statsSection: {
        padding: 16,
        backgroundColor: "#ffffff",
        marginTop: -20,
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
    filterSection: {
        padding: 16,
        backgroundColor: "#ffffff",
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
        fontSize: 16,
        color: "#202124",
    },
    filterButtons: {
        flexDirection: "row",
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#f8f9fa",
        alignItems: "center",
    },
    filterButtonActive: {
        backgroundColor: "#1a73e8",
    },
    filterButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#5f6368",
    },
    filterButtonTextActive: {
        color: "#ffffff",
    },
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
    collegeCard: {
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
    collegeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    collegeInfo: {
        flex: 1,
    },
    collegeName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#202124",
        marginBottom: 4,
    },
    collegeDepartment: {
        fontSize: 14,
        color: "#1a73e8",
        fontWeight: "500",
        marginBottom: 2,
    },
    collegeEmail: {
        fontSize: 14,
        color: "#5f6368",
        marginBottom: 2,
    },
    adminName: {
        fontSize: 13,
        color: "#34a853",
        fontWeight: "500",
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#ffffff",
    },
    collegeStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
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
    collegeFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    footerLeft: {
        flex: 1,
    },
    createdDate: {
        fontSize: 12,
        color: "#5f6368",
        marginBottom: 2,
    },
    adminsCount: {
        fontSize: 12,
        color: "#1a73e8",
        fontWeight: "500",
    },
    actionButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    approveButton: {
        backgroundColor: "#34a853",
    },
    rejectButton: {
        backgroundColor: "#ea4335",
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

export default SuperColleges;