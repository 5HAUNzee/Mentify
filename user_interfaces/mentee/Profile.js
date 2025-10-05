import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from "@clerk/clerk-expo";

const Profile = ({ navigation }) => {
    const { signOut } = useAuth();
    const handleSignOut = async () => {
        try {
            await signOut();
            navigation.replace("Auth");
        } catch (err) {
            console.error("Sign out error:", err);
        }
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
                <TouchableOpacity
                    onPress={handleSignOut}
                    style={styles.logoutButton}
                >
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                {/* User Info Section with Profile Picture */}
                <View style={styles.userInfoContainer}>
                    <Image
                        source={{ uri: "https://i.pravatar.cc/150?img=12" }}
                        style={styles.profilePic}
                    />
                    <View style={styles.userInfoText}>
                        <Text style={styles.userName}>Shaun</Text>
                        <Text style={styles.userEmail}>shaun@student.gce.edu</Text>
                        <Text style={styles.userId}>Student ID: CS2024001</Text>
                    </View>
                </View>

                {/* Info Sections */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>College</Text>
                    <Text style={styles.infoValue}>Goa College of Engineering</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Department</Text>
                    <Text style={styles.infoValue}>Computer Engineering</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Current CGPA</Text>
                    <Text style={styles.infoValue}>3.8</Text>
                </View>

                <View style={styles.infoSection}>
                    <Text style={styles.infoLabel}>Academic Status</Text>
                    <Text style={[styles.infoValue, styles.goodStanding]}>Good Standing</Text>
                </View>

                {/* Additional spacing at the bottom */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#f8fafc" 
    },
    // Fixed Header
    header: {
        padding: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: { 
        fontSize: 18, 
        fontWeight: "600",
        color: '#000000'
    },
    logoutButton: {
        backgroundColor: "#2563EB",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    logoutButtonText: { 
        color: "white", 
        fontWeight: "600",
        fontSize: 14,
    },
    // Scrollable Content
    scrollView: {
        flex: 1,
    },
    // User Info with Profile Picture
    userInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        margin: 15,
        padding: 20,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    profilePic: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#e5e7eb'
    },
    userInfoText: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 4,
    },
    userId: {
        fontSize: 14,
        color: '#666666',
    },
    infoSection: {
        backgroundColor: 'white',
        marginHorizontal: 15,
        marginBottom: 8,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        color: '#000000',
        fontWeight: '400',
    },
    goodStanding: {
        color: '#10B981',
        fontWeight: '500',
    },
    bottomSpacing: {
        height: 20,
    },
});

export default Profile;