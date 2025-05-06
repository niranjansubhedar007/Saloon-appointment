import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createClient } from "@supabase/supabase-js";
import { LinearGradient } from "expo-linear-gradient";
// Initialize Supabase
const supabaseUrl = "https://cqdinxweotvfamknmgap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Approval() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(true);

  // Get the user data passed from the login screen
  useEffect(() => {
    if (params.user) {
      try {
        const userData = JSON.parse(params.user);
        setCurrentUser(userData);
        console.log("User data:", userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        Alert.alert("Error", "Invalid user data");
        router.back();
      }
    } else {
      Alert.alert("Error", "No user data provided");
      router.back();
    }
  }, [params.user]);

  const handleDeleteAccount = async () => {
    Alert.alert("Warning", "Are you sure you want to delete your account?");
    if (!currentUser) return;

    try {
      setLoading(true);

      // First try to delete from auth.users table if exists
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          currentUser.email
        );
        if (authError && !authError.message.includes("User not found")) {
          throw authError;
        }
      } catch (authError) {
        console.log("Auth user deletion skipped (might not exist)", authError);
      }

      // Delete from Setting table
      const { error: settingError } = await supabase
        .from("Setting")
        .delete()
        .eq("id", currentUser.id);

      if (settingError) throw settingError;

      Alert.alert("Success", "Account has been deleted successfully");
      router.back();
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setModalVisible(false);
    router.back();
  };

  return (
    <LinearGradient colors={["#1A2980", "#26D0CE"]} style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleGoBack}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Account Not Approved</Text>
            {currentUser && (
              <>
                <Text style={styles.userInfoText}>
                  Username: {currentUser.name}
                </Text>
                <Text style={styles.userInfoText}>
                  Email: {currentUser.email}
                </Text>
              </>
            )}
            <Text style={styles.modalText}>
              Your account is still pending approval. Please wait for the admin
              to approve your account.
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#1A2980" />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleGoBack}
                >
                  <Text style={styles.modalButtonText}>Okay, got it</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteAccount}
                >
                  <Text style={[styles.modalButtonText, { color: "white" }]}>
                    Delete Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  userInfoText: {
    fontSize: 16,
    color: "#2c3e50",
    marginBottom: 8,
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
    justifyContent: "space-between",
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
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
    fontSize: 15,
    fontWeight: "600",
  },
});
