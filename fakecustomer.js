// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   ActivityIndicator,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   Linking,
// } from "react-native";
// import Footer from "./footer";
// import FontAwesome from "react-native-vector-icons/FontAwesome";

// export default function Customer() {
//   const [inactiveUsers, setInactiveUsers] = useState([]);
//   const [archivedUsers, setArchivedUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showArchive, setShowArchive] = useState(false);

//   const API_APPOINTMENTS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Appointments?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";
//   const API_USERS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/User?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

//   const formatDate = (date) => {
//     const d = new Date(date);
//     return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
//   };

//   const fetchAppointments = async () => {
//     try {
//       const [appointmentsRes, usersRes] = await Promise.all([
//         fetch(API_APPOINTMENTS),
//         fetch(API_USERS)
//       ]);
      
//       const [appointments, users] = await Promise.all([
//         appointmentsRes.json(),
//         usersRes.json()
//       ]);

//       const twoMonthsAgo = new Date();
//       twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

//       // Separate active and archived appointments
//       const activeAppointments = appointments.filter(a => !a.is_archive);
//       const archivedAppointments = appointments.filter(a => a.is_archive);

//       // Process active appointments
//       const activeUserMap = {};
//       activeAppointments.forEach(appointment => {
//         const date = new Date(appointment.appointment_date);
//         if (!activeUserMap[appointment.user_id]) activeUserMap[appointment.user_id] = [];
//         activeUserMap[appointment.user_id].push({ ...appointment, parsedDate: date });
//       });

//       const inactiveUsers = [];
//       for (const userId in activeUserMap) {
//         const appointments = activeUserMap[userId];
//         const lastAppointment = appointments.reduce((latest, current) => 
//           current.parsedDate > latest.parsedDate ? current : latest
//         );
        
//         if (lastAppointment.parsedDate < twoMonthsAgo) {
//           const user = users.find(u => u.id === Number(userId));
//           if (user) {
//             inactiveUsers.push({
//               ...user,
//               lastAppointmentDate: formatDate(lastAppointment.parsedDate),
//               lastAppointmentId: lastAppointment.id
//             });
//           }
//         }
//       }

//       // Process archived appointments
//       const archivedUserMap = {};
//       archivedAppointments.forEach(appointment => {
//         const date = new Date(appointment.appointment_date);
//         if (!archivedUserMap[appointment.user_id]) archivedUserMap[appointment.user_id] = [];
//         archivedUserMap[appointment.user_id].push({ ...appointment, parsedDate: date });
//       });

//       const archivedUsers = [];
//       for (const userId in archivedUserMap) {
//         const appointments = archivedUserMap[userId];
//         const lastAppointment = appointments.reduce((latest, current) => 
//           current.parsedDate > latest.parsedDate ? current : latest
//         );
        
//         const user = users.find(u => u.id === Number(userId));
//         if (user) {
//           archivedUsers.push({
//             ...user,
//             lastAppointmentDate: formatDate(lastAppointment.parsedDate),
//             lastAppointmentId: lastAppointment.id
//           });
//         }
//       }

//       setInactiveUsers(inactiveUsers);
//       setArchivedUsers(archivedUsers);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error:", error);
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAppointments();
//   }, []);

//   const updateArchiveStatus = async (appointmentId, isArchive) => {
//     try {
//       const response = await fetch(
//         `${API_APPOINTMENTS}&id=eq.${appointmentId}`,
//         {
//           method: 'PATCH',
//           headers: {
//             'Content-Type': 'application/json',
//             'Prefer': 'return=minimal'
//           },
//           body: JSON.stringify({ is_archive: isArchive })
//         }
//       );
//       if (!response.ok) throw new Error(`Failed to ${isArchive ? 'archive' : 'unarchive'}`);
//       await fetchAppointments();
//     } catch (error) {
//       Alert.alert("Error", error.message);
//     }
//   };

//   const handleArchive = (item) => {
//     Alert.alert(
//       "Archive Confirmation",
//       "Are you sure you want to archive this data?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "OK",
//           onPress: () => updateArchiveStatus(item.lastAppointmentId, true)
//         }
//       ]
//     );
//   };

