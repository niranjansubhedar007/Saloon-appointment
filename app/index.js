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
  Button,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableHighlight,
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
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [currentUnapprovedUser, setCurrentUnapprovedUser] = useState(null);

  // const handleSignup = async () => {
  //   setError("");
  //   setSuccess(false);
  //   if (!email || !password || !username) {
  //     Alert.alert("Error", "Please fill all fields");
  //     return;
  //   }

  //   setLoading(true);

  //   // 1. Create user in Supabase Auth
  //   const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
  //     {
  //       email: email,
  //       password: password,
  //     }
  //   );

  //   if (signUpError) {
  //     console.log(signUpError.message)
  //     Alert.alert("Signup Error", signUpError.message);

  //     setLoading(false);
  //     return;
  //   }

  //   const userId = signUpData?.user?.id;

  //   if (!userId) {
  //     Alert.alert("Signup Error", "Unable to get user ID.");
  //     setLoading(false);
  //     return;
  //   }

  //   // 2. Insert user into your Setting table
  //   const { error: insertError } = await supabase.from("Setting").insert({
  //     email: email,
  //     password: password,
  //     name: username,
  //     is_approved: false, // optional default value
  //   });

  //   if (insertError) {
  //     Alert.alert("Error saving user data", insertError.message);
  //     setLoading(false);
  //     return;
  //   }

  //   Alert.alert("Success", "Account created! Please log in.");
  //   setLoading(false);
  //   navigation.navigate("Login"); // Replace with your actual login screen name
  // };

  const handleSignup = async () => {
    // Keyboard.dismiss(); // Dismiss keyboard first

    setError("");
    setSuccess(false);

    if (!email || !password || !username) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    // Step 1: Check if email already exists in Setting table
    const { data: existingUsers, error: fetchError } = await supabase
      .from("Setting")
      .select("*")
      .eq("email", email);

    if (fetchError) {
      Alert.alert("Error", "Failed to check existing users.");
      setLoading(false);
      return;
    }

    if (existingUsers.length > 0) {
      Alert.alert(
        "Already Registered",
        "You already have an account. Please login to continue."
      );
      setLoading(false);
      return;
    }

    // Step 2: Create user in Supabase Auth
    // const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
    //   {
    //     email: email,
    //     password: password,
    //   }
    // );

    // if (signUpError) {
    //   console.log(signUpError.message);
    //   Alert.alert("Signup Error", signUpError.message);
    //   setLoading(false);
    //   return;
    // }

    // const userId = signUpData?.user?.id;

    // if (!userId) {
    //   Alert.alert("Signup Error", "Unable to get user ID.");
    //   setLoading(false);
    //   return;
    // }

    // Step 3: Insert user into Setting table
    const { error: insertError } = await supabase.from("Setting").insert({
      email: email,
      password: password,
      name: username,
      is_approved: false,
    });

    if (insertError) {
      Alert.alert("Error saving user data", insertError.message);
      setLoading(false);
      return;
    }

    Alert.alert("Success", "Account created Successfully ! Please log in.");
    setLoading(false);
    setPassword("");
    setEmail("");
    setUsername("");
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

          if (role === "worker") {
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

  const handleLogin = async () => {
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      // 1. Check if user exists in Setting table with given username and password
      const { data: settingData, error: settingError } = await supabase
        .from("Setting")
        .select("*")
        .eq("name", userName)
        .eq("password", password)

        .single();

      if (settingError || !settingData) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // In your handleLogin function, where you detect unapproved user:
      if (settingData.is_approved === false) {
        router.push({
          pathname: "/approval",
          params: { user: JSON.stringify(settingData) },
        });
        return;
      }

      await AsyncStorage.setItem("@role", "owner");
      if (settingData.is_approved === true && settingData.role === "owner") {
        router.push({
          pathname: "/report",
          params: { user: JSON.stringify(settingData) },
        });

        return;
      }

      // Store role and agentId in AsyncStorage

      Alert.alert("Success", "Welcome Admin!");
      router.push("/report");

      setSuccess(true);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setModalVisible(false);

      // 1. Delete from auth users table (if they exist)
      const { error: authError } = await supabase.auth.admin.deleteUser(
        currentUnapprovedUser.email
      );

      // 2. Delete from Setting table
      const { error: settingError } = await supabase
        .from("Setting")
        .delete()
        .eq("email", currentUnapprovedUser.email);

      if (settingError) {
        throw settingError;
      }

      Alert.alert("Success", "Unapproved account has been deleted");
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
      setCurrentUnapprovedUser(null);
    }
  };

  const handleLoginMessage = () => {
    setIsLogin(!isLogin);
    setError("");
    setSuccess(false);
    setUserName("");
    setPassword("");
    setEmail("");
    setUsername("");
  };
  return (
    <LinearGradient colors={["#1A2980", "#26D0CE"]} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={60}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {isLogin ? "Welcome" : "Create Account"}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? "Sign in to continue"
                  : "Get started with your account"}
              </Text>
            </View>

            <View style={styles.card}>
              {!isLogin && (
                <>
                  <Text style={styles.sectionLabel}>Account Information</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#95a5a6"
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                    />
                    <FontAwesome
                      name="user"
                      size={18}
                      color="#7f8c8d"
                      style={styles.inputIcon}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#95a5a6"
                      value={email}
                      onChangeText={setEmail}
                      // autoCapitalize="none"
                      // keyboardType="email-address"
                    />
                    <FontAwesome
                      name="envelope"
                      size={18}
                      color="#7f8c8d"
                      style={styles.inputIcon}
                    />
                  </View>
                </>
              )}

              {isLogin && (
                <>
                  <Text style={styles.sectionLabel}>Login Credentials</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="#95a5a6"
                      value={userName}
                      onChangeText={setUserName}
                      autoCapitalize="none"
                    />
                    <FontAwesome
                      name="user"
                      size={18}
                      color="#7f8c8d"
                      style={styles.inputIcon}
                    />
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#95a5a6"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <FontAwesome
                    name={showPassword ? "eye-slash" : "eye"}
                    size={18}
                    color="#7f8c8d"
                  />
                </TouchableOpacity>
              </View>

              {error && (
                <View style={styles.errorContainer}>
                  <FontAwesome
                    name="exclamation-circle"
                    size={16}
                    color="#e74c3c"
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.authButton}
                onPress={isLogin ? handleLogin : handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isLogin ? "Sign In" : "Create Account"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )} */}
            </View>

            <View style={styles.switchAuthContainer}>
              <Text style={styles.switchAuthText}>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </Text>
              <TouchableOpacity onPress={handleLoginMessage}>
                <Text style={styles.switchAuthLink}>
                  {isLogin ? "Create account" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === "android" && (
              <>
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
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Account Not Approved</Text>
            <Text style={styles.modalText}>
              Your account is still pending approval. please wait for the admin
              to approve your account.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Okay, got it</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleDeleteAccount}
              >
                <Text style={styles.modalButtonText}>Delete </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 25,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    minWidth: "45%",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e9ecef",
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 25,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 15,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },

  input: {
    flex: 1,
    height: 52,
    color: "#2c3e50",
    fontSize: 16,
  },

  authButton: {
    backgroundColor: "#3498db",
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  authButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPassword: {
    alignSelf: "center",
    marginTop: 16,
  },
  forgotPasswordText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fdecea",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#e74c3c",
    marginLeft: 8,
    fontSize: 14,
  },
  switchAuthContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  switchAuthText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginRight: 5,
  },
  switchAuthLink: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.8)",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
});
