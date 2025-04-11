import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  TouchableWithoutFeedback,
} from "react-native";
import Footer from "./footer";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function Customer() {
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedAppointmentRef = useRef(null);

  const API_APPOINTMENTS =
    "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Appointments?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

  const API_USERS =
    "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/User?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchAppointments = async () => {
    try {
      const [appointmentRes, userRes] = await Promise.all([
        fetch(API_APPOINTMENTS),
        fetch(API_USERS),
      ]);

      const [appointments, users] = await Promise.all([
        appointmentRes.json(),
        userRes.json(),
      ]);

      const now = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      const userMap = {};

      appointments.forEach((item) => {
        const date = new Date(item.appointment_date);
        if (!userMap[item.user_id]) userMap[item.user_id] = [];
        userMap[item.user_id].push({ ...item, parsedDate: date });
      });

      const inactiveUserDetails = [];

      for (const userId in userMap) {
        const userAppointments = userMap[userId];

        // Find the latest appointment
        const lastAppointment = userAppointments.reduce((latest, current) => {
          return current.parsedDate > latest.parsedDate ? current : latest;
        }, userAppointments[0]);

        const lastDate = lastAppointment ? lastAppointment.parsedDate : null;

        // Only show if last appointment is older than 2 months
        if (lastDate && lastDate < twoMonthsAgo) {
          const userData = users.find((u) => u.id === Number(userId));
          if (userData) {
            inactiveUserDetails.push({
              ...userData,
              lastAppointmentDate: formatDate(lastDate),
            });
          }
        }
      }

      setInactiveUsers(inactiveUserDetails);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>
          ( {inactiveUsers.length} ) Customers not visited in last 2 months
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="blue" />
        ) : inactiveUsers.length === 0 ? (
          <Text>No users found.</Text>
        ) : (
          <View style={styles.scrollContainer}>
          <FlatList
            data={inactiveUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={styles.card}>
                  <Text style={styles.userText}>{item.full_name}</Text>
                  <Text style={styles.userText}>{item.mobile_number}</Text>
                  <Text style={styles.userText}>
                    {item.lastAppointmentDate || "N/A"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionButton, styles.recallButton]}
                  onPress={() => {
                    if (!item.mobile_number) {
                      Alert.alert("Error", "User phone number not found.");
                      return;
                    }
                    setTimeout(() => {
                      Linking.openURL(`tel:${item.mobile_number}`);
                    }, 300);
                  }}
                >
                  <FontAwesome name="phone" size={15} color="white" />
                </TouchableOpacity>
              </View>
            )}
            showsVerticalScrollIndicator={true}
          />
        </View>
        
        )}
      </View>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    height: 630, // 👈 Set your desired height here
    // borderWidth: 1,
    // borderColor: "#2196F3",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  
  
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 3,
  },
  card: {
    padding: 12,
    backgroundColor: "#e1f5fe",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: "#2196F3",
    marginTop: 5,
  },
  userText: {
    fontSize: 12,
  },
  actionButton: {
    width: 25, // Set fixed width
    height: 25, // Set fixed height
    borderRadius: 20, // Makes it circular
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginLeft: 5,
  },

  recallButton: {
    backgroundColor: "green",
  },
});
