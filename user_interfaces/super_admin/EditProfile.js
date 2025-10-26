import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const EditProfile = () => {
    const { user } = useUser();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        college: "",
        department: ""
    });
    const [originalData, setOriginalData] = useState({});

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        if (!user?.id) return;

        try {
            const userRef = doc(db, "users", user.id);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setFormData({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    phone: data.phone || "",
                    college: data.college || "",
                    department: data.department || ""
                });
                setOriginalData(data);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id) return;

        // Validation
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            Alert.alert("Validation Error", "First name and last name are required");
            return;
        }

        setSaving(true);
        try {
            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, {
                ...formData,
                updatedAt: new Date()
            });

            // Also update Clerk user if needed
            if (user) {
                await user.update({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                });
            }

            Alert.alert("Success", "Profile updated successfully!");
            navigation.goBack();
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Check if there are unsaved changes
        const hasChanges =
            formData.firstName !== originalData.firstName ||
            formData.lastName !== originalData.lastName ||
            formData.phone !== originalData.phone ||
            formData.college !== originalData.college ||
            formData.department !== originalData.department;

        if (hasChanges) {
            Alert.alert(
                "Unsaved Changes",
                "You have unsaved changes. Are you sure you want to discard them?",
                [
                    { text: "Keep Editing", style: "cancel" },
                    { text: "Discard", style: "destructive", onPress: () => navigation.goBack() }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    const InputField = ({ icon, label, value, onChangeText, placeholder, keyboardType = "default", editable = true }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <View style={[styles.inputWrapper, !editable && styles.inputDisabled]}>
                <Ionicons name={icon} size={20} color="#5f6368" style={styles.inputIcon} />
                <TextInput
                    style={styles.textInput}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    keyboardType={keyboardType}
                    editable={editable}
                    placeholderTextColor="#9aa0a6"
                />
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.loadingText}>Loading Profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
                    <Ionicons name="arrow-back" size={24} color="#1a73e8" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#1a73e8" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Personal Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <InputField
                        icon="person-outline"
                        label="First Name"
                        value={formData.firstName}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                        placeholder="Enter your first name"
                    />

                    <InputField
                        icon="person-outline"
                        label="Last Name"
                        value={formData.lastName}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                        placeholder="Enter your last name"
                    />

                    <InputField
                        icon="call-outline"
                        label="Phone Number"
                        value={formData.phone}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Institutional Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Institutional Information</Text>

                    <InputField
                        icon="business-outline"
                        label="College"
                        value={formData.college}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, college: text }))}
                        placeholder="Enter your college"
                    />

                    <InputField
                        icon="library-outline"
                        label="Department"
                        value={formData.department}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
                        placeholder="Enter your department"
                    />
                </View>

                {/* Read-only Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account Information</Text>

                    <InputField
                        icon="mail-outline"
                        label="Email Address"
                        value={user?.primaryEmailAddress?.emailAddress || ""}
                        editable={false}
                        placeholder="Email address"
                    />

                    <InputField
                        icon="key-outline"
                        label="User Role"
                        value={originalData.role ? originalData.role.replace('_', ' ').toUpperCase() : ""}
                        editable={false}
                        placeholder="User role"
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity
                        style={[styles.primaryButton, saving && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#ffffff" />
                                <Text style={styles.primaryButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleCancel}
                        disabled={saving}
                    >
                        <Ionicons name="close-outline" size={20} color="#1a73e8" />
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
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
        fontWeight: "500",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e8eaed",
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#202124",
    },
    saveButton: {
        padding: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1a73e8",
    },
    section: {
        backgroundColor: "#ffffff",
        marginTop: 16,
        padding: 20,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#202124",
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#5f6368",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e8eaed",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inputDisabled: {
        backgroundColor: "#f0f0f0",
        opacity: 0.7,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: "#202124",
        padding: 0,
    },
    actionsSection: {
        padding: 24,
        gap: 12,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: "#c6dafc",
        shadowOpacity: 0,
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
});

export default EditProfile;