//   const handleUnarchive = (item) => {
//     Alert.alert(
//       "Unarchive Confirmation",
//       "Are you sure you want to restore this customer?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "OK",
//           onPress: () => updateArchiveStatus(item.lastAppointmentId, false)
//         }
//       ]
//     );
//   };

//   const toggleArchiveView = () => {
//     setShowArchive(prev => !prev);
//   };

//   return (
//     <>
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <Text style={styles.title}>
//             {showArchive 
//               ? `Archived Customers (${archivedUsers.length})`
//               : `Inactive Customers (${inactiveUsers.length})`
//             }
//           </Text>
//           <TouchableOpacity onPress={toggleArchiveView} style={styles.archiveButtons}>
//             <Text style={styles.archiveButtonText}>
//               {showArchive ? "Show Active" : "Show Archive"}
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {loading ? (
//           <ActivityIndicator size="large" color="#2196F3" />
//         ) : (
//           <View style={styles.scrollContainer}>
//             <FlatList
//               data={showArchive ? archivedUsers : inactiveUsers}
//               keyExtractor={(item) => item.id.toString()}
//               ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
//               renderItem={({ item }) => (
//                 <View style={styles.itemContainer}>
//                   <View style={styles.card}>
//                     <Text style={styles.userName}>{item.full_name}</Text>
//                     <Text style={styles.userInfo}>{item.mobile_number}</Text>
//                     <Text style={styles.userInfo}>
//                       Last Visit: {item.lastAppointmentDate || "N/A"}
//                     </Text>
//                   </View>
//                   <View style={styles.actions}>
//                     <TouchableOpacity 
//                       style={[styles.iconButton, showArchive ? styles.unarchiveButton : styles.archiveButton]}
//                       onPress={() => showArchive ? handleUnarchive(item) : handleArchive(item)}
//                     >
//                       <FontAwesome 
//                         name={showArchive ? "eye-slash" : "eye"} 
//                         size={16} 
//                         color="white" 
//                       />
//                     </TouchableOpacity>
//                     <TouchableOpacity
//                       style={[styles.iconButton, styles.callButton]}
//                       onPress={() => {
//                         if (item.mobile_number) {
//                           Linking.openURL(`tel:${item.mobile_number}`);
//                         } else {
//                           Alert.alert("Error", "Phone number not available");
//                         }
//                       }}
//                     >
//                       <FontAwesome name="phone" size={16} color="white" />
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               )}
//             />
//           </View>
//         )}
//       </View>
//       <Footer />
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   archiveButtons:{
// color: 'white',
// backgroundColor: '#2196F3',
// paddingVertical: 6,
// paddingHorizontal: 12,
// borderRadius: 20,
//   },
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 15,
//   },
//   title: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2196F3',
//   },
//   archiveButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 20,
//   },
//   archiveButtonText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   scrollContainer: {
//     flex: 1,
//     marginBottom: 10,
//   },
//   itemContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   card: {
//     flex: 1,
//     backgroundColor: '#e3f2fd',
//     borderRadius: 8,
//     padding: 12,
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: '#90caf9',
//   },
//   userName: {
//     fontSize: 14,
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   userInfo: {
//     fontSize: 12,
//     color: '#424242',
//   },
//   actions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   iconButton: {
//     width: 30,
//     height: 30,
//     borderRadius: 15,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   callButton: {
//     backgroundColor: '#4CAF50',
//   },
//   archiveButton: {
//     backgroundColor: '#FF9800',
//   },
//   unarchiveButton: {
//     backgroundColor: '#9C27B0',
//   },
//   emptyText: {
//     textAlign: 'center',
//     color: '#757575',
//     marginTop: 20,
//   },
// });









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
import FontAwesome from "react-native-vector-icons/FontAwesome";

export default function Customer() {
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);

  const API_APPOINTMENTS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Appointments";
  const API_USERS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/User";
  const API_AGENTS = "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Agents";
  const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

const fetchAppointments = async () => {
  try {
    setLoading(true);
    
    // Always fetch ALL appointments (agent filtering happens later)
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

    // 1. Group all appointments by user
    const userAppointmentsMap = {};
    allAppointments.forEach(a => {
      if (!userAppointmentsMap[a.user_id]) userAppointmentsMap[a.user_id] = [];
      userAppointmentsMap[a.user_id].push(a);
    });

    const inactiveUsers = [];
    const archivedUsers = [];

    // 2. Process each user's full appointment history
    for (const userId in userAppointmentsMap) {
      const allUserApps = userAppointmentsMap[userId];
      
      // 3. Find user's latest appointment (across all agents)
      const latestAppointment = allUserApps.reduce((latest, current) => 
        new Date(current.appointment_date) > new Date(latest.appointment_date) 
          ? current 
          : latest
      );

      // 4. Check if user has appointments with selected agent
      const hasSelectedAgentApp = selectedAgents.length === 0 || 
        allUserApps.some(a => a.agent_id === selectedAgents[0]);

      if (!hasSelectedAgentApp) continue;

      const user = users.find(u => u.id === Number(userId));
      if (!user) continue;

      const userEntry = {
        ...user,
        lastAppointmentDate: formatDate(latestAppointment.appointment_date),
        lastAppointmentId: latestAppointment.id,
      };

      // 5. Categorize based on latest appointment status
      if (latestAppointment.is_archive) {
        archivedUsers.push(userEntry);
      } else if (new Date(latestAppointment.appointment_date) < twoMonthsAgo) {
        inactiveUsers.push(userEntry);
      }
    }

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
      const res = await fetch(
        `${API_APPOINTMENTS}?id=eq.${appointmentId}`,
        {
          method: "PATCH",
          headers: {
            apikey: API_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ is_archive: isArchive }),
        }
      );
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

  const toggleArchiveView = () => setShowArchive((prev) => !prev);

  const AgentList = () => (
    <View style={styles.agentListContainer}>
      <Text style={{ fontSize: 11, marginBottom: 10, marginLeft: 5 }}>
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
          <Text style={styles.agentName}>All</Text>
        </TouchableOpacity>
        {agents.map((agent) => (
          <TouchableOpacity
            key={agent.id}
            style={[
              styles.agentCard,
              selectedAgents[0] === agent.id && styles.selectedAgentCard,
            ]}
            onPress={() => setSelectedAgents([agent.id])}
          >
            <Text style={styles.agentName}>{agent.full_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {showArchive
              ? `Archived Customers (${archivedUsers.length})`
              : `Inactive Customers (${inactiveUsers.length})`}
          </Text>
          <TouchableOpacity onPress={toggleArchiveView} style={styles.archiveButtons}>
            <Text style={styles.archiveButtonText}>
              {showArchive ? "Show Active" : "Show Archive"}
            </Text>
          </TouchableOpacity>
        </View>
        <AgentList />
        {loading ? (
          <ActivityIndicator size="large" color="#2196F3" />
        ) : (
          <FlatList
            data={showArchive ? archivedUsers : inactiveUsers}
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
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      showArchive ? styles.unarchiveButton : styles.archiveButton,
                    ]}
                    onPress={() =>
                      showArchive ? handleUnarchive(item) : handleArchive(item)
                    }
                  >
                    <FontAwesome
                      name={showArchive ? "eye-slash" : "eye"}
                      size={16}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, styles.callButton]}
                    onPress={() => Linking.openURL(`tel:${item.mobile_number}`)}
                  >
                    <FontAwesome name="phone" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
      <Footer />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "600", color: "#2196F3" },
  archiveButtons: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  archiveButtonText: { color: "white", fontSize: 12, fontWeight: "500" },
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
  userName: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
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
    borderRadius: 20,
  },
  selectedAgentCard: {
    backgroundColor: "#2196F3",
  },
  agentName: {
    fontSize: 12,
    color: "#333",
  },
  selectedAgentName: {
    color: "#fff",
  },
});

