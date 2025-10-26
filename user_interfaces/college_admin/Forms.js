import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase.config";
import { useAuth } from "@clerk/clerk-expo";

export default function FormManagement({ navigation }) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [formsInitialized, setFormsInitialized] = useState(false);
  const [stats, setStats] = useState({
    templates: 4,
    ready: 3,
    deployments: 3,
  });
  const [forms, setForms] = useState([]);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const formsSnap = await getDocs(
        query(collection(db, "forms"), orderBy("createdAt", "desc"))
      );
      const formsList = formsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForms(formsList);

      // Check if predefined forms exist
      const predefinedForms = formsList.filter((f) => f.isPredefined);
      setFormsInitialized(predefinedForms.length >= 8);

      // Calculate stats
      const ready = formsList.filter((f) => f.status === "ready").length;
      const deployed = formsList.filter((f) => f.status === "deployed").length;

      setStats({
        templates: formsList.length,
        ready: ready,
        deployments: deployed,
      });
    } catch (err) {
      console.error("Error fetching forms:", err);
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

  const initializeSemesterForms = async () => {
    Alert.alert(
      "Initialize Semester Forms",
      "This will create all 8 semester mentee forms (Sem 1-8) in the database. This action can only be done once. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Initialize",
          onPress: async () => {
            try {
              setInitializing(true);

              // Common fields for all semesters
              const commonFields = {
                administrative: [
                  {
                    type: "text",
                    title: "Academic Year",
                    placeholder: "2024-25",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Date",
                    placeholder: "DD/MM/YYYY",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Class",
                    placeholder: "Enter Class",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Batch",
                    placeholder: "B1/B2/B3",
                    required: false,
                  },
                  {
                    type: "text",
                    title: "Month and Year of Exam",
                    placeholder: "December 2024",
                    required: true,
                  },
                ],
                contactInfo: [
                  {
                    type: "text",
                    title: "Reg No",
                    placeholder: "Registration Number",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Roll No",
                    placeholder: "Roll Number",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Mentee's Name",
                    placeholder: "Full Name",
                    required: true,
                  },
                  {
                    type: "longtext",
                    title: "Address",
                    placeholder: "Complete Address",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Mentee's Phone No.",
                    placeholder: "10-digit number",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Father's Name",
                    placeholder: "Father's Full Name",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Mother's Name",
                    placeholder: "Mother's Full Name",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Guardian's Name",
                    placeholder: "If applicable",
                    required: false,
                  },
                  {
                    type: "text",
                    title: "Parent's/Guardian's Phone No. 1",
                    placeholder: "Contact number",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Parent's/Guardian's Phone No. 2",
                    placeholder: "Alternate number",
                    required: false,
                  },
                ],
                academicInterest: [
                  {
                    type: "text",
                    title: "Name of the Mentor",
                    placeholder: "Assigned Mentor",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Your GCET score or Diploma percentage",
                    placeholder: "Score/Percentage",
                    required: true,
                  },
                  {
                    type: "longtext",
                    title: "Why did you opt for Computer Engineering?",
                    placeholder: "Your answer",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Any other special interest?",
                    placeholder: "Music/Sports/Art/NCC/NSS",
                    required: false,
                  },
                ],
                selfAssessment: [
                  {
                    type: "dropdown",
                    title: "Need additional teaching assistance?",
                    options: "Yes, No",
                    required: true,
                  },
                  {
                    type: "longtext",
                    title: "Completed any online courses?",
                    placeholder: "NPTEL/COURSERA/KHAN",
                    required: false,
                  },
                  {
                    type: "longtext",
                    title: "Participated in technical competitions?",
                    placeholder: "Hackathons/Exhibitions",
                    required: false,
                  },
                  {
                    type: "dropdown",
                    title: "How often do you visit the library?",
                    options: "Daily, Weekly, Monthly, Rarely, Never",
                    required: true,
                  },
                  {
                    type: "dropdown",
                    title: "Avail book bank facility?",
                    options: "Yes, No",
                    required: true,
                  },
                  {
                    type: "longtext",
                    title: "Participate in any activities?",
                    placeholder: "Sports/Cultural/NSS",
                    required: false,
                  },
                  {
                    type: "text",
                    title: "Member of professional societies?",
                    placeholder: "CSI/IEEE/ACM",
                    required: false,
                  },
                  {
                    type: "dropdown",
                    title: "Day scholar or hostel?",
                    options: "Day Scholar, Hostel",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "If hostel (Hostel No and Room No)",
                    placeholder: "Details",
                    required: false,
                  },
                  {
                    type: "text",
                    title: "If Day scholar (mode of travel)",
                    placeholder: "Bus/Private",
                    required: false,
                  },
                  {
                    type: "dropdown",
                    title: "Need counseling?",
                    options: "Yes, No",
                    required: true,
                  },
                ],
                feedback: [
                  {
                    type: "longtext",
                    title: "Any additional information",
                    placeholder: "Comments",
                    required: false,
                  },
                  {
                    type: "longtext",
                    title: "Performance reflection and satisfaction",
                    placeholder: "Your thoughts",
                    required: true,
                  },
                  {
                    type: "longtext",
                    title: "Mentor's Remark",
                    placeholder: "Mentor feedback",
                    required: true,
                  },
                ],
                signatures: [
                  {
                    type: "text",
                    title: "Student's Signature",
                    placeholder: "Upload or draw signature",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Parent's Signature",
                    placeholder: "Upload or draw signature",
                    required: true,
                  },
                  {
                    type: "text",
                    title: "Mentor's Signature",
                    placeholder: "Upload or draw signature",
                    required: true,
                  },
                ],
              };

              const additionalQuestions = [
                {
                  type: "longtext",
                  title: "Any back papers from previous semesters?",
                  placeholder: "Mention subjects",
                  required: true,
                },
                {
                  type: "text",
                  title: "Aggregate percentage till now",
                  placeholder: "Percentage",
                  required: true,
                },
                {
                  type: "dropdown",
                  title: "Confident of completing B.E. in 4 years?",
                  options: "Yes, No",
                  required: true,
                },
                {
                  type: "text",
                  title: "Books read in last semester",
                  placeholder: "Number",
                  required: false,
                },
              ];

              // Semester-specific IT and Final Exam marks
              const semesterMarks = {
                1: {
                  subjects: ["FE 110", "FE 120", "FE 130", "FE 140"],
                  finalExam: [
                    { code: "FE 110", components: ["Th", "S"] },
                    { code: "FE 120", components: ["Th", "TW"] },
                    { code: "FE 130", components: ["Th", "S"] },
                    { code: "FE 140", components: ["Th", "S"] },
                    { code: "FE 150", components: ["TW"] },
                    { code: "FE 160", components: ["TW"] },
                    { code: "FE 170", components: ["TW"] },
                  ],
                },
                2: {
                  subjects: ["FE 210", "FE 220", "FE 230", "FE 240"],
                  finalExam: [
                    { code: "FE 210", components: ["Th", "S"] },
                    { code: "FE 220", components: ["Th", "TW"] },
                    { code: "FE 230", components: ["Th", "S"] },
                    { code: "FE 240", components: ["Th", "S"] },
                    { code: "FE 250", components: ["TW"] },
                    { code: "FE 260", components: ["TW"] },
                    { code: "FE 270", components: ["TW"] },
                    { code: "FE 280", components: ["TW"] },
                  ],
                },
                3: {
                  subjects: ["CE310", "CE320", "CE330", "CE340", "CE350"],
                  finalExam: [
                    { code: "CE310", components: ["Th", "IA"] },
                    { code: "CE320", components: ["Th", "IA"] },
                    { code: "CE330", components: ["Th", "IA"] },
                    { code: "CE340", components: ["Th", "IA"] },
                    { code: "CE350", components: ["Th", "IA"] },
                    { code: "CE360", components: ["TW", "P"] },
                    { code: "CE370", components: ["TW", "P"] },
                    { code: "HM001", components: ["TW"] },
                  ],
                },
                4: {
                  subjects: ["CE410", "CE420", "CE430", "CE440", "CE450"],
                  finalExam: [
                    { code: "CE410", components: ["Th", "IA", "TW"] },
                    { code: "CE420", components: ["Th", "IA"] },
                    { code: "CE430", components: ["Th", "IA"] },
                    { code: "CE440", components: ["Th", "IA"] },
                    { code: "CE450", components: ["Th", "IA", "TW"] },
                    { code: "CE460", components: ["TW", "P"] },
                    { code: "CE470", components: ["TW", "P"] },
                    { code: "HM100", components: ["TW"] },
                  ],
                },
                5: {
                  subjects: ["CE510", "CE520", "CE53", "CE54", "OE", "HM200"],
                  finalExam: [
                    { code: "CE510", components: ["Th", "IA"] },
                    { code: "CE520", components: ["Th", "IA"] },
                    { code: "CE53", components: ["Th", "IA"] },
                    { code: "CE54", components: ["Th", "IA"] },
                    { code: "CE550", components: ["TW", "P"] },
                    { code: "CE560", components: ["TW", "P"] },
                    { code: "OE", components: ["Th", "IA"] },
                    { code: "HM200", components: ["Th", "IA"] },
                  ],
                },
                6: {
                  subjects: ["CE610", "CE620", "CE63", "CE64", "OE", "HM300"],
                  finalExam: [
                    { code: "CE610", components: ["Th", "IA"] },
                    { code: "CE620", components: ["Th", "IA"] },
                    { code: "CE63", components: ["Th", "IA"] },
                    { code: "CE64", components: ["Th", "IA"] },
                    { code: "CE650", components: ["TW", "P"] },
                    { code: "CE660", components: ["TW", "P"] },
                    { code: "OE", components: ["Th", "IA"] },
                    { code: "HM300", components: ["Th", "IA"] },
                  ],
                },
                7: {
                  subjects: ["CE710", "CE72_", "OE"],
                  finalExam: [
                    { code: "CE710", components: ["Th", "IA", "TW"] },
                    { code: "CE72_", components: ["Th", "IA", "O"] },
                    { code: "CE730", components: ["O"] },
                    { code: "OE", components: ["Th", "IA"] },
                    { code: "CE740", components: ["TW", "O"] },
                    { code: "CE750", components: ["TW", "O"] },
                  ],
                },
                8: {
                  subjects: ["CE810", "CE82_"],
                  finalExam: [
                    { code: "CE810", components: ["Th", "IA"] },
                    { code: "CE82_", components: ["Th", "IA", "TW", "O"] },
                    { code: "CE830", components: ["O"] },
                    { code: "CE840", components: ["TW", "O"] },
                  ],
                },
              };

              // Function to generate IT marks fields
              const generateITMarks = (subjects, testNum) => {
                const fields = [];
                subjects.forEach((subject) => {
                  fields.push({
                    type: "text",
                    title: `${testNum} I.T - ${subject}`,
                    placeholder: "Marks out of 20",
                    required: true,
                  });
                });
                return fields;
              };

              // Function to generate Final Exam marks fields
              const generateFinalExamMarks = (examStructure) => {
                const fields = [];
                examStructure.forEach((subject) => {
                  subject.components.forEach((component) => {
                    fields.push({
                      type: "text",
                      title: `${subject.code} - ${component}`,
                      placeholder: `${component} marks`,
                      required: true,
                    });
                  });
                });
                return fields;
              };

              // Create all 8 semester forms
              const romanNumerals = [
                "I",
                "II",
                "III",
                "IV",
                "V",
                "VI",
                "VII",
                "VIII",
              ];

              for (let sem = 1; sem <= 8; sem++) {
                const marksData = semesterMarks[sem];

                const fields = [
                  ...commonFields.administrative,
                  ...(sem > 1 ? additionalQuestions : []),
                  ...commonFields.contactInfo,
                  ...commonFields.academicInterest,
                  ...commonFields.selfAssessment,
                  // Internal Test Marks
                  ...generateITMarks(marksData.subjects, "1st"),
                  ...generateITMarks(marksData.subjects, "2nd"),
                  ...generateITMarks(marksData.subjects, "3rd"),
                  // Final Semester Exam Marks
                  ...generateFinalExamMarks(marksData.finalExam),
                  ...commonFields.feedback,
                  ...commonFields.signatures,
                ];

                const formDoc = {
                  title: `Semester ${romanNumerals[sem - 1]} Mentee Form`,
                  description:
                    sem === 1
                      ? "Initial orientation and goal-setting form for first semester students"
                      : `Comprehensive review form for ${
                          romanNumerals[sem - 1]
                        } semester students`,
                  semester: `Sem ${sem}`,
                  semesterNumber: sem, // ADDED: Store semester as number too
                  isOtherForm: false,
                  semesters: [`Sem ${sem}`],
                  academicYear: "2024-25",
                  deadline: "",
                  fields: fields,
                  status: "ready",
                  createdAt: Timestamp.now(),
                  createdBy: "system",
                  deployments: 0,
                  deploymentHistory: [],
                  isPredefined: true,
                };

                await addDoc(collection(db, "forms"), formDoc);
              }

              Alert.alert(
                "Success",
                "All 8 semester forms have been created successfully!"
              );
              fetchForms();
            } catch (err) {
              console.error("Error initializing forms:", err);
              Alert.alert(
                "Error",
                "Failed to initialize forms: " + err.message
              );
            } finally {
              setInitializing(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "deployed":
        return { bg: "#d1fae5", text: "#065f46", label: "Deployed" };
      case "ready":
        return { bg: "#1f2937", text: "#fff", label: "Ready" };
      case "draft":
        return { bg: "#fef3c7", text: "#92400e", label: "Draft" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", label: status };
    }
  };

  const renderFormCard = (form) => {
    const badge = getStatusBadgeStyle(form.status);
    const deployments = form.deployments || 0;

    // CORRECTED handleSendForm function with semester number matching
    const handleSendForm = async () => {
      try {
        // Extract semester number from form.semester (e.g., "Sem 2" -> 2)
        const formSemesterNumber = form.semesterNumber || 
          parseInt(form.semester.replace("Sem ", ""));
        
        console.log("Looking for students in semester:", formSemesterNumber);
        
        // Get all mentees
        const menteesQuery = query(
          collection(db, "mentees")
        );

        const menteesSnapshot = await getDocs(menteesQuery);
        const menteesList = [];

        // Check each mentee's semester
        for (const menteeDoc of menteesSnapshot.docs) {
          const menteeData = menteeDoc.data();
          const menteeId = menteeDoc.id;
          
          // Get current semester (could be number or string)
          let currentSem = menteeData.currentSem;
          
          // Convert to number if it's a string
          if (typeof currentSem === 'string') {
            currentSem = parseInt(currentSem.replace("Sem ", "").replace("sem ", ""));
          }
          
          console.log(`Mentee ${menteeId} semester:`, currentSem, typeof currentSem);

          // Match semester numbers
          if (currentSem === formSemesterNumber) {
            // Get user data from users collection
            try {
              const userDoc = await getDoc(doc(db, "users", menteeId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                menteesList.push({
                  id: menteeId,
                  ...userData,
                  currentSemester: form.semester, // Use form's semester format
                });
              }
            } catch (err) {
              console.log("Error getting user data:", err);
            }
          }
        }

        console.log("Found students:", menteesList.length);

        if (menteesList.length === 0) {
          Alert.alert(
            "No Students", 
            `No students found in semester ${formSemesterNumber}. Make sure students have currentSem set to ${formSemesterNumber} in the mentees collection.`
          );
          return;
        }

        Alert.alert(
          "Send Form",
          `Send "${form.title}" to ${menteesList.length} student(s) in ${form.semester}?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Send",
              onPress: async () => {
                try {
                  // Update form status to deployed
                  await updateDoc(doc(db, "forms", form.id), {
                    status: "deployed",
                    deployments: (form.deployments || 0) + 1,
                    lastDeployedAt: Timestamp.now(),
                    deployedAt: Timestamp.now(),
                    deployedTo: menteesList.map((m) => m.id),
                    deploymentHistory: [
                      ...(form.deploymentHistory || []),
                      {
                        date: new Date().toISOString(),
                        students: menteesList.length,
                        semester: form.semester,
                        semesterNumber: formSemesterNumber,
                        deadline: form.deadline,
                        deployedBy: "Admin",
                        menteeIds: menteesList.map((m) => m.id),
                      },
                    ],
                  });

                  Alert.alert(
                    "Success",
                    `Form deployed to ${menteesList.length} student(s) in ${form.semester}. They can now access it.`
                  );
                  fetchForms();
                } catch (err) {
                  console.error("Error sending form:", err);
                  Alert.alert("Error", "Failed to send form: " + err.message);
                }
              },
            },
          ]
        );
      } catch (err) {
        console.error("Error fetching students:", err);
        Alert.alert("Error", "Failed to fetch students: " + err.message);
      }
    };

    return (
      <View key={form.id} style={styles.formCard}>
        <View style={styles.formHeader}>
          <View style={styles.formTitleRow}>
            <Text style={styles.formTitle}>{form.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusText, { color: badge.text }]}>
                {badge.label}
              </Text>
            </View>
          </View>
          {deployments > 0 && (
            <View style={styles.deploymentsBadge}>
              <Text style={styles.deploymentsText}>
                {deployments} deployment{deployments > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.formDescription} numberOfLines={2}>
          {form.description}
        </Text>

        <Text style={styles.formMeta}>{form.semester || "Sem 1"}</Text>

        {form.deadline && (
          <Text style={styles.formDeadline}>
            Deadline: {new Date(form.deadline).toLocaleDateString()}
          </Text>
        )}

        {form.status === "deployed" && form.lastDeployedAt && (
          <Text style={styles.formDeployed}>
            Deployed: {new Date(form.lastDeployedAt.toDate()).toLocaleDateString()}
          </Text>
        )}

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => navigation.navigate("ViewForm", { formId: form.id })}
          >
            <Feather name="eye" size={16} color="#374151" />
            <Text style={styles.viewBtnText}>
              {form.status === "ready" ? "View" : "View Template"}
            </Text>
          </TouchableOpacity>

          {form.status === "ready" && !form.isPredefined && (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                navigation.navigate("EditForm", { formId: form.id })
              }
            >
              <Feather name="edit-2" size={16} color="#374151" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}

          {form.status === "ready" && (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendForm}>
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          )}

          {form.status === "deployed" && (
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendForm}>
              <Feather name="send" size={16} color="#fff" />
              <Text style={styles.sendBtnText}>Send Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Form Management</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Form Management</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateForm")}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create Form</Text>
          </TouchableOpacity>
        </View>

        {/* Initialize Forms Button - Only show if not initialized */}
        {!formsInitialized && !loading && (
          <View style={styles.initializeCard}>
            <View style={styles.initializeHeader}>
              <Feather name="info" size={24} color="#2563eb" />
              <View style={styles.initializeInfo}>
                <Text style={styles.initializeTitle}>First Time Setup</Text>
                <Text style={styles.initializeDescription}>
                  Initialize all 8 semester mentee forms (Sem 1-8) with
                  predefined fields. This only needs to be done once.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.initializeBtn,
                initializing && styles.initializeBtnDisabled,
              ]}
              onPress={initializeSemesterForms}
              disabled={initializing}
            >
              {initializing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.initializeBtnText}>
                    Initializing Forms...
                  </Text>
                </>
              ) : (
                <>
                  <Feather name="download-cloud" size={18} color="#fff" />
                  <Text style={styles.initializeBtnText}>
                    Initialize Semester Forms
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.templates}</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.ready}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.deployments}</Text>
            <Text style={styles.statLabel}>Deployments</Text>
          </View>
        </View>

        {/* Recent Deployments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="send" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Recent Deployments</Text>
          </View>

          {forms
            .filter((f) => f.status === "deployed")
            .map((form) => renderFormCard(form))}
        </View>

        {/* Ready to Send Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="check-circle" size={18} color="#374151" />
            <Text style={styles.sectionTitle}>Ready to Send</Text>
          </View>

          {forms
            .filter((f) => f.status === "ready")
            .map((form) => renderFormCard(form))}
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

        <TouchableOpacity style={styles.navItem}>
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
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  createBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  initializeCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  initializeHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  initializeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  initializeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  initializeDescription: {
    fontSize: 13,
    color: "#3b82f6",
    lineHeight: 18,
  },
  initializeBtn: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  initializeBtnDisabled: {
    backgroundColor: "#93c5fd",
  },
  initializeBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#3b82f6",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#93c5fd",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  formHeader: {
    marginBottom: 8,
  },
  formTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  deploymentsBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  deploymentsText: {
    fontSize: 11,
    color: "#1e40af",
    fontWeight: "500",
  },
  formDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
    lineHeight: 18,
  },
  formMeta: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  formDeadline: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  formDeployed: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  formNotified: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  formActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 4,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  editBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    gap: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  sendBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
    gap: 4,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
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
