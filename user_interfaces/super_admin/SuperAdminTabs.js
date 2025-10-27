import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    Dimensions,
  
    StatusBar,
    TouchableOpacity,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// All Super Admin Screens
import SuperDashboard from "./SuperDashboard";
import SuperColleges from "./SuperColleges";
import SuperProfile from "./SuperProfile";
import SuperUsers from "./SuperUsers";
import SuperAnalytics from "./SuperAnalytics";

const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallPhone = width < 375;

const SuperAdminTabs = () => {
    const navigation = useNavigation();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: () => {
                        navigation.navigate('Auth');
                        console.log("Logout pressed");
                    }
                }
            ]
        );
    };

    // Modern header component that stays above tabs
    const CustomHeader = ({ route }) => (
        <View style={styles.headerContainer}>
            <View style={styles.headerContent}>
                <Text
                    style={styles.headerTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {getHeaderTitle(route.name)}
                </Text>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons
                        name="log-out-outline"
                        size={isTablet ? 24 : isSmallPhone ? 18 : 20}
                        color="#1a73e8"
                    />
                    {!isSmallPhone && (
                        <Text style={styles.logoutText}>Logout</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const getHeaderTitle = (routeName) => {
        switch (routeName) {
            case "Dashboard":
                return "Dashboard";
            case "Colleges":
                return "Colleges";
            case "Users":
                return "Users";
            case "Analytics":
                return "Requests";
            case "Profile":
                return "Profile";
            default:
                return routeName;
        }
    };

    // Get shorter tab labels for small screens
    const getTabLabel = (routeName) => {
        if (isSmallPhone) {
            switch (routeName) {
                case "Dashboard":
                    return "Home";
                case "Colleges":
                    return "Colleges";
                case "Users":
                    return "Users";
                case "Analytics":
                    return "Requests";
                case "Profile":
                    return "Me";
                default:
                    return routeName;
            }
        } else {
            switch (routeName) {
                case "Dashboard":
                    return "Dashboard";
                case "Colleges":
                    return "Colleges";
                case "Users":
                    return "Users";
                case "Analytics":
                    return "Requests";
                case "Profile":
                    return "Profile";
                default:
                    return routeName;
            }
        }
    };

    // Calculate tab bar height for proper spacing
    const getTabBarHeight = () => {
        return Platform.select({
            ios: isTablet ? 90 : (isSmallPhone ? 60 : 80),
            android: isTablet ? 80 : (isSmallPhone ? 60 : 70),
            default: 80,
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        switch (route.name) {
                            case "Dashboard":
                                iconName = focused ? "home" : "home-outline";
                                break;
                            case "Colleges":
                                iconName = focused ? "business" : "business-outline";
                                break;
                            case "Users":
                                iconName = focused ? "people" : "people-outline";
                                break;
                            case "Analytics":
                                iconName = focused ? "person-add" : "person-add-outline";
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
                                    size={isTablet ? (focused ? 26 : 24) : (focused ? 22 : 20)}
                                    color={focused ? "#1a73e8" : "#5f6368"}
                                />
                            </View>
                        );
                    },
                    tabBarLabel: ({ focused }) => {
                        return (
                            <Text style={[
                                styles.tabLabel,
                                focused ? styles.tabLabelFocused : styles.tabLabelInactive,
                                isTablet && styles.tabLabelTablet,
                                isSmallPhone && styles.tabLabelSmall
                            ]} numberOfLines={1}>
                                {getTabLabel(route.name)}
                            </Text>
                        );
                    },
                    header: ({ route }) => <CustomHeader route={route} />,
                    tabBarActiveTintColor: "#1a73e8",
                    tabBarInactiveTintColor: "#5f6368",
                    headerShown: true,
                    // FIXED: Remove absolute positioning and use proper tab bar styling
                    tabBarStyle: {
                        backgroundColor: "#ffffff",
                        borderTopWidth: 1,
                        borderTopColor: "#e5e7eb",
                        height: getTabBarHeight(),
                        paddingBottom: Platform.select({
                            ios: isTablet ? 20 : (isSmallPhone ? 8 : 16),
                            android: 8,
                            default: 8,
                        }),
                        paddingTop: isTablet ? 12 : 8,
                        paddingHorizontal: 8,
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        // REMOVE absolute positioning
                        position: 'relative',
                    },
                    tabBarItemStyle: {
                        paddingVertical: isTablet ? 8 : (isSmallPhone ? 4 : 6),
                        flexDirection: isTablet ? "row" : "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: isTablet ? 8 : 4,
                        minHeight: 40,
                    },
                    // Modern header styling
                    headerStyle: {
                        backgroundColor: "#ffffff",
                        elevation: 0,
                        shadowColor: 'transparent',
                        shadowOpacity: 0,
                        height: Platform.select({
                            ios: isTablet ? 100 : (isSmallPhone ? 70 : 80),
                            android: isTablet ? 100 : (isSmallPhone ? 70 : 80),
                            default: 80,
                        }),
                    },
                    headerStatusBarHeight: 0,
                })}
            >
                <Tab.Screen
                    name="Dashboard"
                    component={SuperDashboard}
                    options={{
                        headerTitle: "Dashboard"
                    }}
                />
                <Tab.Screen
                    name="Colleges"
                    component={SuperColleges}
                    options={{
                        headerTitle: "Colleges"
                    }}
                />
                <Tab.Screen
                    name="Users"
                    component={SuperUsers}
                    options={{
                        headerTitle: "Users"
                    }}
                />
                <Tab.Screen
                    name="Analytics"
                    component={SuperAnalytics}
                    options={{
                        headerTitle: "Requests"
                    }}
                />
                <Tab.Screen
                    name="Profile"
                    component={SuperProfile}
                    options={{
                        headerTitle: "Profile"
                    }}
                />
            </Tab.Navigator>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#ffffff",
    },
    headerContainer: {
        backgroundColor: "#ffffff",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        height: Platform.select({
            ios: isTablet ? 100 : (isSmallPhone ? 70 : 80),
            android: isTablet ? 100 : (isSmallPhone ? 70 : 80),
            default: 80,
        }),
        justifyContent: 'flex-end',
        paddingBottom: 12,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: isTablet ? 24 : (isSmallPhone ? 16 : 20),
    },
    headerTitle: {
        fontSize: Platform.select({
            ios: isTablet ? 24 : (isSmallPhone ? 18 : 20),
            android: isTablet ? 24 : (isSmallPhone ? 18 : 20),
            default: 20,
        }),
        fontWeight: "bold",
        color: "#1f2937",
        flex: 1,
        marginRight: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: isSmallPhone ? 10 : 12,
        paddingVertical: isSmallPhone ? 6 : 8,
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        minWidth: isSmallPhone ? 40 : 'auto',
        justifyContent: 'center',
    },
    logoutText: {
        color: "#1a73e8",
        fontSize: isSmallPhone ? 12 : 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: isTablet ? 50 : (isSmallPhone ? 40 : 44),
        height: isTablet ? 32 : (isSmallPhone ? 28 : 30),
        borderRadius: 12,
        backgroundColor: 'transparent',
    },
    iconContainerFocused: {
        backgroundColor: 'rgba(26, 115, 232, 0.1)',
    },
    tabLabel: {
        fontSize: Platform.select({
            ios: isTablet ? 13 : (isSmallPhone ? 10 : 11),
            android: isTablet ? 13 : (isSmallPhone ? 10 : 11),
            default: 11,
        }),
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center',
        maxWidth: 80,
    },
    tabLabelFocused: {
        fontWeight: '600',
        color: '#1a73e8',
    },
    tabLabelInactive: {
        color: '#5f6368',
    },
    tabLabelTablet: {
        marginTop: 0,
        marginLeft: 4,
    },
    tabLabelSmall: {
        marginTop: 1,
    },
});

export default SuperAdminTabs;