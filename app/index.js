import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { hideNavigationBar } from "react-native-navigation-bar-color";
import { createClient } from "@supabase/supabase-js";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";

// Initialize Supabase
const supabaseUrl = "https://cqdinxweotvfamknmgap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Index() {
  const [modalVisible, setModalVisible] = useState(false);
  const [ipAddress, setIpAddress] = useState("");
  const [billIpAddress, setBillIpAddress] = useState("");
  const [port, setPort] = useState("");
  const [billPort, setBillPort] = useState("");
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const handleSave = async () => {
    try {
      const { data: existingSettings } = await supabase
        .from("Setting")
        .select("id, key, value")
        .in("key", ["IP_address", "port", "bill_IP_address", "bill_port"]);

      const settingsMap = existingSettings.reduce((acc, item) => {
        acc[item.key] = item;
        return acc;
      }, {});

      const updates = [];
      const inserts = [];

      // Function to check and update/insert setting
      const checkAndUpdate = (key, value) => {
        if (settingsMap[key]) {
          updates.push({ key, value });
        } else {
          inserts.push({ key, value });
        }
      };

      checkAndUpdate("IP_address", ipAddress);
      checkAndUpdate("port", port);
      checkAndUpdate("bill_IP_address", billIpAddress);
      checkAndUpdate("bill_port", billPort);

      // Perform updates
      if (updates.length > 0) {
        await Promise.all(
          updates.map(({ key, value }) =>
            supabase.from("Setting").update({ value }).eq("key", key)
          )
        );
      }

      // Perform inserts
      if (inserts.length > 0) {
        await supabase.from("Setting").insert(inserts);
      }

      Alert.alert("Success", "Settings updated successfully");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update settings");
      console.error("Supabase error:", error);
    }
  };

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "1040363962427-av0odib2simltits2pr6nlirma84s14d.apps.googleusercontent.com",
      iosClientId:
        "1040363962427-un3654f9npok5p2oai6qrgkufu5bii3h.apps.googleusercontent.com",
      offlineAccess: true,
      scopes: ["https://www.googleapis.com/auth/userinfo.email"],
    });

    hideNavigationBar();

    return () => {
      hideNavigationBar();
    };
  }, []);

  const storeToken = async (token) => {
    try {
      await AsyncStorage.setItem("@token", token);
    } catch (error) {
      console.error("Error storing the token:", error);
    }
  };

  const fetchUserRole = async (email) => {
    try {
      // Get agent ID from email
      const { data: agent, error: agentError } = await supabase
        .from("Agents")
        .select("id")
        .eq("email", email)
        .single();

      if (agentError || !agent) {
        console.error("Agent not found:", agentError);
        return null;
      }

      // Get role for this agent
      const { data: roleData, error: roleError } = await supabase
        .from("Roles")
        .select("role_name")
        .eq("agent_id", agent.id)
        .single();

      if (roleError || !roleData) {
        console.error("Role not found:", roleError);
        return null;
      }

      return { role: roleData.role_name, agentId: agent.id }; // Return both values
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  const onGoogleButtonPress = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      const accessToken = tokens.accessToken;
      const userInfo = await GoogleSignin.getCurrentUser();

      if (accessToken) {
        await AsyncStorage.setItem("@token", accessToken);
      }

      if (userInfo) {
        const email = userInfo.user.email;
        console.log("Authenticated email:", email);

        const userData = await fetchUserRole(email);

        if (userData) {
          const { role, agentId } = userData;

          // Store role and agentId in AsyncStorage
          await AsyncStorage.setItem("@role", role);
          await AsyncStorage.setItem("@agentId", agentId.toString());

          if (role === "worder") {
            Alert.alert("Success", "Welcome !");
            router.push("/appointment");
          } else if (role === "worker") {
            Alert.alert("Success", "Welcome !");
            router.push("/appointment");
          } else if (role === "owner") {
            Alert.alert("Success", "Welcome Owner!");
            router.push("/report");
          } else {
            console.log("Unknown role:", role);
          }
        } else {
          // console.error("No role found for the email:", email);
          Alert.alert("Error", "No role assigned. Contact support.");
        }
      }
    } catch (error) {
      // console.error("Google Sign-In error:", error);
    }
  };
  const handleLogin = async (e) => {
    setError("");
    setSuccess(false);

    try {
      const { data, error } = await supabase
        .from("Setting")
        .select("key, value");

      if (error) throw error;

      const storedUser = data.find((item) => item.key === "username")?.value;
      const storedPass = data.find((item) => item.key === "password")?.value;

      if (userName === storedUser && password === storedPass) {
        setSuccess(true);

        // Save owner role to AsyncStorage
        await AsyncStorage.setItem("@role", "owner");

        // Optional: You might want to set a dummy agentId or fetch actual owner ID
        await AsyncStorage.setItem("@agentId", "owner_id");
        Alert.alert("Success", "Welcome Owner!");
        router.push("/report");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Error fetching login info");
    }
  };

  return (
    <LinearGradient colors={["#f3f4f6", "#e5e7eb"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Manage your business efficiently</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#9ca3af"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
            />
            <FontAwesome name="user" size={20} color="#6b7280" />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passworsdToggle}
            >
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color="#6b7280"
              />
            </Pressable>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <FontAwesome
                name="exclamation-circle"
                size={16}
                color="#dc2626"
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
        {/* Google Sign-In Button */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={onGoogleButtonPress}
        >
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/2991/2991148.png",
            }}
            style={styles.googleLogo}
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Login Form */}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 5,
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 30,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    color: "#6b7280",
    paddingHorizontal: 10,
    fontSize: 13,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: "#1f2937",
    fontSize: 13,
    paddingVertical: 12,
  },
  passwordToggle: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  errorText: {
    color: "#dc2626",
    marginLeft: 8,
    fontSize: 13,
  },
  successText: {
    color: "#16a34a",
    textAlign: "center",
    marginTop: 10,
    fontSize: 13,
  },
});
