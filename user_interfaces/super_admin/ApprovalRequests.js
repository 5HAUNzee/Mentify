// screens/ApprovalRequests.js - CORRECTED FOR FIREBASE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth, useClerk } from '@clerk/clerk-expo';

export default function ApprovalRequests({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists() && userDoc.data().role === 'superadmin') {
        loadPendingRequests();
      } else {
        Alert.alert('Access Denied', 'Super admin access required');
        navigation.replace('Auth');
      }
    } catch (error) {
      console.error('Access error:', error);
      navigation.replace('Auth');
    }
  };

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      
      // Get users with status = "pending"
      const usersRef = collection(db, 'users');
      const pendingQuery = query(usersRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(pendingQuery);
      
      const pending = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPendingUsers(pending);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      Alert.alert('Error', 'Failed to load pending requests');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingRequests();
  };

  const handleApprove = async (requestUserId, userRole) => {
    Alert.alert(
      'Approve Request',
      'Are you sure you want to approve this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              setProcessing(prev => ({ ...prev, [requestUserId]: true }));

              // Update user status to approved
              const userRef = doc(db, 'users', requestUserId);
              await updateDoc(userRef, {
                status: 'approved',
                approvedAt: new Date(),
                approvedBy: userId,
              });

              Alert.alert('Success', 'User approved successfully!');
              loadPendingRequests();
            } catch (error) {
              console.error('Error approving user:', error);
              Alert.alert('Error', 'Failed to approve user');
            } finally {
              setProcessing(prev => ({ ...prev, [requestUserId]: false }));
            }
          },
        },
      ]
    );
  };

  const handleReject = async (requestUserId) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(prev => ({ ...prev, [requestUserId]: true }));

              // Update user status to rejected
              const userRef = doc(db, 'users', requestUserId);
              await updateDoc(userRef, {
                status: 'rejected',
                rejectedAt: new Date(),
                rejectedBy: userId,
              });

              Alert.alert('Success', 'User rejected');
              loadPendingRequests();
            } catch (error) {
              console.error('Error rejecting user:', error);
              Alert.alert('Error', 'Failed to reject user');
            } finally {
              setProcessing(prev => ({ ...prev, [requestUserId]: false }));
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              navigation.replace('Auth');
            } catch (error) {
              console.error('Sign-out error:', error);
            }
          },
        },
      ]
    );
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'collegeadmin':
        return { bg: '#fef3c7', text: '#f59e0b' };
      case 'deptadmin':
        return { bg: '#dbeafe', text: '#2563eb' };
      case 'mentor':
        return { bg: '#d1fae5', text: '#10b981' };
      case 'mentee':
        return { bg: '#e0e7ff', text: '#6366f1' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Approval Requests</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Count */}
      <View style={styles.countBadge}>
        <Feather name="clock" size={16} color="#92400e" />
        <Text style={styles.countText}>{pendingUsers.length} Pending Approvals</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="check-circle" size={48} color="#10b981" />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No pending approval requests</Text>
          </View>
        ) : (
          pendingUsers.map(user => {
            const colors = getRoleBadgeColor(user.role);
            const isProcessing = processing[user.id];

            return (
              <View key={user.id} style={styles.requestCard}>
                {/* Card Top Bar */}
                <View style={styles.cardTopBar} />

                <View style={styles.cardContent}>
                  {/* User Header */}
                  <View style={styles.requestHeader}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>
                        {user.firstName} {user.lastName}
                      </Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.requestDetails}>
                    <View style={[styles.roleBadge, { backgroundColor: colors.bg }]}>
                      <Feather name="briefcase" size={12} color={colors.text} />
                      <Text style={[styles.roleText, { color: colors.text }]}>
                        {user.role}
                      </Text>
                    </View>
                    
                    {user.college && (
                      <View style={styles.detailRow}>
                        <Feather name="home" size={14} color="#6b7280" />
                        <Text style={styles.detailText}>{user.college}</Text>
                      </View>
                    )}

                    {user.department && (
                      <View style={styles.detailRow}>
                        <Feather name="layers" size={14} color="#6b7280" />
                        <Text style={styles.detailText}>{user.department}</Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Feather name="calendar" size={14} color="#6b7280" />
                      <Text style={styles.detailText}>
                        {user.createdAt?.toDate 
                          ? user.createdAt.toDate().toLocaleDateString()
                          : new Date(user.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => handleReject(user.id)}
                      disabled={isProcessing}
                    >
                      <Feather name="x-circle" size={18} color="#ef4444" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approveButton, isProcessing && styles.buttonDisabled]}
                      onPress={() => handleApprove(user.id, user.role)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Feather name="check-circle" size={18} color="#fff" />
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SuperAdminDashboard')}>
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('UserManagement')}>
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('CollegeManagement')}>
          <Feather name="grid" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Colleges</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="file-text" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, { color: '#2563eb', fontWeight: '600' }]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AdminAnalytics')}>
          <Feather name="bar-chart-2" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Analytics</Text>
        </TouchableOpacity>
      </View>
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
  logoutBtn: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 8,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopBar: {
    height: 3,
    backgroundColor: '#f59e0b',
  },
  cardContent: {
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
  },
  requestDetails: {
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
});
