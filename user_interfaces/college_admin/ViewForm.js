import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function ViewForm({ navigation, route }) {
  const { signOut } = useAuth();
  const { formId } = route.params;
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const formDoc = await getDoc(doc(db, "forms", formId));
      if (formDoc.exists()) {
        setFormData({ id: formDoc.id, ...formDoc.data() });
      }
    } catch (err) {
      console.error("Error fetching form:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace("Auth");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const getFieldTypeBadge = (type) => {
    const badges = {
      text: { bg: "#dbeafe", text: "#1e40af", label: "text" },
      required: { bg: "#fee2e2", text: "#991b1b", label: "Required" },
      dropdown: { bg: "#e0e7ff", text: "#3730a3", label: "dropdown" },
      longtext: { bg: "#fef3c7", text: "#92400e", label: "long text" },
      checkboxes: { bg: "#ddd6fe", text: "#5b21b6", label: "checkboxes" },
    };
    return badges[type] || badges.text;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (!formData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>View Form</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <Text style={styles.logoutBtn}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Form not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>View Form</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Back to Forms Link */}
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.navigate("Forms")}
        >
          <Feather name="arrow-left" size={16} color="#2563eb" />
          <Text style={styles.backLinkText}>Back to Forms</Text>
        </TouchableOpacity>

        {/* Form Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.titleRow}>
            <Text style={styles.formTitle}>{formData.title}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {formData.status || "Ready"}
              </Text>
            </View>
          </View>
          {formData.deployments > 0 && (
            <View style={styles.deploymentsBadge}>
              <Text style={styles.deploymentsText}>
                {formData.deployments} deployments
              </Text>
            </View>
          )}
          <Text style={styles.formDescription}>{formData.description}</Text>
        </View>

        {/* Form Metadata */}
        <View style={styles.metadataCard}>
          <Text style={styles.metadataLabel}>{formData.semester}</Text>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataItem}>

            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataItem}>
              Created by: Collegeadmin
            </Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataItem}>
              Created: {new Date(formData.createdAt?.toDate()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Deployment History */}
        {formData.deploymentHistory && formData.deploymentHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deployment History</Text>
            {formData.deploymentHistory.map((deployment, index) => (
              <View key={index} style={styles.deploymentCard}>
                <View style={styles.deploymentHeader}>
                  <Text style={styles.deploymentDate}>
                    Deployed on {deployment.date}
                  </Text>
                  <View style={styles.studentsBadge}>
                    <Text style={styles.studentsBadgeText}>
                      {deployment.students} students
                    </Text>
                  </View>
                </View>
                <Text style={styles.deploymentDetail}>
                  Deadline: {deployment.deadline}
                </Text>
                <Text style={styles.deploymentDetail}>
                  Deployed by: {deployment.deployedBy}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Form Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Form Fields</Text>

          {formData.fields && formData.fields.length > 0 ? (
            formData.fields.map((field, index) => {
              const badge = getFieldTypeBadge(field.type);
              return (
                <View key={index} style={styles.fieldCard}>
                  <View style={styles.fieldHeader}>
                    <Text style={styles.fieldNumber}>{index + 1}.</Text>
                    <View style={styles.fieldInfo}>
                      <View style={styles.fieldTitleRow}>
                        <Text style={styles.fieldTitle}>{field.title}</Text>
                        {field.required && (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredText}>Required</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.fieldTypeBadge}>
                        <Text
                          style={[
                            styles.fieldTypeText,
                            { color: badge.text },
                          ]}
                        >
                          {badge.label}
                        </Text>
                      </View>
                      {field.placeholder && (
                        <Text style={styles.fieldPlaceholder}>
                          Placeholder: {field.placeholder}
                        </Text>
                      )}
                      {field.options && (
                        <Text style={styles.fieldOptions}>
                          Options: {field.options}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noFieldsText}>No fields added yet</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CollegeDashboard")}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Users")}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Forms")}
        >
          <Feather name="file-text" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("CollegeProfile")}
        >
          <Feather name="user" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  logoutBtn: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  backLinkText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
  },
  titleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  deploymentsBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  deploymentsText: {
    fontSize: 11,
    color: "#1e40af",
    fontWeight: "500",
  },
  formDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  metadataCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  metadataLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  metadataRow: {
    marginBottom: 6,
  },
  metadataItem: {
    fontSize: 13,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  deploymentCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  deploymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  deploymentDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  studentsBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  studentsBadgeText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  deploymentDetail: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  fieldCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fieldHeader: {
    flexDirection: "row",
  },
  fieldNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginRight: 8,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
    gap: 8,
  },
  fieldTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  requiredBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredText: {
    fontSize: 10,
    color: "#991b1b",
    fontWeight: "600",
  },
  fieldTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    marginBottom: 4,
  },
  fieldTypeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  fieldPlaceholder: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 4,
  },
  fieldOptions: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  noFieldsText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 20,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  navLabelActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
});