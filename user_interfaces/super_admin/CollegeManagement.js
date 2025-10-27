// screens/CollegeManagement.js - INTEGRATED WITH FIREBASE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth, useClerk } from '@clerk/clerk-expo';

export default function CollegeManagement({ navigation }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [newCollege, setNewCollege] = useState({
    name: '',
    location: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAccessAndLoad();
  }, []);

  const checkAccessAndLoad = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists() && userDoc.data().role === 'superadmin') {
        loadColleges();
      } else {
        Alert.alert('Access Denied', 'Super admin access required');
        navigation.replace('Auth');
      }
    } catch (error) {
      console.error('Access error:', error);
      navigation.replace('Auth');
    }
  };

  const loadColleges = async () => {
    try {
      setLoading(true);

      // Get all users to calculate stats
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Group users by college
      const collegeMap = {};
      
      users.forEach(user => {
        if (user.college) {
          if (!collegeMap[user.college]) {
            collegeMap[user.college] = {
              name: user.college,
              departments: new Set(),
              students: 0,
              mentors: 0,
              admins: 0,
            };
          }
          
          if (user.department) {
            collegeMap[user.college].departments.add(user.department);
          }
          
          if (user.role === 'mentee') {
            collegeMap[user.college].students++;
          } else if (user.role === 'mentor') {
            collegeMap[user.college].mentors++;
          } else if (user.role === 'collegeadmin' || user.role === 'deptadmin') {
            collegeMap[user.college].admins++;
          }
        }
      });

      // Convert to array with location lookup
      const collegesArray = Object.values(collegeMap).map(college => ({
        name: college.name,
        location: getCollegeLocation(college.name),
        departments: college.departments.size,
        students: college.students,
        mentors: college.mentors,
        admins: college.admins,
        totalUsers: college.students + college.mentors + college.admins,
      }));

      setColleges(collegesArray);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading colleges:', error);
      Alert.alert('Error', 'Failed to load colleges');
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get location based on college name
  const getCollegeLocation = (collegeName) => {
    const locationMap = {
      'Goa College of Engineering': 'Farmagudi, Goa',
      'Agnel Institute of Technology and Design': 'Verna, Goa',
    };
    return locationMap[collegeName] || 'Goa, India';
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadColleges();
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading colleges...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>College Management</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{colleges.length}</Text>
          <Text style={styles.summaryLabel}>Total Colleges</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {colleges.reduce((sum, c) => sum + c.totalUsers, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Users</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {colleges.reduce((sum, c) => sum + c.departments, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Departments</Text>
        </View>
      </View>

      {/* Colleges List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {colleges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No colleges found</Text>
            <Text style={styles.emptySubtext}>Users need to register first</Text>
          </View>
        ) : (
          colleges.map((college, index) => (
            <View key={index} style={styles.collegeCard}>
              <View style={styles.collegeHeader}>
                <View style={styles.collegeIconCircle}>
                  <Feather name="home" size={20} color="#2563eb" />
                </View>
                <View style={styles.collegeInfo}>
                  <Text style={styles.collegeName}>{college.name}</Text>
                  <Text style={styles.collegeLocation}>{college.location}</Text>
                </View>
              </View>

              <View style={styles.collegeStats}>
                <View style={styles.statRow}>
                  <View style={styles.statItem}>
                    <Feather name="users" size={16} color="#6b7280" />
                    <Text style={styles.statValue}>{college.students}</Text>
                    <Text style={styles.statLabel}>Students</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Feather name="award" size={16} color="#6b7280" />
                    <Text style={styles.statValue}>{college.mentors}</Text>
                    <Text style={styles.statLabel}>Mentors</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Feather name="layers" size={16} color="#6b7280" />
                    <Text style={styles.statValue}>{college.departments}</Text>
                    <Text style={styles.statLabel}>Depts</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Feather name="shield" size={16} color="#6b7280" />
                    <Text style={styles.statValue}>{college.admins}</Text>
                    <Text style={styles.statLabel}>Admins</Text>
                  </View>
                </View>
              </View>

              <View style={styles.totalUsersRow}>
                <Text style={styles.totalUsersLabel}>Total Users</Text>
                <Text style={styles.totalUsersValue}>{college.totalUsers}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('SuperAdminDashboard')}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('UserManagement')}
        >
          <Feather name="users" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="grid" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, { color: '#2563eb', fontWeight: '600' }]}>
            Colleges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('ApprovalRequests')}
        >
          <Feather name="file-text" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => navigation.navigate('AdminAnalytics')}
        >
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  collegeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  collegeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  collegeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  collegeInfo: {
    flex: 1,
  },
  collegeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  collegeLocation: {
    fontSize: 13,
    color: '#6b7280',
  },
  collegeStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  totalUsersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalUsersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  totalUsersValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
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
