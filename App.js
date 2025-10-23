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
import Auth from "./user_interfaces/Auth/Auth"; // Clerk login screen
import ApprovalPendingScreen from "./user_interfaces/Auth/ApprovalPendingScreen";
import Registration from "./user_interfaces/Auth/Registration";
import SuperDashboard from "./user_interfaces/super_admin/SuperDashboard";
import CollegeDashboard from "./user_interfaces/college_admin/CollegeDashboard";
import DeptDashboard from "./user_interfaces/dept_admin/DeptDashboard";
import MentorDashboard from "./user_interfaces/mentor/MentorDashboard";
import Rejected from "./user_interfaces/Auth/Rejected";
import Mentors from "./user_interfaces/dept_admin/Mentors";
import Announcements from "./user_interfaces/dept_admin/Announcements";
import Profile from "./user_interfaces/dept_admin/Profile";
import Users from "./user_interfaces/college_admin/Users";
import Forms from "./user_interfaces/college_admin/Forms";
import CollegeProfile from "./user_interfaces/college_admin/CollegeProfile";
import CreateForm from "./user_interfaces/college_admin/CreateForm";
import ViewForm from "./user_interfaces/college_admin/ViewForm";
import MentorProfile from "./user_interfaces/mentor/MentorProfile";
import MyMentees from "./user_interfaces/mentor/MyMentees";
import MenteeProfile from "./user_interfaces/mentee/MenteeProfile";
import MenteeDashboard from "./user_interfaces/mentee/MenteeDashboard";
import MenteeChat from "./user_interfaces/mentee/MenteeChat";
import AttendanceTracker from "./user_interfaces/mentee/Attendance";

const Stack = createNativeStackNavigator();
const CLERK_PUBLISHABLE_KEY =
  "pk_test_ZGVmaW5pdGUtdG9hZC00MC5jbGVyay5hY2NvdW50cy5kZXYk";
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
              {/* Onboarding screens */}
              <Stack.Screen name="Welcome" component={Welcome} />
              <Stack.Screen name="On1" component={On1} />

              {/* Authentication flow */}
              <Stack.Screen name="Auth" component={Auth} />
              <Stack.Screen name="Registration" component={Registration} />
              <Stack.Screen
                name="ApprovalPendingScreen"
                component={ApprovalPendingScreen}
              />
              <Stack.Screen name="Rejected" component={Rejected} />

              {/* Dashboards */}

              <Stack.Screen name="SuperDashboard" component={SuperDashboard} />
              <Stack.Screen
                name="CollegeDashboard"
                component={CollegeDashboard}
              />
              <Stack.Screen name="DeptDashboard" component={DeptDashboard} />
              <Stack.Screen
                name="MentorDashboard"
                component={MentorDashboard}
              />

              {/* Mentee screens  */}
              <Stack.Screen
                name="MenteeDashboard"
                component={MenteeDashboard}
              />
              <Stack.Screen name="MenteeProfile" component={MenteeProfile} />
              <Stack.Screen name="MenteeChat" component={MenteeChat} />
              <Stack.Screen name="Attendance" component={AttendanceTracker} />
              {/* Deptadmin screens */}
              <Stack.Screen name="Mentors" component={Mentors} />
              <Stack.Screen name="Announcements" component={Announcements} />
              <Stack.Screen name="Profile" component={Profile} />
              {/* Collegeadmin screens */}
              <Stack.Screen name="Users" component={Users} />
              <Stack.Screen name="Forms" component={Forms} />
              <Stack.Screen name="CollegeProfile" component={CollegeProfile} />
              <Stack.Screen name="CreateForm" component={CreateForm} />
              <Stack.Screen name="ViewForm" component={ViewForm} />
              {/* Mentor screens */}
              <Stack.Screen name="MentorProfile" component={MentorProfile} />
              <Stack.Screen name="MyMentees" component={MyMentees} />
            </Stack.Navigator>
          </NavigationContainer>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
