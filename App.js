import React from "react";
import "./global.css";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { tokenCache } from '@clerk/clerk-expo/token-cache'

import { ClerkProvider } from "@clerk/clerk-expo";

// Your screens
import Welcome from "./user_interfaces/onboarding/Welcome";
import On1 from "./user_interfaces/onboarding/On1";
import Auth from "./user_interfaces/Auth/Auth"; // Clerk login screen
import ApprovalPendingScreen from "./user_interfaces/Auth/ApprovalPendingScreen";
import Registration from "./user_interfaces/Auth/Registration";
import MenteeDashboard from "./user_interfaces/mentee/MenteeDashboard";
import SuperDashboard from "./user_interfaces/super_admin/SuperDashboard";
import CollegeDashboard from "./user_interfaces/college_admin/CollegeDashboard";
import DeptDashboard from "./user_interfaces/dept_admin/DeptDashboard";
import MentorDashboard from "./user_interfaces/mentor/MentorDashboard";
import Rejected from "./user_interfaces/Auth/Rejected";


const Stack = createNativeStackNavigator();
const CLERK_PUBLISHABLE_KEY = "pk_test_ZGVmaW5pdGUtdG9hZC00MC5jbGVyay5hY2NvdW50cy5kZXYk";
if(!CLERK_PUBLISHABLE_KEY) throw new Error("Missing Publishable Key");
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
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
              <Stack.Screen name="ApprovalPendingScreen" component={ApprovalPendingScreen} />
              <Stack.Screen name="Rejected" component={Rejected} />

              {/* Dashboards */}
              <Stack.Screen name="MenteeDashboard" component={MenteeDashboard} />
              <Stack.Screen name="SuperDashboard" component={SuperDashboard} />
              <Stack.Screen name="CollegeDashboard" component={CollegeDashboard} />
              <Stack.Screen name="DeptDashboard" component={DeptDashboard} />
              <Stack.Screen name="MentorDashboard" component={MentorDashboard} />
              
            </Stack.Navigator>
          </NavigationContainer>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
