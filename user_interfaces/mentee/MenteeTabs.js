// user_interfaces/mentee/MenteeTabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import MenteeDashboard from "./MenteeDashboard";
import Insights from "./Insights";
import Profile from "./Profile";

const Tab = createBottomTabNavigator();

export default function MenteeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 60,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "home-outline";
          else if (route.name === "Insights") iconName = "bar-chart-outline";
          else if (route.name === "Profile") iconName = "person-outline";
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={MenteeDashboard} />
      <Tab.Screen name="Insights" component={Insights} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
