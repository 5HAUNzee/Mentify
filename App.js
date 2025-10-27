import React from "react";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ClerkProvider } from "@clerk/clerk-expo";

// Your screens
import Welcome from "./user_interfaces/onboarding/Welcome";
import On1 from "./user_interfaces/onboarding/On1";
import Auth from "./user_interfaces/Auth/Auth";
import ApprovalPendingScreen from "./user_interfaces/Auth/ApprovalPendingScreen";
import Registration from "./user_interfaces/Auth/Registration";
import Rejected from "./user_interfaces/Auth/Rejected";

// College Admin
import CollegeDashboard from "./user_interfaces/college_admin/CollegeDashboard";
import Users from "./user_interfaces/college_admin/Users";
import Forms from "./user_interfaces/college_admin/Forms";
import CollegeProfile from "./user_interfaces/college_admin/CollegeProfile";
import CreateForm from "./user_interfaces/college_admin/CreateForm";
import ViewForm from "./user_interfaces/college_admin/ViewForm";

// Dept Admin
import DeptDashboard from "./user_interfaces/dept_admin/DeptDashboard";
import Mentors from "./user_interfaces/dept_admin/Mentors";
import Announcements from "./user_interfaces/dept_admin/Announcements";
import Profile from "./user_interfaces/dept_admin/Profile";

// Mentor
import MentorDashboard from "./user_interfaces/mentor/MentorDashboard";
import MentorProfile from "./user_interfaces/mentor/MentorProfile";
import MyMentees from "./user_interfaces/mentor/MyMentees";
import MentorQueries from "./user_interfaces/mentor/MentorQueries";
import MentorProgress from "./user_interfaces/mentor/MentorProgress";
import MentorAnnouncements from "./user_interfaces/mentor/MentorAnnouncements";
import MentorForms from "./user_interfaces/mentor/MentorForms";

// Mentee
import MenteeDashboard from "./user_interfaces/mentee/MenteeDashboard";
import MenteeProfile from "./user_interfaces/mentee/MenteeProfile";
import MenteeChat from "./user_interfaces/mentee/MenteeChat";
import AttendanceTracker from "./user_interfaces/mentee/Attendance";
import MenteeForms from "./user_interfaces/mentee/MenteeForms";
import MenteeFormScreen from "./user_interfaces/mentee/MenteeFormScreen";
import Insights from "./user_interfaces/mentee/Insights";

// Super Admin
import SuperAdminDashboard from "./user_interfaces/super_admin/SuperAdminDashboard";
import AdminAnalytics from "./user_interfaces/super_admin/AdminAnalytics";
import CollegeManagement from "./user_interfaces/super_admin/CollegeManagement";
import UserManagement from "./user_interfaces/super_admin/UserManagement";
import ApprovalRequests from "./user_interfaces/super_admin/ApprovalRequests";

const Stack = createNativeStackNavigator();
const CLERK_PUBLISHABLE_KEY = "pk_test_ZGVmaW5pdGUtdG9hZC00MC5jbGVyay5hY2NvdW50cy5kZXYk";

if (!CLERK_PUBLISHABLE_KEY) throw new Error("Missing Publishable Key");

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={CLERK_PUBLISHABLE_KEY}
          tokenCache={tokenCache}
        >
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Welcome"
              screenOptions={{ headerShown: false }}
            >
              {/* Onboarding */}
              <Stack.Screen name="Welcome" component={Welcome} />
              <Stack.Screen name="On1" component={On1} />

              {/* Authentication */}
              <Stack.Screen name="Auth" component={Auth} />
              <Stack.Screen name="Registration" component={Registration} />
              <Stack.Screen name="ApprovalPendingScreen" component={ApprovalPendingScreen} />
              <Stack.Screen name="Rejected" component={Rejected} />

              {/* Dashboards */}
              <Stack.Screen name="CollegeDashboard" component={CollegeDashboard} />
              <Stack.Screen name="DeptDashboard" component={DeptDashboard} />
              <Stack.Screen name="MentorDashboard" component={MentorDashboard} />
              <Stack.Screen name="MenteeDashboard" component={MenteeDashboard} />
              <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />

              {/* Mentee Screens */}
              <Stack.Screen name="MenteeProfile" component={MenteeProfile} />
              <Stack.Screen name="MenteeChat" component={MenteeChat} />
              <Stack.Screen name="Attendance" component={AttendanceTracker} />
              <Stack.Screen name="MenteeForms" component={MenteeForms} />
              <Stack.Screen name="MenteeFormScreen" component={MenteeFormScreen} />
              <Stack.Screen name="Insights" component={Insights} />

              {/* Dept Admin Screens */}
              <Stack.Screen name="Mentors" component={Mentors} />
              <Stack.Screen name="Announcements" component={Announcements} />
              <Stack.Screen name="Profile" component={Profile} />

              {/* College Admin Screens */}
              <Stack.Screen name="Users" component={Users} />
              <Stack.Screen name="Forms" component={Forms} />
              <Stack.Screen name="CollegeProfile" component={CollegeProfile} />
              <Stack.Screen name="CreateForm" component={CreateForm} />
              <Stack.Screen name="ViewForm" component={ViewForm} />

              {/* Mentor Screens */}
              <Stack.Screen name="MentorProfile" component={MentorProfile} />
              <Stack.Screen name="MyMentees" component={MyMentees} />
              <Stack.Screen name="MentorQueries" component={MentorQueries} />
              <Stack.Screen name="MentorProgress" component={MentorProgress} />
              <Stack.Screen name="MentorAnnouncements" component={MentorAnnouncements} />
              <Stack.Screen name="MentorForms" component={MentorForms} />

              {/* Super Admin Screens */}
              <Stack.Screen name="AdminAnalytics" component={AdminAnalytics} />
              <Stack.Screen name="CollegeManagement" component={CollegeManagement} />
              <Stack.Screen name="UserManagement" component={UserManagement} />
              <Stack.Screen name="ApprovalRequests" component={ApprovalRequests} />
            </Stack.Navigator>
          </NavigationContainer>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}