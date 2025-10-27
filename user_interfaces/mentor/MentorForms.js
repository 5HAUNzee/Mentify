// screens/MentorForms.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '@clerk/clerk-expo';

export default function MentorForms({ navigation }) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [selectedTab, setSelectedTab] = useState('pending'); // pending, approved, revision
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      console.log('Loading submissions for mentor:', userId);

      // Get all submissions assigned to this mentor
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('mentorId', '==', userId)
      );

      const snapshot = await getDocs(submissionsQuery);
      const allSubmissions = [];

      snapshot.forEach((doc) => {
        allSubmissions.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log('Total submissions found:', allSubmissions.length);
      setSubmissions(allSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
      Alert.alert('Error', 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubmissions();
  };

  const openSubmissionDetails = (submission) => {
    setSelectedSubmission(submission);
    setComments(submission.mentorComments || '');
    setModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;

    Alert.alert(
      'Approve Form',
      'Are you sure you want to approve this form?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setProcessing(true);
            try {
              const submissionRef = doc(db, 'submissions', selectedSubmission.id);
              await updateDoc(submissionRef, {
                status: 'approved',
                approvedAt: new Date().toISOString(),
                mentorComments: comments || 'Approved',
              });

              Alert.alert('Success', 'Form approved successfully!');
              setModalVisible(false);
              loadSubmissions();
            } catch (error) {
              console.error('Error approving:', error);
              Alert.alert('Error', 'Failed to approve form');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleSendBack = async () => {
    if (!selectedSubmission) return;

    if (!comments.trim()) {
      Alert.alert('Comments Required', 'Please provide feedback for revision');
      return;
    }

    Alert.alert(
      'Request Revision',
      'Send this form back for corrections?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Back',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const submissionRef = doc(db, 'submissions', selectedSubmission.id);
              await updateDoc(submissionRef, {
                status: 'needs_revision',
                mentorComments: comments,
                sentBackAt: new Date().toISOString(),
              });

              Alert.alert('Success', 'Form sent back for revision!');
              setModalVisible(false);
              loadSubmissions();
            } catch (error) {
              console.error('Error sending back:', error);
              Alert.alert('Error', 'Failed to send back form');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const filterSubmissions = () => {
    switch (selectedTab) {
      case 'pending':
        return submissions.filter((s) => s.status === 'pending');
      case 'approved':
        return submissions.filter((s) => s.status === 'approved');
      case 'revision':
        return submissions.filter((s) => s.status === 'needs_revision' || s.status === 'revision_required');
      default:
        return submissions;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'needs_revision':
      case 'revision_required':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'clock';
      case 'approved':
        return 'check-circle';
      case 'needs_revision':
      case 'revision_required':
        return 'alert-circle';
      default:
        return 'file';
    }
  };

  const renderSubmissionCard = (submission) => (
    <TouchableOpacity
      key={submission.id}
      style={styles.submissionCard}
      onPress={() => openSubmissionDetails(submission)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.studentInfo}>
          {submission.menteeProfilePic ? (
            <Image source={{ uri: submission.menteeProfilePic }} style={styles.studentPic} />
          ) : (
            <View style={styles.studentPicPlaceholder}>
              <Feather name="user" size={20} color="#9ca3af" />
            </View>
          )}
          <View style={styles.studentDetails}>
            <Text style={styles.studentName}>{submission.menteeName}</Text>
            <Text style={styles.formTitle}>{submission.formTitle}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(submission.status)}20` }]}>
          <Feather name={getStatusIcon(submission.status)} size={14} color={getStatusColor(submission.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(submission.status) }]}>
            {submission.status === 'needs_revision' ? 'Revision' : submission.status}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Feather name="calendar" size={14} color="#6b7280" />
          <Text style={styles.infoText}>
            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="book" size={14} color="#6b7280" />
          <Text style={styles.infoText}>Semester: {submission.semester}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.viewButtonText}>View Details</Text>
        <Feather name="chevron-right" size={16} color="#2563eb" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filteredSubmissions = filterSubmissions();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading submissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Form Submissions</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Feather name="refresh-cw" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
            Pending ({submissions.filter((s) => s.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'approved' && styles.tabActive]}
          onPress={() => setSelectedTab('approved')}
        >
          <Text style={[styles.tabText, selectedTab === 'approved' && styles.tabTextActive]}>
            Approved ({submissions.filter((s) => s.status === 'approved').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'revision' && styles.tabActive]}
          onPress={() => setSelectedTab('revision')}
        >
          <Text style={[styles.tabText, selectedTab === 'revision' && styles.tabTextActive]}>
            Revision ({submissions.filter((s) => s.status === 'needs_revision' || s.status === 'revision_required').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
      >
        {filteredSubmissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Submissions</Text>
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' ? 'No pending forms to review' :
               selectedTab === 'approved' ? 'No approved forms yet' :
               'No forms sent back for revision'}
            </Text>
          </View>
        ) : (
          filteredSubmissions.map(renderSubmissionCard)
        )}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedSubmission && (
            <>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Feather name="x" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Form Details</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalContent}>
                {/* Student Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Student Information</Text>
                  <View style={styles.studentInfoCard}>
                    {selectedSubmission.menteeProfilePic && (
                      <Image source={{ uri: selectedSubmission.menteeProfilePic }} style={styles.modalStudentPic} />
                    )}
                    <Text style={styles.modalStudentName}>{selectedSubmission.menteeName}</Text>
                    <Text style={styles.modalStudentEmail}>{selectedSubmission.menteeEmail}</Text>
                  </View>
                </View>

                {/* Form Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Form Information</Text>
                  <View style={styles.infoCard}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Form Title:</Text>
                      <Text style={styles.infoValue}>{selectedSubmission.formTitle}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Semester:</Text>
                      <Text style={styles.infoValue}>{selectedSubmission.semester}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Submitted:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(selectedSubmission.submittedAt).toLocaleDateString()} at{' '}
                        {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Form Fields */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Submitted Answers</Text>
                  {selectedSubmission.fields && Object.entries(selectedSubmission.fields).map(([key, value], index) => (
                    <View key={index} style={styles.fieldItem}>
                      <Text style={styles.fieldLabel}>{key}</Text>
                      <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
                    </View>
                  ))}
                </View>

                {/* Signatures */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Signatures</Text>
                  <View style={styles.signaturesContainer}>
                    <View style={styles.signatureItem}>
                      <Text style={styles.signatureLabel}>Student Signature</Text>
                      {selectedSubmission.menteeSignature && (
                        <Image source={{ uri: selectedSubmission.menteeSignature }} style={styles.signatureImage} />
                      )}
                    </View>
                    <View style={styles.signatureItem}>
                      <Text style={styles.signatureLabel}>Parent Signature</Text>
                      {selectedSubmission.parentSignature && (
                        <Image source={{ uri: selectedSubmission.parentSignature }} style={styles.signatureImage} />
                      )}
                    </View>
                  </View>
                </View>

                {/* Comments */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Mentor Feedback</Text>
                  <TextInput
                    style={styles.commentsInput}
                    value={comments}
                    onChangeText={setComments}
                    placeholder="Add your comments or feedback here..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                {selectedSubmission.status === 'pending' && (
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={handleApprove}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Feather name="check-circle" size={18} color="#fff" />
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.revisionButton}
                      onPress={handleSendBack}
                      disabled={processing}
                    >
                      {processing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Feather name="x-circle" size={18} color="#fff" />
                          <Text style={styles.revisionButtonText}>Send Back</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {selectedSubmission.status === 'approved' && (
                  <View style={styles.statusMessageContainer}>
                    <Feather name="check-circle" size={24} color="#10b981" />
                    <Text style={styles.statusMessage}>This form has been approved</Text>
                  </View>
                )}

                {(selectedSubmission.status === 'needs_revision' || selectedSubmission.status === 'revision_required') && (
                  <View style={styles.statusMessageContainer}>
                    <Feather name="alert-circle" size={24} color="#ef4444" />
                    <Text style={styles.statusMessage}>Sent back for revision</Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  submissionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  studentPic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  studentPicPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#6b7280',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  studentInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalStudentPic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#2563eb',
    marginBottom: 12,
  },
  modalStudentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  modalStudentEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  fieldItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  fieldValue: {
    fontSize: 14,
    color: '#111827',
  },
  signaturesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  signatureItem: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  signatureImage: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  commentsInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  revisionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  revisionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  statusMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    gap: 12,
    marginBottom: 24,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
});
