import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
  Dimensions,
  
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.config";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

WebBrowser.maybeCompleteAuthSession();

// Warm up browser for Android Google Sign-In
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

  // Run after login
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
                navigation.replace("SuperDashboard");
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
      const { createdSessionId, setActive } = await startOAuthFlow();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("OAuth error:", err);
      Alert.alert("Login Error", "Something went wrong during sign-in.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={48} color="#1a73e8" />
          </View>
          <Text style={styles.title}>Mentify</Text>
          <Text style={styles.subtitle}>Academic Portal</Text>
        </View>

        {/* Sign In Card */}
        <View style={styles.signInCard}>
          <Text style={styles.signInTitle}>Sign in</Text>
          <Text style={styles.signInSubtitle}>to continue to Mentify</Text>

          {/* Google Sign In Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleSignInWithGoogle}
          >
            <View style={styles.googleButtonContent}>
              <View style={styles.googleIconContainer}>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              </View>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {/* Domain Notice */}
          <View style={styles.domainNotice}>
            <Ionicons name="information-circle" size={16} color="#5f6368" />
            <Text style={styles.domainText}>
              Use your <Text style={styles.domainHighlight}>@gec.ac.in</Text>{" "}
              email
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Goa College of Engineering</Text>
          <Text style={styles.footerSubtext}>Mentorship Program</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: "center",
    marginTop: height * 0.1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  title: {
    fontSize: 32,
    fontWeight: "400",
    color: "#202124",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#5f6368",
    fontWeight: "400",
  },
  signInCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 40,
    borderWidth: 1,
    borderColor: "#dadce0",
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: "400",
    color: "#202124",
    textAlign: "center",
    marginBottom: 8,
  },
  signInSubtitle: {
    fontSize: 16,
    color: "#5f6368",
    textAlign: "center",
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dadce0",
    borderRadius: 4,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  googleIconContainer: {
    position: "absolute",
    left: 16,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  googleButtonText: {
    color: "#3c4043",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Roboto, sans-serif",
  },
  domainNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e8eaed",
  },
  domainText: {
    color: "#5f6368",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "400",
  },
  domainHighlight: {
    fontWeight: "500",
    color: "#1a73e8",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    color: "#5f6368",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 4,
  },
  footerSubtext: {
    color: "#80868b",
    fontSize: 12,
    fontWeight: "400",
  },
});

export default Auth;
