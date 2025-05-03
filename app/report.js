import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import Footer from "./footer";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const supabase = createClient(
  "https://cqdinxweotvfamknmgap.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U"
);

const Report = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [totalSales, setTotalSales] = useState(0);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [totalOnline, setTotalOnline] = useState(0);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [totalCompletedAppointments, setTotalCompletedAppointments] =
    useState(0); // New state for completed appointments
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [users, setUsers] = useState([]); // Add a state to store users
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    items: [],
    discount: {
      amount: 0,
      type: null,
    },
  });
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedType, setSelectedType] = useState("today"); // default selection
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Function to update password
  const updatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirm password don't match");
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // First, verify current password
      const { data: settings, error } = await supabase
        .from("Setting")
        .select("*")
        .eq("key", "password")
        .single();

      if (error) throw error;

      if (settings.value !== currentPassword) {
        Alert.alert("Error", "Current password is incorrect");
        setIsUpdatingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from("Setting")
        .update({ value: newPassword })
        .eq("key", "password");

      if (updateError) throw updateError;

      Alert.alert("Success", "Password updated successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Error", "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // ... (keep all your existing functions)

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("User")
        .select("id, full_name");
      if (error) throw error;
      setUsers(data); // Store users data
    } catch (error) {
      console.error("Error fetching users:", error.message);
    }
  };

  useEffect(() => {
    fetchUsers(); // Fetch users data when component mounts
  }, []);

  const getUserFullName = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? user.full_name : "Unknown"; // Return the full name or 'Unknown' if not found
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchTotalSales();
    } catch (error) {
      console.error("Refresh failed:", error);
    }
    setRefreshing(false);
  };

  const fetchTotalSales = async () => {
    if (!startDate || !endDate) return;

    try {
      const startISO = new Date(startDate.setHours(0, 0, 0, 0)).toISOString();
      const endISO = new Date(endDate.setHours(23, 59, 59, 999)).toISOString();

      // Fetch Orders
      let orderQuery = supabase
        .from("Orders")
        .select(
          "grand_total, cash_amount, card_amount, online_amount, is_payment, created_at, agentId, discount_amount, discount_type"
        )
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .eq("is_payment", true);

      if (selectedAgents.length > 0) {
        orderQuery = orderQuery.in("agentId", selectedAgents);
      }

      const { data: orders, error: orderError } = await orderQuery;
      if (orderError)
        throw new Error("Order fetch error: " + orderError.message);

      const totals = orders.reduce(
        (acc, order) => ({
          totalSales: acc.totalSales + (order.grand_total || 0),
          totalCash: acc.totalCash + (order.cash_amount || 0),
          totalCard: acc.totalCard + (order.card_amount || 0),
          totalOnline: acc.totalOnline + (order.online_amount || 0),
        }),
        { totalSales: 0, totalCash: 0, totalCard: 0, totalOnline: 0 }
      );

      setTotalSales(totals.totalSales);
      setTotalCash(totals.totalCash);
      setTotalCard(totals.totalCard);
      setTotalOnline(totals.totalOnline);

      // Fetch Appointments with related Orders
      let appointmentQuery = supabase
        .from("Appointments")
        .select(
          `
          id, 
          user_id, 
          created_at, 
          agent_id,
          start_time,
          end_time,
          Orders(grand_total, discount_amount, discount_type)
        `
        )
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .eq("is_complete", true);

      if (selectedAgents.length > 0) {
        appointmentQuery = appointmentQuery.in("agent_id", selectedAgents);
      }

      const { data: appointments, error: appointmentError } =
        await appointmentQuery;
      if (appointmentError)
        throw new Error("Appointment fetch error: " + appointmentError.message);

      setTotalCompletedAppointments(appointments.length);
      setCompletedAppointments(appointments);
      console.log("Completed Appointments:", appointments);
    } catch (error) {
      console.error("Error in fetchTotalSales:", error.message);
    }
  };

  function formatTo12Hour(timeString) {
    const [hours, minutes, seconds] = timeString.split(":");
    const date = new Date();
    date.setHours(hours, minutes, seconds);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  useEffect(() => {
    if (startDate && endDate) {
      fetchTotalSales();
    }
  }, [startDate, endDate, selectedAgents]);

  const setRange = (rangeType) => {
    const today = new Date();
    let start, end;

    switch (rangeType) {
      case "today":
        start = new Date(today);
        end = new Date(today);
        break;

      case "this_week":
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        const lastDayOfWeek = new Date(today);
        lastDayOfWeek.setDate(today.getDate() + (6 - today.getDay()));
        start = firstDayOfWeek;
        end = lastDayOfWeek;
        break;

      case "last_week":
        const prevWeekStart = new Date(today);
        prevWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const prevWeekEnd = new Date(prevWeekStart);
        prevWeekEnd.setDate(prevWeekStart.getDate() + 6);
        start = prevWeekStart;
        end = prevWeekEnd;
        break;

      case "this_month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case "last_month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;

      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(
        "https://cqdinxweotvfamknmgap.supabase.co/rest/v1/Agents?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U"
      );
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error.message);
    }
  };

  useEffect(() => {
    fetchAgents(); // Fetch agents data on component mount
  }, []);
  const fetchOrderDetailsByAppointment = async (appointmentId, agentId) => {
    try {
      // Fetch order details
      const { data: orderDetails, error: detailsError } = await supabase
        .from("Order_details")
        .select("*")
        .eq("appointment_id", appointmentId);

      if (detailsError) throw detailsError;

      // Fetch the order to get discount information
      const { data: orderData, error: orderError } = await supabase
        .from("Orders")
        .select("discount_amount, discount_type")
        .eq("appointment_id", appointmentId)
        .single();

      if (orderError) throw orderError;

      // Set the state with the new structure
      setOrderDetails({
        items: orderDetails || [],
        discount: {
          amount: orderData?.discount_amount || 0,
          type: orderData?.discount_type || null,
        },
      });
      setShowOrderDetails(true);
      setSelectedAppointmentId(appointmentId);
      setSelectedAgentId(agentId);
    } catch (error) {
      console.error("Error fetching order details:", error.message);
    }
  };
  const getAgentName = (agentId) => {
    const agent = agents.find((agent) => agent.id === agentId);
    return agent ? agent.full_name : "Unknown Agent"; // Use full_name
  };
  const calculateModalGrandTotal = () => {
    return orderDetails.items.reduce(
      (total, item) => total + (item.menu_rate_total || 0),
      0
    );
  };

  return (
    <>
      <ScrollView
        // contentContainerStyle={styles.container}
        // refreshControl={
        //   <RefreshControl
        //     refreshing={refreshing}
        //     onRefresh={handleRefresh}
        //     colors={["#007bff"]}
        //     tintColor="#007bff"
        //     progressBackgroundColor="#fff"
        //     height={Platform.OS === "ios" ? 0 : 0}
        //     progressViewOffset={0}
        //   />
        // }
        contentContainerStyle={styles.container}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>📊 Sales Report</Text>
          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
            style={styles.settingsButton}
          >
            <Feather name="settings" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        <Modal
          visible={showPasswordModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.passwordModalContainer}>
              <TouchableOpacity
                style={styles.closeIconContainer}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <FontAwesome name="close" size={20} color="red" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Change Password</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Current Password{" "}
                  <Text style={{ color: "red", marginLeft: 2 }}>*</Text>
                </Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Feather
                      name={showCurrentPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  New Password{" "}
                  <Text style={{ color: "red", marginLeft: 2 }}>*</Text>
                </Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Feather
                      name={showNewPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Confirm Password{" "}
                  <Text style={{ color: "red", marginLeft: 2 }}>*</Text>
                </Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.updateButton}
                onPress={updatePassword}
                disabled={isUpdatingPassword}
              >
                <Text style={styles.updateButtonText}>
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.filterContainer}>
          {[
            { label: "Today", type: "today" },
            { label: "This Week", type: "this_week" },
            { label: "Last Week", type: "last_week" },
            { label: "This Month", type: "this_month" },
            { label: "Last Month", type: "last_month" },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.type}
              style={[
                styles.filterButton,
                selectedType === btn.type && styles.selectedFilterButton, // Highlight selected
              ]}
              onPress={() => {
                setSelectedType(btn.type); // Update selected type
                setRange(btn.type); // Your existing function
              }}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === btn.type && styles.selectedFilterButtonText,
                ]}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateContainer}>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            <Feather name="calendar" size={15} color="#6c757d" />
            <Text style={styles.dateButtonText}>
              {startDate.toDateString()}
            </Text>
            <Feather name="check-circle" size={15} color="#28a745" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={styles.dateButton}
          >
            <Feather name="calendar" size={15} color="#6c757d" />
            <Text style={styles.dateButtonText}>{endDate.toDateString()}</Text>
            <Feather name="check-circle" size={15} color="#28a745" />
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowStartPicker(false);
                date && setStartDate(date);
              }}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, date) => {
                setShowEndPicker(false);
                date && setEndDate(date);
              }}
            />
          )}
        </View>

        {/* Agent List Section */}
        <View style={styles.agentListContainer}>
          <Text style={{ fontSize: 11, marginBottom: 10, marginLeft: 5 }}>
            Choose Professional
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <TouchableOpacity
              style={[
                styles.agentCard,
                selectedAgents.length === 0 && styles.selectedAgentCard,
              ]}
              onPress={() => {
                setSelectedAgents([]);
              }}
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
                  style={[
                    styles.agentCard,
                    isSelected && styles.selectedAgentCard,
                  ]}
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
        <View
          style={{
            marginTop: 10,
            width: "100%",
            borderColor: "#ddd",
            borderWidth: 1,
            paddingTop: 10,
            borderRadius: 10,
          }}
        >
          <Text style={styles.tableAppTitle}>
            Total Completed Appointments {totalCompletedAppointments}
          </Text>

          {/* Table Header */}
          {completedAppointments.length === 0 ? (
            <View></View>
          ) : (
            <View
              style={{
                flexDirection: "row",
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderColor: "#ccc",
                backgroundColor: "#f0f0f0",
              }}
            >
              <Text style={{ width: "37%", fontSize: 12 }}>User</Text>
              <Text style={{ width: "38%", fontSize: 12 }}>Time</Text>
              <Text style={{ width: "16%", fontSize: 12 }}>Total</Text>
              <Text style={{ width: "11%", fontSize: 12 }}>View</Text>
            </View>
          )}

          <ScrollView style={{ maxHeight: 240 }}>
            {/* Table Rows */}
            {completedAppointments.map((item) => (
              <View
                key={item.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderBottomWidth: 1,
                  borderColor: "#eee",
                }}
              >
                <Text style={{ width: "37%", fontSize: 11 }}>
                  {getUserFullName(item.user_id)}
                </Text>

                <Text style={{ width: "39%", fontSize: 11 }}>
                  {formatTo12Hour(item.start_time)} -{" "}
                  {formatTo12Hour(item.end_time)}
                </Text>

                <Text style={{ width: "16%", fontSize: 11 }}>
                  {item.Orders?.reduce(
                    (acc, order) => acc + (order.grand_total || 0),
                    0
                  )}
                </Text>

                <View style={{ width: "5%", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() =>
                      fetchOrderDetailsByAppointment(item.id, item.agent_id)
                    }
                  >
                    <FontAwesome name="eye" size={17} color="#007bff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <Modal
          visible={showOrderDetails}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowOrderDetails(false);
            setOrderDetails({ items: [], discount: { amount: 0, type: null } });
            setSelectedAppointmentId(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                style={styles.closeIconContainer}
                onPress={() => {
                  setShowOrderDetails(false);
                  setOrderDetails({
                    items: [],
                    discount: { amount: 0, type: null },
                  });
                  setSelectedAppointmentId(null);
                }}
              >
                <FontAwesome name="close" size={20} color="red" />
              </TouchableOpacity>

              {orderDetails.items && orderDetails.items.length === 0 ? (
                <Text>No order details found.</Text>
              ) : (
                <>
                  <Text
                    style={{
                      marginBottom: 5,
                      color: "#007bff",
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    Order Details
                  </Text>

                  {selectedAgents.length === 0 && (
                    <Text
                      style={{
                        marginBottom: 13,
                        color: "#007bff",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Handle by {getAgentName(selectedAgentId)}
                    </Text>
                  )}

                  {/* Render each order detail */}
                  {orderDetails.items.map((detail, index) => (
                    <View key={index} style={styles.appointmentTable}>
                      <Text style={{ width: "60%" }}>{detail.menu_name}</Text>
                      <Text>x {detail.qty_sold}</Text>
                      <Text>₹{detail.menu_rate_total}</Text>
                    </View>
                  ))}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingHorizontal: 10,
                      borderTopWidth: 1,
                      paddingTop: 10,
                    }}
                  >
                    <Text>Total:</Text>
                    <Text> ₹ {calculateModalGrandTotal()}</Text>
                  </View>

                  {/* Show Discount if it exists */}
                  {orderDetails.discount.amount > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingHorizontal: 10,
                        marginTop: 10,
                        borderTopWidth: 1,
                        paddingTop: 10,
                      }}
                    >
                      <Text>Discount: </Text>
                      <Text
                        style={{
                          color:
                            orderDetails.discount.type === "add"
                              ? "green"
                              : "red",
                          marginLeft: 5,
                        }}
                      >
                        ₹ {orderDetails.discount.amount}
                      </Text>
                    </View>
                  )}

                  {/* Calculate and show Grand Total */}
                  <View
                    style={{ marginTop: 10, borderTopWidth: 1, paddingTop: 10 }}
                  >
                    <Text
                      style={{
                        fontWeight: "bold",
                        fontSize: 18,
                        textAlign: "right",
                        color: "#007bff",
                        paddingRight: 7,
                      }}
                    >
                      Grand Total: ₹{" "}
                      {orderDetails.items.reduce(
                        (total, item) => total + (item.menu_rate_total || 0),
                        0
                      ) -
                        (orderDetails.discount.type === "subtract"
                          ? orderDetails.discount.amount
                          : 0) +
                        (orderDetails.discount.type === "add"
                          ? orderDetails.discount.amount
                          : 0)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
      <View style={styles.tableContainer}>
        {/* Total Sales */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹ {totalSales}</Text>
        </View>

        {/* Payment Breakdown Row */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Cash</Text>
            <Text style={styles.paymentAmount}>₹ {totalCash}</Text>
          </View>

          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Card</Text>
            <Text style={styles.paymentAmount}>₹ {totalCard}</Text>
          </View>

          <View style={styles.paymentBox}>
            <Text style={styles.paymentLabel}>Online</Text>
            <Text style={styles.paymentAmount}>₹ {totalOnline}</Text>
          </View>
        </View>
      </View>

      <Footer />
    </>
  );
};

const styles = StyleSheet.create({
  passwordInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  passwordInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
    position: "relative",
  },
  settingsButton: {
    position: "absolute",
    right: 0,
    padding: 10,
  },
  passwordModalContainer: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#007bff",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    marginBottom: 5,
    fontSize: 14,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  tableContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    position: "absolute",
    bottom: 65,
  },

  tableTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },

  totalLabel: {
    fontSize: 30,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#007bff",
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#007bff",
    marginRight: 10,
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  paymentBox: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  paymentLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },

  paymentAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
    marginTop: 4,
  },

  agentCard: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },

  selectedAgentCard: {
    borderColor: "#007bff",
    borderWidth: 1,
  },

  agentName: {
    fontSize: 11,
  },

  selectedAgentName: {
    color: "#007bff",
  },

  agentButtonText: {
    fontSize: 12,
    color: "#007BFF",
    marginBottom: 3,
  },
  agentButton: {
    paddingVertical: 8,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100, // Add a minimum width to make buttons look consistent
  },
  tableAppTitle: {
    fontSize: 13,
    marginBottom: 15,
    textAlign: "center",
    color: "#007bff",
  },

  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  appointmentTable: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  userName: {
    fontSize: 12,
    color: "#333",
  },
  timeRange: {
    fontSize: 12,
    color: "#555",
    width: "100%",
  },
  grandTotal: {
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: "#007bff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },

  actionButton: {
    width: 25, // Set fixed width
    height: 25, // Set fixed height
    borderRadius: 20, // Makes it circular
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5, // Add spacing between buttons
  },
  completeButton: {
    borderColor: "#007bff",
    borderWidth: 1,
    marginBottom: 2,
  },
  closeIconContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },

  agentListContainer: {
    width: "100%",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 6,
    paddingTop: 6,
    marginTop: 5,
  },
  agentListTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },

  agentDetail: {
    fontSize: 12,
    color: "#6c757d",
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 10,
    marginTop: 15,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginHorizontal: 3,
  },

  filterButtonText: {
    color: "#000",
    fontSize: 10,
  },

  selectedFilterButton: {
    borderColor: "#007bff",
    borderWidth: 1,
  },

  selectedFilterButtonText: {
    color: "#007bff",
  },

  container: {
    padding: 10,
    backgroundColor: "#fff",
    // backgroundColor: "#f8f9fa",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
  },
  dateContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "48%",
  },

  dateButtonText: {
    flex: 1,
    marginLeft: 5,
    fontSize: 12,
    color: "#495057",
  },
  salesCard: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 16,
    marginTop: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    width: "100%",
  },
  salesTitle: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  currencySymbol: {
    fontSize: 28,
    color: "#28a745",
    marginRight: 5,
    fontWeight: "600",
  },
  amount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2c3e50",
  },
  dateRangeText: {
    color: "#868e96",
    fontSize: 12,
    marginTop: 5,
  },

  tableTitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 15,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  cell: {
    fontSize: 12,
    textAlign: "left",
  },
});

export default Report;
