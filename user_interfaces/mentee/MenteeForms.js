// screens/MenteeForms.js - IMPROVED BLUE THEME
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '@clerk/clerk-expo';

export default function MenteeForms({ navigation }) {
  const { userId, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      console.log('=== LOADING FORMS ===');
      console.log('My User ID:', userId);
      
      const snapshot = await getDocs(collection(db, 'forms'));
      console.log('Total forms in database:', snapshot.size);
      
      const myForms = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.status === 'deployed') {
          const menteeIds = data.menteeIds || [];
          const deployedTo = data.deployedTo || [];
          
          console.log('\nForm:', data.title);
          console.log('  Status:', data.status);
          console.log('  menteeIds:', menteeIds);
          console.log('  deployedTo:', deployedTo);
          
          const isInMenteeIds = menteeIds.includes(userId);
          const isInDeployedTo = deployedTo.includes(userId);
          
          console.log('  Am I in menteeIds?', isInMenteeIds);
          console.log('  Am I in deployedTo?', isInDeployedTo);
          
          if (isInMenteeIds || isInDeployedTo) {
            console.log('  ✅ THIS FORM IS FOR ME!');
            myForms.push({
              id: doc.id,
              title: data.title,
              description: data.description,
              semester: data.semester,
            });
          } else {
            console.log('  ❌ Not for me');
          }
        }
      });
      
      console.log('\n=== FINAL RESULT ===');
      console.log('Forms for me:', myForms.length);
      
      setForms(myForms);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('ERROR:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.replace('Auth');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadForms();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Same as MenteeDashboard */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Forms</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
        }
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Feather name="file-text" size={24} color="#3b82f6" />
            <View style={styles.statInfo}>
              <Text style={styles.statValue}>{forms.length}</Text>
              <Text style={styles.statLabel}>Available Forms</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={onRefresh}>
            <Feather name="refresh-cw" size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {forms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={48} color="#3b82f6" />
            </View>
            <Text style={styles.emptyTitle}>No Forms Available</Text>
            <Text style={styles.emptyText}>
              You don't have any assigned forms yet.{'\n'}
              Check back later or contact your mentor.
            </Text>
          </View>
        ) : (
          forms.map((form, index) => (
            <TouchableOpacity
              key={form.id}
              style={styles.formCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('MenteeFormScreen', { formId: form.id })}
            >
              {/* Card Top Bar */}
              <View style={styles.cardTopBar} />
              
              <View style={styles.cardContent}>
                <View style={styles.formHeader}>
                  <View style={styles.iconCircle}>
                    <Feather name="file-text" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.formInfo}>
                    <Text style={styles.formTitle}>{form.title}</Text>
                    <Text style={styles.formDescription} numberOfLines={2}>
                      {form.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={styles.semesterBadge}>
                    <Feather name="bookmark" size={10} color="#3b82f6" />
                    <Text style={styles.semesterText}>{form.semester}</Text>
                  </View>
                  
                  <View style={styles.fillButton}>
                    <Text style={styles.fillButtonText}>Fill Form</Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation - DON'T TOUCH */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MenteeDashboard')}
        >
          <Feather name="home" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Feather name="file-text" size={24} color="#2563eb" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Forms</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MenteeChat')}>
          <Feather name="message-circle" size={24} color="#9ca3af" />
          <Text style={styles.navLabel}>Doubts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('MenteeProfile')}
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
    backgroundColor: '#f8fafc',
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
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
   
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statInfo: {
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  refreshIconBtn: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTopBar: {
    height: 3,
    backgroundColor: '#3b82f6',
  },
  cardContent: {
    padding: 14,
  },
  formHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formInfo: {
    flex: 1,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  semesterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  semesterText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  fillButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    gap: 6,
  },
  fillButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    bottom: 0,
    left: 0,
    right: 0,
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
  navLabelActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
