// screens/MenteeForms.js - COMPLETE WORKING VERSION
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.config';
import { useAuth } from '@clerk/clerk-expo';

export default function MenteeForms({ navigation }) {
  const { userId } = useAuth();
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
      
      // Get ALL forms from database
      const snapshot = await getDocs(collection(db, 'forms'));
      console.log('Total forms in database:', snapshot.size);
      
      const myForms = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only check deployed forms
        if (data.status === 'deployed') {
          // Check BOTH menteeIds and deployedTo arrays
          const menteeIds = data.menteeIds || [];
          const deployedTo = data.deployedTo || [];
          
          console.log('\nForm:', data.title);
          console.log('  Status:', data.status);
          console.log('  menteeIds:', menteeIds);
          console.log('  deployedTo:', deployedTo);
          
          // Check if my ID is in either array
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

  const onRefresh = () => {
    setRefreshing(true);
    loadForms();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading forms...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Forms</Text>
          <Text style={styles.headerSubtitle}>
            {forms.length} {forms.length === 1 ? 'form' : 'forms'} available
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
        }
      >
        {forms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Forms Available</Text>
            <Text style={styles.emptyText}>
              Check the console logs to see what's happening
            </Text>
          </View>
        ) : (
          forms.map((form) => (
            <TouchableOpacity
              key={form.id}
              style={styles.formCard}
              onPress={() => navigation.navigate('MenteeFormScreen', { formId: form.id })}
            >
              <View style={styles.formHeader}>
                <View style={styles.iconCircle}>
                  <Feather name="file-text" size={24} color="#2563eb" />
                </View>
                <View style={styles.formInfo}>
                  <Text style={styles.formTitle}>{form.title}</Text>
                  <Text style={styles.formDescription}>{form.description}</Text>
                  <View style={styles.semesterBadge}>
                    <Text style={styles.semesterText}>{form.semester}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.fillButton}>
                <Feather name="edit-3" size={16} color="#fff" />
                <Text style={styles.fillButtonText}>Fill Form</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
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

        <TouchableOpacity style={styles.navItem}>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formInfo: {
    flex: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  semesterBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  semesterText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },
  fillButton: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fillButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute',
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
