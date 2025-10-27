// screens/Auth.js - ENHANCED CARD UI
import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useOAuth, useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

WebBrowser.maybeCompleteAuthSession();

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => void WebBrowser.coolDownAsync();
  }, []);
};

const Auth = ({ navigation }) => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { user, isSignedIn } = useUser();
  useWarmUpBrowser();

  useEffect(() => {
    const checkUser = async () => {
      if (isSignedIn && user) {
        const email = user.primaryEmailAddress?.emailAddress || "";

        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          if (data.status === "approved") {
            switch (data.role) {
              case "mentee":
                navigation.replace("MenteeDashboard");
                break;
              case "superadmin":
                navigation.replace("SuperAdminDashboard");
                break;
              case "collegeadmin":
                navigation.replace("CollegeDashboard");
                break;
              case "deptadmin":
                navigation.replace("DeptDashboard");
                break;
              case "mentor":
                navigation.replace("MentorDashboard");
                break;
              default:
                Alert.alert("Error", "Unknown role found for this user.");
            }
          } else if (data.status === "rejected") {
            navigation.replace("Rejected");
          } else {
            navigation.replace("ApprovalPendingScreen");
          }
        } else {
          await setDoc(userRef, {
            email,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            role: null,
            status: "pending",
            createdAt: new Date(),
          });
          navigation.replace("Registration", { email });
        }
      }
    };
    checkUser();
  }, [isSignedIn, user]);

  const handleSignInWithGoogle = async () => {
    try {
      const redirectUrl = Linking.createURL("oauth-callback", {
        scheme: "mentify",
      });

      console.log("OAuth redirect URL:", redirectUrl);

      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: redirectUrl,
      });

      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        console.log("Session created successfully:", createdSessionId);
      } else {
        Alert.alert("Login Failed", "Could not create session.");
      }
    } catch (err) {
      console.error("OAuth error:", err);
      Alert.alert(
        "Login Error",
        err.message || "Something went wrong during sign-in."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#1e40af", "#3b82f6", "#60a5fa"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="school" size={48} color="#fff" />
            </View>
            <Text style={styles.title}>Mentify</Text>
            <Text style={styles.subtitle}>Academic Mentorship Portal</Text>
          </View>

          {/* Sign In Card - Enhanced */}
          <View style={styles.cardWrapper}>
            <View style={styles.cardGlow} />
            <View style={styles.signInCard}>
              {/* Card Top Accent */}
              <View style={styles.cardTopAccent} />

              <View style={styles.cardContent}>
                <View style={styles.welcomeHeader}>
                  <View style={styles.iconBadge}>
                    <Feather name="lock" size={18} color="#3b82f6" />
                  </View>
                  <Text style={styles.signInTitle}>Welcome</Text>
                  <Text style={styles.signInSubtitle}>
                    Sign in to your account
                  </Text>
                </View>

                {/* Google Sign In Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleSignInWithGoogle}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#ffffff", "#f8fafc"]}
                    style={styles.googleButtonGradient}
                  >
                    <View style={styles.googleIconCircle}>
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                    </View>
                    <Text style={styles.googleButtonText}>
                      Continue with Google
                    </Text>
                    <Feather name="arrow-right" size={18} color="#3b82f6" />
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Secure Login</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Domain Notice */}
                <View style={styles.domainNotice}>
                  <Feather name="shield" size={14} color="#3b82f6" />
                  <Text style={styles.domainText}>
                    Use <Text style={styles.domainHighlight}>@gec.ac.in</Text> email
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Goa College of Engineering</Text>
            <Text style={styles.footerSubtext}>Mentorship Program • 2025</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  logoSection: {
    alignItems: "center",
    marginTop: height * 0.06,
  },
  logoContainer: {
    width: 85,
    height: 85,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
    fontSize: 38,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#dbeafe",
    fontWeight: "500",
  },
  cardWrapper: {
    position: "relative",
  },
  cardGlow: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: "#fff",
    opacity: 0.1,
    borderRadius: 28,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  signInCard: {
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTopAccent: {
    height: 4,
    backgroundColor: "#3b82f6",
  },
  cardContent: {
    padding: 32,
  },
  welcomeHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  signInTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  signInSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  googleButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
  },
  googleIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  googleButtonText: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  domainNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  domainText: {
    color: "#1e40af",
    fontSize: 13,
    fontWeight: "500",
  },
  domainHighlight: {
    fontWeight: "700",
    color: "#3b82f6",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  footerSubtext: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "500",
  },
});

export default Auth;