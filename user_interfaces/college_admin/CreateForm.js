import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  addDoc,
  updateDoc,
  doc,
  getDoc,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function CreateForm({ navigation, route }) {
  const { signOut, userId } = useAuth();
  const { formId } = route.params || {};
  const isEditing = !!formId;

  const [saving, setSaving] = useState(false);
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isOtherForm: false,
    semesters: [],
    academicYear: "2024-25",
    deadline: "",
    fields: [],
  });

  // Field modal data
  const [fieldData, setFieldData] = useState({
    type: "text",
    title: "",
    placeholder: "",
    required: false,
    options: "",
  });

  useEffect(() => {
    if (isEditing) {
      fetchFormData();
    }
  }, []);

  const fetchFormData = async () => {
    try {
      const formDoc = await getDoc(doc(db, "forms", formId));
      if (formDoc.exists()) {
        setFormData({ ...formDoc.data() });
      }
    } catch (err) {
      console.error("Error fetching form:", err);
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

  const toggleSemester = (sem) => {
    setFormData((prev) => ({
      ...prev,
      semesters: prev.semesters.includes(sem)
        ? prev.semesters.filter((s) => s !== sem)
        : [...prev.semesters, sem],
    }));
  };

  const openFieldModal = (index = null) => {
    if (index !== null) {
      setEditingFieldIndex(index);
      setFieldData(formData.fields[index]);
    } else {
      setEditingFieldIndex(null);
      setFieldData({
        type: "text",
        title: "",
        placeholder: "",
        required: false,
        options: "",
      });
    }
    setShowFieldModal(true);
  };

  const handleAddField = () => {
    if (!fieldData.title.trim()) {
      Alert.alert("Error", "Field title is required");
      return;
    }

    const newField = { ...fieldData };

    if (editingFieldIndex !== null) {
      const updatedFields = [...formData.fields];
      updatedFields[editingFieldIndex] = newField;
      setFormData((prev) => ({ ...prev, fields: updatedFields }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fields: [...prev.fields, newField],
      }));
    }

    setShowFieldModal(false);
    setFieldData({
      type: "text",
      title: "",
      placeholder: "",
      required: false,
      options: "",
    });
  };

  const handleDeleteField = (index) => {
    Alert.alert("Delete Field", "Are you sure you want to delete this field?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedFields = formData.fields.filter((_, i) => i !== index);
          setFormData((prev) => ({ ...prev, fields: updatedFields }));
        },
      },
    ]);
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Form title is required");
      return;
    }

    try {
      setSaving(true);
      const formPayload = {
        ...formData,
        status: "draft",
        createdAt: Timestamp.now(),
        createdBy: userId,
      };

      if (isEditing) {
        await updateDoc(doc(db, "forms", formId), formPayload);
        Alert.alert("Success", "Form draft saved");
      } else {
        await addDoc(collection(db, "forms"), formPayload);
        Alert.alert("Success", "Form draft created");
      }

      navigation.navigate("Forms");
    } catch (err) {
      console.error("Error saving draft:", err);
      Alert.alert("Error", "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsReady = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert("Error", "Title and description are required");
      return;
    }

    if (!formData.isOtherForm && formData.semesters.length === 0) {
      Alert.alert("Error", "Please select at least one semester");
      return;
    }

    if (formData.fields.length === 0) {
      Alert.alert("Error", "Please add at least one field");
      return;
    }

    try {
      setSaving(true);
      const formPayload = {
        ...formData,
        status: "ready",
        createdAt: Timestamp.now(),
        createdBy: userId,
      };

      if (isEditing) {
        await updateDoc(doc(db, "forms", formId), formPayload);
        Alert.alert("Success", "Form saved as ready");
      } else {
        await addDoc(collection(db, "forms"), formPayload);
        Alert.alert("Success", "Form created and ready to send");
      }

      navigation.navigate("Forms");
    } catch (err) {
      console.error("Error saving form:", err);
      Alert.alert("Error", "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const fieldTypes = [
    { value: "text", label: "Short Text" },
    { value: "longtext", label: "Long Text" },
    { value: "dropdown", label: "Dropdown" },
    { value: "checkboxes", label: "Checkboxes" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? "Edit Form" : "Form Management"}
        </Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Form Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Form Details</Text>
          <Text style={styles.sectionSubtitle}>
            Configure the basic information for your form
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Form Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Mid-Year Progress Review - Semester 3"
              placeholderTextColor="#9ca3af"
              value={formData.title}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, title: text }))
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Comprehensive review form for third semester students..."
              placeholderTextColor="#9ca3af"
              value={formData.description}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, description: text }))
              }
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Other Form (Not Semester-Specific)
            </Text>
            <Switch
              value={formData.isOtherForm}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, isOtherForm: value }))
              }
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={formData.isOtherForm ? "#2563eb" : "#f3f4f6"}
            />
          </View>

          {!formData.isOtherForm && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Target Semesters <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.semesterGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <TouchableOpacity
                    key={sem}
                    style={[
                      styles.semesterBtn,
                      formData.semesters.includes(`Sem ${sem}`) &&
                        styles.semesterBtnActive,
                    ]}
                    onPress={() => toggleSemester(`Sem ${sem}`)}
                  >
                    <Text
                      style={[
                        styles.semesterBtnText,
                        formData.semesters.includes(`Sem ${sem}`) &&
                          styles.semesterBtnTextActive,
                      ]}
                    >
                      Sem {sem}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Academic Year</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-25"
                placeholderTextColor="#9ca3af"
                value={formData.academicYear}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, academicYear: text }))
                }
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>
                Deadline <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="dd-mm-yyyy"
                placeholderTextColor="#9ca3af"
                value={formData.deadline}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, deadline: text }))
                }
              />
            </View>
          </View>
        </View>

        {/* Form Fields Section */}
        <View style={styles.section}>
          <View style={styles.fieldsSectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Form Fields</Text>
              <Text style={styles.sectionSubtitle}>
                Add and configure fields for your form
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewBtn}
              onPress={() =>
                navigation.navigate("ViewForm", {
                  formId: formId,
                  preview: true,
                })
              }
            >
              <Feather name="eye" size={16} color="#374151" />
              <Text style={styles.previewBtnText}>Preview</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.addFieldBtn}
            onPress={() => openFieldModal()}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addFieldBtnText}>Add Field</Text>
          </TouchableOpacity>

          {/* Fields List */}
          {formData.fields.map((field, index) => (
            <View key={index} style={styles.fieldItem}>
              <View style={styles.fieldItemHeader}>
                <View style={styles.dragHandle}>
                  <Feather name="menu" size={16} color="#9ca3af" />
                </View>
                <View style={styles.fieldItemContent}>
                  <View style={styles.fieldItemTitleRow}>
                    <Text style={styles.fieldItemType}>{field.type}</Text>
                    {field.required && (
                      <View style={styles.requiredBadge}>
                        <Text style={styles.requiredText}>Required</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.fieldItemTitle}>{field.title}</Text>
                  {field.placeholder && (
                    <Text style={styles.fieldItemPlaceholder}>
                      {field.placeholder}
                    </Text>
                  )}
                </View>
                <View style={styles.fieldItemActions}>
                  <TouchableOpacity
                    style={styles.fieldActionBtn}
                    onPress={() => openFieldModal(index)}
                  >
                    <Text style={styles.fieldActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fieldDeleteBtn}
                    onPress={() => handleDeleteField(index)}
                  >
                    <Feather name="x" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {formData.fields.length === 0 && (
            <View style={styles.emptyFields}>
              <Feather name="inbox" size={40} color="#d1d5db" />
              <Text style={styles.emptyFieldsText}>No fields added yet</Text>
              <Text style={styles.emptyFieldsSubtext}>
                Click "Add Field" to create your first field
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveDraftBtn}
            onPress={handleSaveDraft}
            disabled={saving}
          >
            <Feather name="save" size={16} color="#374151" />
            <Text style={styles.saveDraftBtnText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveReadyBtn}
            onPress={handleSaveAsReady}
            disabled={saving}
          >
            <Feather name="check-circle" size={16} color="#fff" />
            <Text style={styles.saveReadyBtnText}>Save as Ready</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add/Edit Field Modal */}
      <Modal
        visible={showFieldModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFieldModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingFieldIndex !== null ? "Edit Field" : "Add Field"}
              </Text>
              <TouchableOpacity onPress={() => setShowFieldModal(false)}>
                <Feather name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Field Type</Text>
                <View style={styles.fieldTypeGrid}>
                  {fieldTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.fieldTypeBtn,
                        fieldData.type === type.value &&
                          styles.fieldTypeBtnActive,
                      ]}
                      onPress={() =>
                        setFieldData((prev) => ({ ...prev, type: type.value }))
                      }
                    >
                      <Text
                        style={[
                          styles.fieldTypeBtnText,
                          fieldData.type === type.value &&
                            styles.fieldTypeBtnTextActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Field Title</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter field title"
                  placeholderTextColor="#9ca3af"
                  value={fieldData.title}
                  onChangeText={(text) =>
                    setFieldData((prev) => ({ ...prev, title: text }))
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Placeholder</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter placeholder text"
                  placeholderTextColor="#9ca3af"
                  value={fieldData.placeholder}
                  onChangeText={(text) =>
                    setFieldData((prev) => ({ ...prev, placeholder: text }))
                  }
                />
              </View>

              {(fieldData.type === "dropdown" ||
                fieldData.type === "checkboxes") && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Options (comma separated)
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Option 1, Option 2, Option 3"
                    placeholderTextColor="#9ca3af"
                    value={fieldData.options}
                    onChangeText={(text) =>
                      setFieldData((prev) => ({ ...prev, options: text }))
                    }
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Required Field</Text>
                <Switch
                  value={fieldData.required}
                  onValueChange={(value) =>
                    setFieldData((prev) => ({ ...prev, required: value }))
                  }
                  trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                  thumbColor={fieldData.required ? "#2563eb" : "#f3f4f6"}
                />
              </View>

              <TouchableOpacity
                style={styles.addFieldModalBtn}
                onPress={handleAddField}
              >
                <Text style={styles.addFieldModalBtnText}>
                  {editingFieldIndex !== null ? "Update Field" : "Add Field"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: "#374151",
  },
  semesterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  semesterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  semesterBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  semesterBtnText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  semesterBtnTextActive: {
    color: "#fff",
  },
  row: {
    flexDirection: "row",
  },
  fieldsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 4,
  },
  previewBtnText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  addFieldBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1f2937",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 16,
    gap: 6,
  },
  addFieldBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fieldItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  fieldItemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dragHandle: {
    marginRight: 12,
    paddingTop: 2,
  },
  fieldItemContent: {
    flex: 1,
  },
  fieldItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  fieldItemType: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "capitalize",
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
  fieldItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  fieldItemPlaceholder: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  fieldItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fieldActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fieldActionText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
  fieldDeleteBtn: {
    padding: 4,
  },
  emptyFields: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyFieldsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 12,
  },
  emptyFieldsSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  saveDraftBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 6,
  },
  saveDraftBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  saveReadyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    gap: 6,
  },
  saveReadyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  modalBody: {
    padding: 16,
  },
  fieldTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fieldTypeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  fieldTypeBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  fieldTypeBtnText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
  fieldTypeBtnTextActive: {
    color: "#fff",
  },
  addFieldModalBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addFieldModalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
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