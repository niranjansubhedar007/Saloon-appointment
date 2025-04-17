import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import Footer from "./footer";
import { createClient } from "@supabase/supabase-js";

import FontAwesome from "react-native-vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
const supabaseUrl = "https://cqdinxweotvfamknmgap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function OwnerCustomer() {
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBtn, setShowBtn] = useState(false);
  const [viewMode, setViewMode] = useState("active"); // active | inactive | archived
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);

  const API_APPOINTMENTS =
    "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Appointments";
  const API_USERS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/User";
  const API_AGENTS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Agents";
  const API_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);

      const [appointmentsRes, usersRes] = await Promise.all([
        fetch(API_APPOINTMENTS, { headers: { apikey: API_KEY } }),
        fetch(API_USERS, { headers: { apikey: API_KEY } }),
      ]);

      const [allAppointments, users] = await Promise.all([
        appointmentsRes.json(),
        usersRes.json(),
      ]);

      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const userAppointmentsMap = {};
      allAppointments.forEach((a) => {
        if (!userAppointmentsMap[a.user_id])
          userAppointmentsMap[a.user_id] = [];
        userAppointmentsMap[a.user_id].push(a);
      });

      const activeUsers = [];
      const inactiveUsers = [];
      const archivedUsers = [];

      for (const userId in userAppointmentsMap) {
        const allUserApps = userAppointmentsMap[userId];

        const latestAppointment = allUserApps.reduce((latest, current) =>
          new Date(current.appointment_date) > new Date(latest.appointment_date)
            ? current
            : latest
        );

        const hasSelectedAgentApp =
          selectedAgents.length === 0 ||
          allUserApps.some((a) => a.agent_id === selectedAgents[0]);

        if (!hasSelectedAgentApp) continue;

        const user = users.find((u) => u.id === Number(userId));
        if (!user) continue;

        const userEntry = {
          ...user,
          lastAppointmentDate: formatDate(latestAppointment.appointment_date),
          lastAppointmentId: latestAppointment.id,
        };

        if (latestAppointment.is_archive) {
          archivedUsers.push(userEntry);
        } else if (
          new Date(latestAppointment.appointment_date) < twoMonthsAgo
        ) {
          inactiveUsers.push(userEntry);
        } else {
          activeUsers.push(userEntry);
        }
      }

      setActiveUsers(activeUsers);
      setInactiveUsers(inactiveUsers);
      setArchivedUsers(archivedUsers);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedAgents]);






    const fetchAgents = async () => {
      try {
        const res = await fetch(API_AGENTS, {
          headers: { apikey: API_KEY },
        });
        const data = await res.json();
        setAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error.message);
      }
    };
  
    useEffect(() => {
      fetchAgents();
    }, []);
  const updateArchiveStatus = async (appointmentId, isArchive) => {
    try {
      const res = await fetch(`${API_APPOINTMENTS}?id=eq.${appointmentId}`, {
        method: "PATCH",
        headers: {
          apikey: API_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ is_archive: isArchive }),
      });
      if (!res.ok) throw new Error("Failed to update archive status");
      fetchAppointments();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleArchive = (item) => {
    Alert.alert("Archive", "Are you sure to archive?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: () => updateArchiveStatus(item.lastAppointmentId, true),
      },
    ]);
  };

  const handleUnarchive = (item) => {
    Alert.alert("Unarchive", "Restore this customer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: () => updateArchiveStatus(item.lastAppointmentId, false),
      },
    ]);
  };

  const AgentList = () => (
    <View style={styles.agentListContainer}>
      <Text style={{ fontSize: 11, marginBottom: 10, marginLeft: 3 }}>
        Choose Professional
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.agentCard,
            selectedAgents.length === 0 && styles.selectedAgentCard,
          ]}
          onPress={() => setSelectedAgents([])}
        >
          <Text
            style={[
              styles.agentName,
              selectedAgents.length === 0 && styles.selectedAgentName,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {agents.map((agent) => {
          const isSelected = selectedAgents[0] === agent.id;
          return (
            <TouchableOpacity
              key={agent.id}
              style={[styles.agentCard, isSelected && styles.selectedAgentCard]}
              onPress={() => {
                setSelectedAgents([agent.id]);
              }}
            >
              <Text
                style={[
                  styles.agentName,
                  isSelected && styles.selectedAgentName,
                ]}
              >
                {agent.full_name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const getDisplayedUsers = () => {
    switch (viewMode) {
      case "archived":
        return archivedUsers;
      case "inactive":
        return inactiveUsers;
      case "active":
        return activeUsers;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {viewMode === "archived"
              ? `Archived Customers (${archivedUsers.length})`
              : viewMode === "inactive"
              ? `Inactive Customers (${inactiveUsers.length})`
              : `Active Customers (${activeUsers.length})`}
          </Text>
          <View style={styles.toggleWrapper}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === "active" && styles.toggleActive,
              ]}
              onPress={() => setViewMode("active")}
            >
              <Text style={styles.toggleText}>Active</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleBtn,
                viewMode === "inactive" && styles.toggleActive,
              ]}
              onPress={() => setViewMode("inactive")}
            >
              <Text style={styles.toggleText}>Inactive</Text>
            </TouchableOpacity>

            {/* Always show Archived button, but don't highlight unless selected */}
            {viewMode !== "active" && (
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  viewMode === "archived" && styles.toggleActive,
                ]}
                onPress={() => setViewMode("archived")}
              >
                <Text style={styles.toggleText}>Archived</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <AgentList />
        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : (
          <View style={{ height: 520 }}>
            <FlatList
              data={getDisplayedUsers()}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No users found</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.itemContainer}>
                  <View style={styles.card}>
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <Text style={styles.userInfo}>{item.mobile_number}</Text>
                    <Text style={styles.userInfo}>
                      Last Visit: {item.lastAppointmentDate || "N/A"}
                    </Text>
                  </View>
                  <View style={{ justifyContent: "center", gap: 8 }}>
                    {viewMode !== "active" && (
                      <TouchableOpacity
                        style={[
                          styles.iconButton,
                          viewMode === "archived"
                            ? styles.unarchiveButton
                            : styles.archiveButton,
                        ]}
                        onPress={() =>
                          viewMode === "archived"
                            ? handleUnarchive(item)
                            : handleArchive(item)
                        }
                      >
                        <FontAwesome
                          name={viewMode === "archived" ? "eye-slash" : "eye"}
                          size={16}
                          color="white"
                        />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.iconButton, styles.callButton]}
                      onPress={() =>
                        Linking.openURL(`tel:${item.mobile_number}`)
                      }
                    >
                      <FontAwesome name="phone" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </View>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  selectedAgentName: {
    color: "#007bff",
  },
  agentListContainer: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 5,
    marginBottom: 10,
  },
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { marginBottom: 10 },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2196F3",
    marginBottom: 10,
  },
  toggleWrapper: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleBtn: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  toggleActive: {
    borderColor: "#007bff",
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    color: "#007bff",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    borderColor: "#90caf9",
    borderWidth: 1,
  },
  userName: { fontSize: 13, fontWeight: "500", marginBottom: 3 },
  userInfo: { fontSize: 12, color: "#424242" },
  actions: { flexDirection: "row", gap: 8 },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  callButton: { backgroundColor: "#4CAF50" },
  archiveButton: { backgroundColor: "#FF9800" },
  unarchiveButton: { backgroundColor: "#9C27B0" },
  emptyText: {
    textAlign: "center",
    color: "#757575",
    marginTop: 20,
  },
  agentCard: {
    backgroundColor: "#f0f0f0",

    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    borderRadius: 10,
  },
  selectedAgentCard: {
    borderColor: "#007bff",
    borderWidth: 1,
  },
  agentName: {
    fontSize: 12,
  },
});
