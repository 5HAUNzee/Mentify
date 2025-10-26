import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Dimensions,
    SafeAreaView,
    StatusBar
} from "react-native";

// All Super Admin Screens
import SuperDashboard from "./SuperDashboard";
import SuperColleges from "./SuperColleges";
import SuperProfile from "./SuperProfile";
import SuperUsers from "./SuperUsers";
import SuperAnalytics from "./SuperAnalytics";

const Tab = createBottomTabNavigator(); // This line was missing!
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

const SuperAdminTabs = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#1a73e8" barStyle="light-content" />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        switch (route.name) {
                            case "Dashboard":
                                iconName = focused ? "grid" : "grid-outline";
                                break;
                            case "Colleges":
                                iconName = focused ? "business" : "business-outline";
                                break;
                            case "Users":
                                iconName = focused ? "people" : "people-outline";
                                break;
                            case "Analytics":
                                iconName = focused ? "bar-chart" : "bar-chart-outline";
                                break;
                            case "Profile":
                                iconName = focused ? "person" : "person-outline";
                                break;
                            default:
                                iconName = "ellipse-outline";
                        }

                        return (
                            <View style={[
                                styles.iconContainer,
                                focused && styles.iconContainerFocused
                            ]}>
                                <Ionicons
                                    name={iconName}
                                    size={isTablet ? (focused ? 26 : 24) : (focused ? 24 : 22)}
                                    color={focused ? "#1a73e8" : "#5f6368"}
                                />
                            </View>
                        );
                    },
                    tabBarLabel: ({ focused }) => {
                        let labelText;
                        switch (route.name) {
                            case "Dashboard":
                                labelText = "Dashboard";
                                break;
                            case "Colleges":
                                labelText = "Colleges";
                                break;
                            case "Users":
                                labelText = "Users";
                                break;
                            case "Analytics":
                                labelText = "Analytics";
                                break;
                            case "Profile":
                                labelText = "Profile";
                                break;
                            default:
                                labelText = route.name;
                        }

                        return (
                            <Text style={[
                                styles.tabLabel,
                                focused ? styles.tabLabelFocused : styles.tabLabelInactive,
                                isTablet && styles.tabLabelTablet
                            ]}>
                                {labelText}
                            </Text>
                        );
                    },
                    tabBarActiveTintColor: "#1a73e8",
                    tabBarInactiveTintColor: "#5f6368",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: "#1a73e8",
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 0,
                    },
                    headerTintColor: "#ffffff",
                    headerTitleStyle: {
                        fontWeight: "600",
                        fontSize: 18,
                    },
                    tabBarStyle: {
                        backgroundColor: "#ffffff",
                        borderTopWidth: 0,
                        height: isTablet ? 80 : (Platform.OS === 'ios' ? 85 : 70),
                        paddingBottom: Platform.select({
                            ios: 20,
                            android: 8,
                            default: 8,
                        }),
                        paddingTop: isTablet ? 12 : 8,
                        elevation: 8,
                        // Fix for React Native Web shadow warning - use boxShadow for web
                        ...(Platform.OS === 'web' ? {
                            boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.08)',
                        } : {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.08,
                            shadowRadius: 12,
                        }),
                    },
                    tabBarItemStyle: {
                        paddingVertical: isTablet ? 8 : 4,
                        flexDirection: isTablet ? "row" : "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isTablet ? 8 : 0,
                    },
                })}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={SuperDashboard}
                    options={{ title: "Dashboard Overview" }}
                />
                <Tab.Screen
                    name="Colleges"
                    component={SuperColleges}
                    options={{ title: "College Management" }}
                />
                <Tab.Screen
                    name="Users"
                    component={SuperUsers}
                    options={{ title: "User Management" }}
                />
                <Tab.Screen
                    name="Analytics"
                    component={SuperAnalytics}
                    options={{ title: "Analytics & Reports" }}
                />
                <Tab.Screen
                    name="Profile"
                    component={SuperProfile}
                    options={{ title: "My Profile" }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#1a73e8",
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    iconContainerFocused: {
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center',
    },
    tabLabelFocused: {
        fontWeight: '600',
        color: '#1a73e8',
    },
    tabLabelInactive: {
        color: '#5f6368',
    },
    tabLabelTablet: {
        fontSize: 13,
        marginTop: 0,
        marginLeft: 4,
    },
});

export default SuperAdminTabs;