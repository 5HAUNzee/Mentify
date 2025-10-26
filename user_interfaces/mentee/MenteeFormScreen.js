// screens/MenteeFormScreen.js - COMPLETE WITH APPROVAL & REVISION HANDLING
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '@clerk/clerk-expo';

export default function MenteeFormScreen({ route, navigation }) {
  const { userId } = useAuth();
  const formId = route?.params?.formId;
  
  const [formData, setFormData] = useState(null);
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [existingSubmission, setExistingSubmission] = useState(null);
  
  const [menteeData, setMenteeData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    profilePic: null,
    studentSignature: null,
    parentSignature: null,
    assignedMentor: null,
  });

  useEffect(() => {
    if (!formId) {
      Alert.alert('Error', 'Form ID is missing', [
        { text: 'Go Back', onPress: () => navigation.goBack() }
      ]);
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading form:', formId);
      console.log('User ID:', userId);
      
      // CHECK IF FORM ALREADY SUBMITTED
      try {
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('formId', '==', formId),
          where('menteeId', '==', userId)
        );
        const submissionsSnapshot = await getDocs(submissionsQuery);
        
        if (!submissionsSnapshot.empty) {
          const existingSubmissionData = submissionsSnapshot.docs[0].data();
          const submissionId = submissionsSnapshot.docs[0].id;
          
          setExistingSubmission({
            ...existingSubmissionData,
            id: submissionId
          });
          
          console.log('⚠️ Form status:', existingSubmissionData.status);
          
          // If needs revision, populate fields with previous data
          if (existingSubmissionData.status === 'needs_revision' || existingSubmissionData.status === 'revision_required') {
            setFields(existingSubmissionData.fields || {});
          }
        }
      } catch (error) {
        console.error('Error checking existing submission:', error);
      }
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', userId));
      let assignedMentor = null;
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Get mentee data
        const menteeDoc = await getDoc(doc(db, 'mentees', userId));
        let menteeInfo = {};
        if (menteeDoc.exists()) {
          menteeInfo = menteeDoc.data();
        }
        
        // FETCH MENTOR FROM ASSIGNMENTS COLLECTION
        try {
          const assignmentsQuery = query(
            collection(db, 'assignments'),
            where('menteeId', '==', userId),
            where('status', '==', 'active')
          );
          const assignmentsSnapshot = await getDocs(assignmentsQuery);
          
          if (!assignmentsSnapshot.empty) {
            const assignmentData = assignmentsSnapshot.docs[0].data();
            assignedMentor = assignmentData.mentorId;
            console.log('✅ Found mentor from assignments:', assignedMentor);
          }
        } catch (error) {
          console.error('Error fetching assignment:', error);
        }
        
        setMenteeData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          profilePic: userData.profilePic || menteeInfo.profilePic || null,
          studentSignature: userData.studentSignature || menteeInfo.studentSignature || null,
          parentSignature: userData.parentSignature || menteeInfo.parentSignature || null,
          assignedMentor: assignedMentor,
        });
      }

      // Get form details
      const formDoc = await getDoc(doc(db, 'forms', formId));
      if (formDoc.exists()) {
        const data = formDoc.data();
        console.log('Form loaded:', data.title);
        setFormData(data);
        
        // Only initialize fields if not already populated from existing submission
        if (!existingSubmission || (existingSubmission.status !== 'needs_revision' && existingSubmission.status !== 'revision_required')) {
          const initialFields = {};
          if (data.fields && Array.isArray(data.fields)) {
            data.fields.forEach(field => {
              const title = field.title.toLowerCase();
              
              if (title.includes("student's signature") || 
                  title.includes("mentee's signature") ||
                  title.includes("parent's signature") ||
                  title.includes("mentor's signature") ||
                  title.includes("mentor's remark")) {
                return;
              }
              initialFields[field.title] = '';
            });
          }
          setFields(initialFields);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load form');
      setLoading(false);
    }
  };

  const autoFillTestData = () => {
    if (!formData?.fields) return;
    
    const testData = {};
    
    formData.fields.forEach(field => {
      const title = field.title.toLowerCase();
      
      if (title.includes("student's signature") || 
          title.includes("mentee's signature") ||
          title.includes("parent's signature") ||
          title.includes("mentor's signature") ||
          title.includes("mentor's remark")) {
        return;
      }
      
      if (field.type === 'dropdown' && field.options) {
        const options = field.options.split(',').map(o => o.trim());
        testData[field.title] = options[0];
      } else if (field.type === 'longtext') {
        testData[field.title] = 'This is a test answer for ' + field.title + '. Lorem ipsum dolor sit amet.';
      } else if (field.type === 'number' || title.includes('marks') || title.includes('score')) {
        testData[field.title] = '85';
      } else if (title.includes('phone') || title.includes('mobile')) {
        testData[field.title] = '9876543210';
      } else if (title.includes('email')) {
        testData[field.title] = 'test@example.com';
      } else if (title.includes('date')) {
        testData[field.title] = '26/10/2025';
      } else if (title.includes('percentage')) {
        testData[field.title] = '85%';
      } else if (title.includes('year') || title.includes('academic')) {
        testData[field.title] = '2024-25';
      } else if (title.includes('father')) {
        testData[field.title] = 'Father Name';
      } else if (title.includes('mother')) {
        testData[field.title] = 'Mother Name';
      } else if (title.includes('name')) {
        testData[field.title] = 'Test Name';
      } else if (title.includes('address')) {
        testData[field.title] = '123 Test Street, Test City - 400001';
      } else if (title.includes('roll')) {
        testData[field.title] = '23B-CO-057';
      } else {
        testData[field.title] = 'Test data';
      }
    });
    
    setFields(testData);
    Alert.alert('Auto-filled!', 'All fields filled with test data');
  };

  const updateField = useCallback((fieldTitle, value) => {
    setFields(prev => ({ ...prev, [fieldTitle]: value }));
  }, []);

  const toggleDropdown = useCallback((fieldTitle) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [fieldTitle]: !prev[fieldTitle]
    }));
  }, []);

  const validateForm = () => {
    if (formData?.fields) {
      for (let field of formData.fields) {
        const title = field.title.toLowerCase();
        
        if (title.includes("mentor's signature") || 
            title.includes("mentor's remark") ||
            title.includes("student's signature") ||
            title.includes("mentee's signature") ||
            title.includes("parent's signature")) {
          continue;
        }
        
        if (field.required && !fields[field.title]?.trim()) {
          Alert.alert('Required Field', `Please fill: ${field.title}`);
          return false;
        }
      }
    }

    if (!menteeData.profilePic) {
      Alert.alert('Missing Profile Picture', 'Please upload your profile picture first', [
        { text: 'OK' },
        { text: 'Go to Profile', onPress: () => navigation.navigate('MenteeProfile') }
      ]);
      return false;
    }
    if (!menteeData.studentSignature) {
      Alert.alert('Missing Signature', 'Please upload your signature in profile first', [
        { text: 'OK' },
        { text: 'Go to Profile', onPress: () => navigation.navigate('MenteeProfile') }
      ]);
      return false;
    }
    if (!menteeData.parentSignature) {
      Alert.alert('Missing Parent Signature', 'Please upload parent signature in profile first', [
        { text: 'OK' },
        { text: 'Go to Profile', onPress: () => navigation.navigate('MenteeProfile') }
      ]);
      return false;
    }
    if (!menteeData.assignedMentor) {
      Alert.alert('No Mentor Assigned', 'You need to have a mentor assigned. Contact admin.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const isResubmission = existingSubmission && (existingSubmission.status === 'needs_revision' || existingSubmission.status === 'revision_required');

    Alert.alert(
      isResubmission ? 'Resubmit Form' : 'Submit Form',
      isResubmission ? 'Are you sure you want to resubmit this form with corrections?' : 'Are you sure you want to submit this form to your mentor?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isResubmission ? 'Resubmit' : 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              if (isResubmission) {
                // Update existing submission
                const submissionRef = doc(db, 'submissions', existingSubmission.id);
                await updateDoc(submissionRef, {
                  fields: fields,
                  status: 'pending',
                  resubmittedAt: new Date().toISOString(),
                  mentorComments: '', // Clear previous comments
                });

                Alert.alert(
                  'Success!',
                  'Form resubmitted to your mentor successfully!',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                // Create new submission
                const submission = {
                  formId: formId,
                  formTitle: formData.title,
                  formDescription: formData.description,
                  semester: formData.semester,
                  menteeId: userId,
                  menteeName: `${menteeData.firstName} ${menteeData.lastName}`,
                  menteeEmail: menteeData.email,
                  menteeProfilePic: menteeData.profilePic,
                  menteeSignature: menteeData.studentSignature,
                  parentSignature: menteeData.parentSignature,
                  mentorId: menteeData.assignedMentor,
                  submittedAt: new Date().toISOString(),
                  status: 'pending',
                  fields: fields,
                  mentorComments: '',
                  mentorSignature: null,
                };

                console.log('Submitting:', submission);
                await addDoc(collection(db, 'submissions'), submission);

                Alert.alert(
                  'Success!',
                  'Form submitted to your mentor successfully!',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              }
            } catch (error) {
              console.error('Submit error:', error);
              Alert.alert('Error', 'Failed to submit form');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const renderField = (field, index) => {
    const title = field.title.toLowerCase();
    const isReadOnly = existingSubmission && 
                       existingSubmission.status !== 'needs_revision' && 
                       existingSubmission.status !== 'revision_required';
    
    if (title.includes("student's signature") || 
        title.includes("mentee's signature") ||
        title.includes("parent's signature") ||
        title.includes("mentor's signature") || 
        title.includes("mentor's remark")) {
      return null;
    }
    
    if (field.type === 'longtext') {
      return (
        <View key={index} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {field.title}
            {field.required && <Text style={styles.required}> *</Text>}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, isReadOnly && styles.inputDisabled]}
            value={fields[field.title] || ''}
            onChangeText={(text) => updateField(field.title, text)}
            placeholder={field.placeholder || `Enter ${field.title}`}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isReadOnly}
          />
        </View>
      );
    } else if (field.type === 'dropdown' && field.options) {
      const options = field.options.split(',').map(o => o.trim());
      const isOpen = openDropdowns[field.title] || false;
      
      return (
        <View key={index} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {field.title}
            {field.required && <Text style={styles.required}> *</Text>}
          </Text>
          
          <TouchableOpacity 
            style={[styles.dropdownButton, isReadOnly && styles.inputDisabled]}
            onPress={() => !isReadOnly && toggleDropdown(field.title)}
            disabled={isReadOnly}
          >
            <Text style={fields[field.title] ? styles.dropdownText : styles.dropdownPlaceholder}>
              {fields[field.title] || 'Select an option'}
            </Text>
            <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {isOpen && !isReadOnly && (
            <View style={styles.optionsContainer}>
              <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
                {options.map((option, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.optionItem}
                    onPress={() => {
                      updateField(field.title, option);
                      toggleDropdown(field.title);
                    }}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                    {fields[field.title] === option && (
                      <Feather name="check" size={16} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View key={index} style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {field.title}
            {field.required && <Text style={styles.required}> *</Text>}
          </Text>
          <TextInput
            style={[styles.input, isReadOnly && styles.inputDisabled]}
            value={fields[field.title] || ''}
            onChangeText={(text) => updateField(field.title, text)}
            placeholder={field.placeholder || `Enter ${field.title}`}
            placeholderTextColor="#9ca3af"
            keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            editable={!isReadOnly}
          />
        </View>
      );
    }
  };

  if (!formId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Form ID is missing</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading form...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isRevisionNeeded = existingSubmission && (existingSubmission.status === 'needs_revision' || existingSubmission.status === 'revision_required');
  const isApprovedOrPending = existingSubmission && (existingSubmission.status === 'approved' || existingSubmission.status === 'pending');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isRevisionNeeded ? 'Revise Form' : isApprovedOrPending ? 'View Submission' : 'Fill Form'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleCard}>
          <Feather name="file-text" size={24} color="#2563eb" />
          <View style={styles.titleInfo}>
            <Text style={styles.formTitle}>{formData?.title}</Text>
            <Text style={styles.formDesc}>{formData?.description}</Text>
            <Text style={styles.formSem}>{formData?.semester}</Text>
          </View>
        </View>

        {existingSubmission && !isRevisionNeeded && (
          <View style={[styles.submittedCard, existingSubmission.status === 'approved' && styles.approvedCard]}>
            <View style={styles.submittedHeader}>
              <Feather 
                name={existingSubmission.status === 'approved' ? "check-circle" : "clock"} 
                size={24} 
                color={existingSubmission.status === 'approved' ? "#10b981" : "#f59e0b"} 
              />
              <View style={styles.submittedInfo}>
                <Text style={styles.submittedTitle}>
                  {existingSubmission.status === 'approved' ? 'Form Approved ✅' : 'Form Submitted'}
                </Text>
                <Text style={styles.submittedStatus}>
                  Status: {existingSubmission.status === 'pending' ? 'Under Review by Mentor' : 
                           existingSubmission.status === 'approved' ? 'Approved by Mentor' :
                           existingSubmission.status}
                </Text>
                <Text style={styles.submittedDate}>
                  Submitted: {new Date(existingSubmission.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
            {existingSubmission.status === 'approved' ? (
              <Text style={styles.approvedNote}>
                This form has been approved by your mentor. Check the History section for approved forms.
              </Text>
            ) : (
              <Text style={styles.submittedNote}>
                Your form is being reviewed by your mentor. You cannot edit or resubmit this form.
              </Text>
            )}
          </View>
        )}

        {isRevisionNeeded && (
          <View style={styles.revisionCard}>
            <View style={styles.revisionHeader}>
              <Feather name="alert-circle" size={24} color="#f59e0b" />
              <View style={styles.revisionInfo}>
                <Text style={styles.revisionTitle}>Revision Required</Text>
                <Text style={styles.revisionSubtitle}>
                  Your mentor has requested changes
                </Text>
              </View>
            </View>
            
            {existingSubmission.mentorComments && (
              <View style={styles.mentorCommentsBox}>
                <Text style={styles.mentorCommentsLabel}>📝 Mentor's Feedback:</Text>
                <Text style={styles.mentorCommentsText}>{existingSubmission.mentorComments}</Text>
              </View>
            )}
            
            <Text style={styles.revisionNote}>
              Please review the feedback and update the form accordingly before resubmitting.
            </Text>
          </View>
        )}

        {!isRevisionNeeded && !existingSubmission && (
          <TouchableOpacity 
            style={styles.autoFillButton}
            onPress={autoFillTestData}
          >
            <Feather name="zap" size={16} color="#f59e0b" />
            <Text style={styles.autoFillButtonText}>⚡ Auto-Fill Test Data</Text>
          </TouchableOpacity>
        )}

        <View style={styles.profileCard}>
          <Text style={styles.sectionTitle}>Your Profile & Signatures</Text>
          
          <View style={styles.profileRow}>
            {menteeData.profilePic ? (
              <Image source={{ uri: menteeData.profilePic }} style={styles.profilePic} />
            ) : (
              <View style={styles.profilePicPlaceholder}>
                <Feather name="user" size={32} color="#9ca3af" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {menteeData.firstName} {menteeData.lastName}
              </Text>
              <Text style={styles.profileEmail}>{menteeData.email}</Text>
            </View>
          </View>

          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Your Signature</Text>
              {menteeData.studentSignature ? (
                <Image 
                  source={{ uri: menteeData.studentSignature }} 
                  style={styles.signatureImg}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Feather name="edit-3" size={20} color="#9ca3af" />
                  <Text style={styles.placeholderText}>Missing</Text>
                </View>
              )}
            </View>

            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Parent Signature</Text>
              {menteeData.parentSignature ? (
                <Image 
                  source={{ uri: menteeData.parentSignature }} 
                  style={styles.signatureImg}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.signaturePlaceholder}>
                  <Feather name="edit-3" size={20} color="#9ca3af" />
                  <Text style={styles.placeholderText}>Missing</Text>
                </View>
              )}
            </View>
          </View>

          {!existingSubmission && (!menteeData.profilePic || !menteeData.studentSignature || !menteeData.parentSignature) && (
            <TouchableOpacity
              style={styles.goToProfileBtn}
              onPress={() => navigation.navigate('MenteeProfile')}
            >
              <Feather name="alert-circle" size={16} color="#f59e0b" />
              <Text style={styles.goToProfileText}>Complete Profile First</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.fieldsCard}>
          <Text style={styles.sectionTitle}>Form Fields</Text>
          {!isRevisionNeeded && !existingSubmission && (
            <Text style={styles.fieldsNote}>
              Fill all required fields. Mentor fields will be completed by your mentor.
            </Text>
          )}
          {isRevisionNeeded && (
            <Text style={styles.revisionFieldsNote}>
              ⚠️ Review all fields and make necessary corrections based on mentor's feedback.
            </Text>
          )}
          {formData?.fields && formData.fields.map((field, index) => renderField(field, index))}
        </View>

        {!existingSubmission || isRevisionNeeded ? (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isRevisionNeeded ? 'Resubmit Form' : 'Submit to Mentor'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : existingSubmission.status === 'approved' ? (
          <TouchableOpacity
            style={styles.approvedButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="check-circle" size={18} color="#10b981" />
            <Text style={styles.approvedButtonText}>Form Approved - Go Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.alreadySubmittedBtn}>
            <Feather name="lock" size={18} color="#6b7280" />
            <Text style={styles.alreadySubmittedText}>Form Submitted - Under Review</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  backBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  titleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  titleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  formSem: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  submittedCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  approvedCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  submittedHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  submittedInfo: {
    marginLeft: 12,
    flex: 1,
  },
  submittedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  submittedStatus: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 2,
  },
  submittedDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  submittedNote: {
    fontSize: 13,
    color: '#92400e',
    fontStyle: 'italic',
  },
  approvedNote: {
    fontSize: 13,
    color: '#047857',
    fontStyle: 'italic',
  },
  revisionCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  revisionHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  revisionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  revisionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  revisionSubtitle: {
    fontSize: 14,
    color: '#92400e',
  },
  mentorCommentsBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  mentorCommentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  mentorCommentsText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  revisionNote: {
    fontSize: 13,
    color: '#92400e',
    fontStyle: 'italic',
  },
  autoFillButton: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  autoFillButtonText: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  profilePicPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  signaturesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  signatureBox: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 8,
  },
  signatureImg: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  signaturePlaceholder: {
    height: 80,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  goToProfileBtn: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  goToProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  fieldsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fieldsNote: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  revisionFieldsNote: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 16,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#9ca3af',
  },
  optionsContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    maxHeight: 200,
  },
  optionsScroll: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  approvedButton: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  approvedButtonText: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '600',
  },
  alreadySubmittedBtn: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  alreadySubmittedText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
