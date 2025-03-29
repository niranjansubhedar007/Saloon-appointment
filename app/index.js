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
} from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { hideNavigationBar } from "react-native-navigation-bar-color";
import { createClient } from "@supabase/supabase-js";
import FontAwesome from "react-native-vector-icons/FontAwesome";

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
          console.error("No role found for the email:", email);
          Alert.alert("Error", "No role assigned. Contact support.");
        }
      }
    } catch (error) {
      console.error("Google Sign-In error:", error);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>
          Sign in to continue to your dashboard
        </Text>
        <TouchableOpacity
          style={styles.googleButton}
          onPress={onGoogleButtonPress}
        >
          <Image
            source={{
              uri: "https://cdn-teams-slug.flaticon.com/google.jpg",
            }}
            style={styles.googleLogo}
          />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
{/* <View style={{position:"absolute", top:30, right:10}}>
      <FontAwesome
        name="gear"
        color="gray"
        size={24}
        onPress={() => setModalVisible(true)}
      />
</View> */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter IP Address & Port</Text>
            <TextInput
              style={styles.input}
              placeholder="IP Address"
              value={ipAddress}
              onChangeText={setIpAddress}
            />
                <TextInput
              style={styles.input}
              placeholder="Bill IP Address"
              value={billIpAddress}
              onChangeText={setBillIpAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="Port"
              keyboardType="numeric"
              value={port}
              onChangeText={setPort}
            />
               <TextInput
              style={styles.input}
              placeholder="Bill Port"
              keyboardType="numeric"
              value={billPort}
              onChangeText={setBillPort}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonTexts}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonTexts}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    position: "relative",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    color: "darkblue",
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "blue",
    padding: 15,
    borderRadius: 50,
  },
  addButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    borderBottomWidth: 1,
    marginBottom: 10,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 10,
  },
  button: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "red",
  },
  buttonTexts: {
    color: "white",
    fontWeight: "bold",
  },
});
