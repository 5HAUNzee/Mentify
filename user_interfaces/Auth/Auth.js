import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useOAuth, useUser } from "@clerk/clerk-expo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase.config";

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

        // ✅ Restrict login to GEC emails only
        if (!email.endsWith("@gec.ac.in")) {
          Alert.alert(
            "Access Denied",
            "Please sign in using your @gec.ac.in email address."
          );
          return;
        }

        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          // ✅ Navigate based on approval status
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
          // 🆕 Create new user document (first login)
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

  // 🔹 Google Sign-In flow
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

  // 🔹 UI
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 20,
          color: "#2563EB",
        }}
      >
        Sign In with Google
      </Text>

      <TouchableOpacity
        onPress={handleSignInWithGoogle}
        style={{
          backgroundColor: "#2563EB",
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
          Sign in with Google
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          marginTop: 16,
          color: "#6B7280",
          textAlign: "center",
          paddingHorizontal: 20,
        }}
      >
        Only emails ending with{" "}
        <Text style={{ fontWeight: "bold" }}>@gec.ac.in</Text> are allowed.
      </Text>
    </View>
  );
};

export default Auth;
