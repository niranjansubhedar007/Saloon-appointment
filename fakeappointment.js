import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { createClient } from "@supabase/supabase-js";

import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Footer from "./footer";
// Initialize Supabase
const supabaseUrl = "https://cqdinxweotvfamknmgap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Appointment() {
  const [modalVisible, setModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [savedRecipient, setSavedRecipient] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [recipientList, setRecipientList] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]); // For search filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentCalendarModalVisible, setAgentCalendarModalVisible] =
    useState(false);
  const [users, setUsers] = useState([]);
  const [unavailableDates, setUnavailableDates] = useState([]);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [bookingError, setBookingError] = useState(""); // State for error message
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  // Handle Start Time Selection
  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartPicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Ensure 24-hour format
      });

      console.log("Formatted Start Time:", formattedTime);

      setStartTime(selectedTime);
      setSelectedDateTime((prev) => ({
        ...prev,
        startTime: formattedTime,
      }));
    }
  };
  const fetchUnavailableDates = async (agentId) => {
    if (!agentId) return;

    try {
      const { data, error } = await supabase
        .from("Unavailability")
        .select("start_date, end_date")
        .eq("agent_id", agentId);

      if (error) throw error;

      // Convert start_date & end_date into an array of unavailable dates
      const unavailableDays = data.flatMap(({ start_date, end_date }) => {
        const start = new Date(start_date);
        const end = new Date(end_date);
        const dates = [];

        while (start <= end) {
          dates.push(start.toISOString().split("T")[0]); // Convert to YYYY-MM-DD
          start.setDate(start.getDate() + 1);
        }

        return dates;
      });

      setUnavailableDates(unavailableDays);
    } catch (error) {
      console.error("Error fetching unavailable dates:", error.message);
    }
  };
  useEffect(() => {
    if (selectedAgent) {
      fetchUnavailableDates(selectedAgent.id);
    }
  }, [selectedAgent]);
  // Handle End Time Selection
  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndPicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Ensure 24-hour format
      });

      console.log("Formatted End Time:", formattedTime);

      setEndTime(selectedTime);
      setSelectedDateTime((prev) => ({
        ...prev,
        endTime: formattedTime,
      }));
    }
  };
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("User")
        .select("id, full_name, mobile_number");
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user.full_name;
    return acc;
  }, {});

  const userMapNumber = users.reduce((acc, user) => {
    acc[user.id] = user.mobile_number;
    return acc;
  }, {});
  const getDaytimePeriod = () => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) return "AM"; // Morning: 6 AM - 11:59 AM
    if (hours >= 12 && hours < 18) return "PM"; // Afternoon: 12 PM - 5:59 PM
    return "AM"; // Default fallback (early morning or after evening)
  };

  // State variables
  const [startPeriod, setStartPeriod] = useState(getDaytimePeriod());
  const [endPeriod, setEndPeriod] = useState(getDaytimePeriod());
  const [appointments, setAppointments] = useState([]);

  const fetchAppointments = async (agentId, selectedDate) => {
    try {
      // 1. Fetch appointments
      const { data: appointmentsData, error: appointmentsError } =
        await supabase
          .from("Appointments")
          .select("*")
          .eq("agent_id", agentId)
          .eq("appointment_date", selectedDate);

      if (appointmentsError) throw appointmentsError;

      // 2. Get appointment IDs
      const appointmentIds = appointmentsData.map((a) => a.id);

      // 3. Fetch related orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("Orders")
        .select("appointment_id, is_payment")
        .in("appointment_id", appointmentIds);

      if (ordersError) throw ordersError;

      // 4. Filter appointments with all orders paid
      const filteredAppointments = appointmentsData.filter((appointment) => {
        const appointmentOrders = ordersData.filter(
          (order) => order.appointment_id === appointment.id
        );

        // Keep appointment if:
        // - Has no orders
        // - Has at least one unpaid order
        return (
          appointmentOrders.length === 0 ||
          !appointmentOrders.every((o) => o.is_payment)
        );
      });

      setAppointments(filteredAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error.message);
      setAppointments([]);
    }
  };
  useEffect(() => {
    if (selectedAgent && selectedDateTime?.date) {
      fetchAppointments(selectedAgent.id, selectedDateTime.date);
    }
  }, [selectedAgent, selectedDateTime?.date]); // Trigger on agent/date change

  useEffect(() => {
    if (agentCalendarModalVisible) {
      setStartPeriod(getDaytimePeriod());
      setEndPeriod(getDaytimePeriod());
    }
  }, [agentCalendarModalVisible]);

  const convertTo24HourFormat = (time) => {
    console.log("Raw input time:", time); // Debug Log

    if (!time || typeof time !== "string") {
      console.error("Time is empty or not a string:", time);
      return null;
    }

    // Remove any non-numeric characters except ":"
    time = time.replace(/[^\d:]/g, "").trim();

    let [hours, minutes] = time.split(":").map(Number);

    console.log("Parsed Hours:", hours, "Minutes:", minutes); // Debug Log

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      console.error("Invalid time format:", { hours, minutes });
      Alert.alert(
        "Invalid Time",
        "Please select a valid time using the time picker."
      );
      return null;
    }

    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;

    console.log("Final formatted time:", formattedTime); // Debug Log

    return formattedTime;
  };

  const handleConfirmBooking = async () => {
    setBookingError("");

    if (
      !selectedDateTime?.date ||
      !selectedDateTime?.startTime ||
      !selectedDateTime?.endTime
    ) {
      setBookingError("Please select a valid date and time.");
      return;
    }

    const userId = savedRecipient?.id;
    const agentId = selectedAgent?.id;

    if (!userId || !agentId) {
      setBookingError("User or Agent information is missing.");
      return;
    }

    // Convert times properly
    const formattedStartTime = convertTo24HourFormat(
      selectedDateTime.startTime
    );
    const formattedEndTime = convertTo24HourFormat(selectedDateTime.endTime);

    if (!formattedStartTime || !formattedEndTime) {
      setBookingError("Invalid time format. Please select time again.");
      return;
    }

    if (selectedProducts.length === 0) {
      setBookingError("Please select at least one product.");
      return;
    }

    try {
      // Fetch existing appointments for the agent on the same date
      const { data: existingAppointments, error: fetchError } = await supabase
        .from("Appointments")
        .select("start_time, end_time")
        .eq("agent_id", agentId)
        .eq("appointment_date", selectedDateTime.date);

      if (fetchError) throw fetchError;

      const newStartTime = new Date(`1970-01-01T${formattedStartTime}:00`);
      const newEndTime = new Date(`1970-01-01T${formattedEndTime}:00`);

      // Check for overlapping time slots
      const isOverlap = existingAppointments.some((appt) => {
        const existingStart = new Date(`1970-01-01T${appt.start_time}`);
        const existingEnd = new Date(`1970-01-01T${appt.end_time}`);
        return (
          (newStartTime >= existingStart && newStartTime < existingEnd) ||
          (newEndTime > existingStart && newEndTime <= existingEnd) ||
          (newStartTime <= existingStart && newEndTime >= existingEnd)
        );
      });

      if (isOverlap) {
        setBookingError(
          "This time slot is already booked. Please select another."
        );
        return;
      }

      // Insert new appointment
      const { data: appointmentData, error: insertError } = await supabase
        .from("Appointments")
        .insert([
          {
            user_id: userId,
            agent_id: agentId,
            status: selectedDateTime.status,
            appointment_date: selectedDateTime.date,
            start_time: formattedStartTime + ":00",
            end_time: formattedEndTime + ":00",
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;
      const appointmentId = appointmentData.id;

      // Fetch last order number
      const { data: lastOrder, error: fetchOrderError } = await supabase
        .from("Orders")
        .select("order_no")
        .order("id", { ascending: false })
        .limit(1);

      if (fetchOrderError) throw fetchOrderError;
      const nextOrderNo =
        lastOrder.length > 0 ? parseInt(lastOrder[0].order_no, 10) + 1 : 1;

      const currentDate = new Date().toISOString().split("T")[0];
      const currentTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      const totalQuantity = selectedProducts.reduce(
        (sum, product) => sum + product.quantity,
        0
      );
      const subtotal = selectedProducts.reduce(
        (sum, product) => sum + product.quantity * product.Price,
        0
      );
      const cgst = 0,
        sgst = 0;
      const grandTotal = subtotal + cgst + sgst;

      // Insert new order
      const { data: orderData, error: orderError } = await supabase
        .from("Orders")
        .insert([
          {
            order_date: currentDate,
            order_time: currentTime,
            order_no: nextOrderNo,
            subtotal,
            grand_total: grandTotal,
            cgst,
            sgst,
            total_items: totalQuantity,
            is_print: false,
            agentId: agentId,
            appointment_id: appointmentId,
          },
        ])
        .select("id, order_no")
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;
      const orderNo = orderData.order_no;

      // Insert into Order_details
      const orderDetailsData = selectedProducts.map((product) => ({
        order_id: orderId,
        order_no: orderNo,
        menu_name: product.Name,
        marathi_name: product.Marathi_Name,
        qty_sold: product.quantity,
        menu_rate: product.Price,
        menu_rate_total: product.quantity * product.Price,
        appointment_id: appointmentId,
      }));

      const { error: orderDetailsError } = await supabase
        .from("Order_details")
        .insert(orderDetailsData);

      if (orderDetailsError) throw orderDetailsError;

      setSelectedProducts([]);
      setAgentCalendarModalVisible(false);
      Alert.alert("Success", `Order #${orderNo} placed successfully!`);
    } catch (error) {
      console.error("Supabase error:", error.message);
      setBookingError("Failed to book appointment and order. Try again.");
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("Agents")
        .select("id,full_name, mobile_number");

      if (error) throw error;

      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error.message);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const capitalizeWords = (text) =>
    text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const fetchLatestUser = async () => {
    try {
      // First, check if there's a saved recipient in AsyncStorage
      const savedData = await AsyncStorage.getItem("savedRecipient");
      if (savedData) {
        setSavedRecipient(JSON.parse(savedData));
        return; // Exit early if data is found in AsyncStorage
      }
      console.log("savedData", savedData);

      // Otherwise, fetch from Supabase
      const { data, error } = await supabase
        .from("User")
        .select("id, full_name, mobile_number")
        .order("id", { ascending: false })
        .limit(1);

      if (error) throw error;
      console.log("data", data);

      if (data.length > 0) {
        const latestUser = {
          id: data[0].id,
          name: data[0].full_name,
          mobile: data[0].mobile_number,
        };

        setSavedRecipient(latestUser);
        await AsyncStorage.setItem(
          "savedRecipient",
          JSON.stringify(latestUser)
        );
      }
    } catch (error) {
      console.error("Error fetching user:", error.message);
    }
  };

  useEffect(() => {
    fetchLatestUser();
  }, []);
  const handleProductPress = (product) => {
    setSelectedProducts((prevSelected) => {
      const existingProduct = prevSelected.find((p) => p.id === product.id);
      console.log("existingProduct", existingProduct);

      if (existingProduct) {
        return prevSelected.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        return [...prevSelected, { ...product, quantity: 1 }];
      }
    });
  };

  const handleAddDetails = async () => {
    if (!recipientName || !mobileNumber) {
      Alert.alert("Error", "Please fill in both fields.");
      return;
    }

    try {
      const formattedName = capitalizeWords(recipientName);

      const { error } = await supabase
        .from("User")
        .insert([{ full_name: formattedName, mobile_number: mobileNumber }]);

      if (error) throw error;

      setSavedRecipient({ name: formattedName, mobile: mobileNumber });
      Alert.alert("Success", "Recipient details added successfully!");
      setModalVisible(false);
      setRecipientName("");
      setMobileNumber("");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Fetch Product List when modal opens
  const fetchProductList = async () => {
    try {
      const { data, error } = await supabase
        .from("ProductList")
        .select('id, Name, "Marathi Name", Price, "Unique Id"') // Fixed column names
        .order("id", { ascending: true });

      if (error) throw error;
      setProducts(data);
    } catch (error) {
      console.error("Error fetching product list:", error.message);
      Alert.alert("Error", "Failed to load products.");
    }
  };

  const updateProductQuantity = (productId, newQuantity) => {
    setSelectedProducts(
      (prevSelected) =>
        prevSelected
          .map((p) =>
            p.id === productId
              ? { ...p, quantity: Math.max(0, newQuantity) }
              : p
          )
          .filter((p) => p.quantity > 0) // Remove products with 0 quantity
    );
  };
  // Utility functions
  // const generateWeekDates = () => {
  //   const dates = [];
  //   const today = new Date();
  //   for (let i = 0; i < 7; i++) {
  //     const date = new Date(today);
  //     date.setDate(today.getDate() + i);
  //     dates.push(date);
  //   }
  //   return dates;
  // };
  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const formattedDate = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD

      dates.push({
        date,
        isUnavailable: unavailableDates.includes(formattedDate), // ✅ Check if date is unavailable
      });
    }

    return dates;
  };
  const generateWeekDatesForAppointments = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const formattedDate = date.toISOString().split("T")[0]; // Convert to YYYY-MM-DD

      dates.push({
        date,
        isUnavailable: unavailableDates.includes(formattedDate), // ✅ Check if date is unavailable
      });
    }

    return dates;
  };

  const handleMobileNumberChange = async (text) => {
    setMobileNumber(text);

    if (text.length >= 3) {
      // Start searching after 3 digits
      try {
        const { data, error } = await supabase
          .from("User")
          .select("id, full_name, mobile_number")
          .ilike("mobile_number", `%${text}%`); // Search for similar numbers

        if (error) throw error;
        setFilteredRecipients(data || []);
        console.log("data", data);
      } catch (error) {
        console.error("Error fetching matching numbers:", error.message);
      }
    } else {
      setFilteredRecipients([]); // Clear dropdown if less than 3 digits
    }
  };

  const selectRecipient = async (recipient) => {
    setRecipientName(recipient.full_name);
    setMobileNumber(recipient.mobile_number);
    setFilteredRecipients([]); // Hide dropdown after selection

    const recipientData = {
      id: recipient.id,
      name: recipient.full_name,
      mobile: recipient.mobile_number,
    };

    setSavedRecipient(recipientData);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem(
        "savedRecipient",
        JSON.stringify(recipientData)
      );
    } catch (error) {
      console.error("Error saving recipient:", error);
    }

    setModalVisible(false);
  };
  const convertTo12HourFormat = (timeString) => {
    if (!timeString) return ""; // Handle empty time

    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12

    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };
  const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty date

    const [year, month, day] = dateString.split("-").map(Number);
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  };

  return (
    <>
      <View style={{ padding: 10 }}>
        <View style={styles.container}>
          <Image
            source={require("../assets/phonebgimg.png")}
            style={styles.image}
          />

          <View style={styles.textContainer}>
            <Text style={styles.text}>
              <Text style={styles.semiBold}>Booking for someone else?</Text>{" "}
              <Text
                style={styles.addDetails}
                onPress={() => {
                  setModalVisible(true);
                  setRecipientName(null);
                  setMobileNumber(null);
                }}
              >
                ADD DETAILS
              </Text>
            </Text>
            {savedRecipient && (
              <Text style={styles.savedDetails}>
                {savedRecipient.name} - {savedRecipient.mobile}
              </Text>
            )}
          </View>

          {/* Product List Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={productModalVisible}
            onRequestClose={() => setProductModalVisible(false)}
          >
            <View style={styles.modalOverlayProduct}>
              <View style={styles.modalContentProduct}>
                <TouchableOpacity
                  style={styles.closeIconContainer}
                  onPress={() => setProductModalVisible(false)}
                >
                  <FontAwesome name="close" size={20} color="red" />
                </TouchableOpacity>
                <Text style={styles.modalTitleProduct}>Select a Product</Text>

                <FlatList
                  data={products}
                  keyExtractor={(item) =>
                    item["Unique Id"] || Math.random().toString()
                  }
                  numColumns={3} // ✅ Ensures 3 columns
                  columnWrapperStyle={styles.rowContainer} // ✅ Ensures proper spacing
                  renderItem={({ item }) => {
                    const selectedProduct = selectedProducts.find(
                      (p) => p.id === item.id
                    );

                    return (
                      <View style={styles.productContainer}>
                        <TouchableOpacity
                          style={[
                            styles.productBox,
                            selectedProduct ? styles.selectedProductBox : {},
                          ]}
                          onPress={() => handleProductPress(item)}
                        >
                          <View style={styles.productHeader}>
                            <Text style={styles.uniqueId}>
                              {item["Unique Id"]}
                            </Text>
                            <Text style={styles.price}>₹{item.Price}</Text>
                          </View>
                          <View style={styles.productBody}>
                            <Text style={styles.productName}>{item.Name}</Text>
                          </View>
                          {selectedProduct && (
                            <View style={styles.counter}>
                              <Text style={styles.counterText}>
                                {selectedProduct.quantity}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                  contentContainerStyle={{ paddingHorizontal: 10 }} // ✅ Add padding
                />
              </View>
            </View>
          </Modal>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.closeIconContainer}
                  onPress={() => setModalVisible(false)}
                >
                  <FontAwesome name="close" size={20} color="red" />
                </TouchableOpacity>

                <Text style={styles.modalTitle}>Booking for someone else</Text>
                <Text style={styles.modalSubtitle}>
                  We will share booking details on recipient's mobile number.
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number"
                    keyboardType="phone-pad"
                    value={mobileNumber}
                    onChangeText={handleMobileNumberChange}
                    placeholderTextColor="#777"
                    maxLength={10}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Recipient's Name"
                    value={recipientName}
                    onChangeText={(text) => setRecipientName(text)}
                    placeholderTextColor="#777"
                  />
                  {filteredRecipients.length > 0 && (
                    <ScrollView style={styles.dropdown}>
                      {filteredRecipients.map((recipient, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => selectRecipient(recipient)}
                        >
                          <Text style={styles.dropdownText}>
                            {recipient.mobile_number} - {recipient.full_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddDetails}
                >
                  <Text style={styles.addButtonText}>Add Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        <View style={{ marginTop: 5 }}>
          <Text style={[styles.text, { marginTop: 5, paddingLeft: 5 }]}>
            <Text style={styles.semiBold}>Booking for Order?</Text>{" "}
            <Text
              style={styles.addDetails}
              onPress={async () => {
                await fetchProductList();
                setProductModalVisible(true);
              }}
            >
              ADD ORDER
            </Text>
          </Text>
        </View>

        {selectedProducts.length > 0 && (
          <View style={styles.selectedProductsContainer}>
            <ScrollView style={styles.selectedProductsScroll}>
              {selectedProducts.map((item) => (
                <View key={item.id} style={styles.selectedProductRow}>
                  {/* Product Name */}
                  <Text style={styles.selectedProductName}>{item.Name}</Text>

                  {/* Quantity Controls */}
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      onPress={() =>
                        updateProductQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <FontAwesome name="minus" size={10} color={"red"} />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.qtyInput}
                      keyboardType="numeric"
                      value={String(item.quantity)}
                      onChangeText={(value) =>
                        updateProductQuantity(item.id, parseInt(value) || 1)
                      }
                    />

                    <TouchableOpacity
                      onPress={() =>
                        updateProductQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <FontAwesome name="plus" size={10} color={"green"} />
                    </TouchableOpacity>
                  </View>

                  {/* Price */}
                  <Text style={styles.selectedProductPrice}>
                    ₹{(item.quantity * item.Price).toFixed(2)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
        <View style={styles.agentListContainer}>
          <Text style={styles.agentListTitle}>Choose Professional</Text>
          <FlatList
            data={agents}
            keyExtractor={(item) => item.mobile_number}
            horizontal
            showsHorizontalScrollIndicator={true} // Enable Scroll Indicator
            renderItem={({ item }) => {
              const isSelected = selectedAgent?.id === item.id; // Check if agent is selected

              return (
                <TouchableOpacity
                  onPress={async () => {
                    setSelectedAgent(item);
                  }}
                  onLongPress={async () => {
                    setSelectedAgent(item);

                    // Get today's date in "YYYY-MM-DD" format if no date is selected
                    const defaultDate = new Date().toISOString().split("T")[0];
                    const selectedDate = selectedDateTime?.date || defaultDate;

                    console.log(
                      "Fetching for Agent:",
                      item.id,
                      "on Date:",
                      selectedDate
                    );

                    await fetchAppointments(item.id, selectedDate); // ✅ Pass a valid date

                    setAgentCalendarModalVisible(true);
                    setSelectedDateTime({
                      date: selectedDate,
                      startTime: "",
                      endTime: "",
                      status: "Booked",
                    });
                  }}
                >
                  <View
                    style={[
                      styles.agentCard,
                      isSelected && styles.selectedAgentCard, // Apply red background if selected
                    ]}
                  >
                    <Text
                      style={[
                        styles.agentName,
                        isSelected && styles.selectedAgentName, // Apply red background if selected
                      ]}
                    >
                      {item.full_name}
                    </Text>
                    <Text
                      style={[
                        styles.agentNumber,
                        isSelected && styles.selectedAgentNumber, // Apply red background if selected
                      ]}
                    >
                      {item.mobile_number}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        {/* Agent Calendar Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={agentCalendarModalVisible}
          onRequestClose={() => setAgentCalendarModalVisible(false)}
        >
          <View style={styles.calendarModalOverlay}>
            <View style={styles.calendarModalContent}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeIconContainer}
                onPress={() => setAgentCalendarModalVisible(false)}
              >
                <FontAwesome name="close" size={20} color="red" />
              </TouchableOpacity>

              {/* Agent's Schedule Title */}
              <Text style={styles.calendarModalTitle}>
                {selectedAgent?.full_name}'s Schedule
              </Text>

              {/* Date Selection */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {generateWeekDates().map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    disabled={item.isUnavailable} // ✅ Disable click on unavailable dates
                    style={[
                      styles.dayColumn,
                      item.isUnavailable
                        ? { backgroundColor: "rgba(0,0,0,0.1)", opacity: 0.5 } // ✅ Blur effect
                        : selectedDateTime?.date ===
                          item.date.toISOString().split("T")[0]
                        ? {
                            backgroundColor: "#E1EBEE",
                            borderColor: "black",
                            borderWidth: 1,
                          }
                        : {},
                    ]}
                    onPress={() => {
                      if (!item.isUnavailable) {
                        setSelectedDateTime({
                          date: item.date.toISOString().split("T")[0],
                          startTime: "",
                          endTime: "",
                          status: "Booked",
                        });
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.dayHeader,
                        item.isUnavailable && { color: "gray" },
                      ]}
                    >
                      {item.date.toLocaleDateString("en-US", {
                        weekday: "short",
                      })}
                    </Text>
                    <Text
                      style={[
                        styles.dateHeader,
                        item.isUnavailable && { color: "gray" },
                      ]}
                    >
                      {item.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Time Selection */}
              {selectedDateTime && (
                <>
                  <View
                    style={{
                      flexDirection: "row", // Arrange items horizontally
                      justifyContent: "space-between", // Space between Start & End Time
                      alignItems: "center",
                      width: "100%", // Ensure full width for spacing
                      paddingHorizontal: 10, // Add padding for better spacing
                      marginTop: 15,
                    }}
                  >
                    {/* Start Time Selection */}
                    <View
                      style={{ alignItems: "center", flex: 1, marginRight: 10 }}
                    >
                      <Text style={{ fontSize: 11, marginBottom: 5 }}>
                        Start Time
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowStartPicker(true)}
                        style={[styles.timePickerButton, { width: "auto" }]} // Increased width
                      >
                        <Text style={styles.timePickerText}>
                          {selectedDateTime?.startTime || "Select Start Time"}
                        </Text>
                      </TouchableOpacity>

                      {showStartPicker && (
                        <DateTimePicker
                          value={startTime}
                          mode="time"
                          display={Platform.OS === "ios" ? "spinner" : "clock"}
                          is24Hour={false}
                          onChange={handleStartTimeChange}
                        />
                      )}
                    </View>

                    {/* End Time Selection */}
                    <View
                      style={{ alignItems: "center", flex: 1, marginLeft: 10 }}
                    >
                      <Text style={{ fontSize: 11, marginBottom: 5 }}>
                        End Time
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowEndPicker(true)}
                        style={[
                          styles.timePickerButton,
                          { backgroundColor: "#28A745", width: "auto" }, // Increased width
                        ]}
                      >
                        <Text style={styles.timePickerText}>
                          {selectedDateTime?.endTime || "Select End Time"}
                        </Text>
                      </TouchableOpacity>

                      {showEndPicker && (
                        <DateTimePicker
                          value={endTime}
                          mode="time"
                          display={Platform.OS === "ios" ? "spinner" : "clock"}
                          is24Hour={false}
                          onChange={handleEndTimeChange}
                        />
                      )}
                    </View>
                  </View>
                </>
              )}

              {/* Error Message */}
              {bookingError && (
                <Text style={styles.errorText}>{bookingError}</Text>
              )}

              {/* Confirm Booking Button */}
              {selectedDateTime?.startTime && selectedDateTime?.endTime && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmBooking}
                >
                  <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
        <View style={styles.appointmentContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {generateWeekDatesForAppointments().map((item, index) => (
              <TouchableOpacity
                key={index}
                disabled={item.isUnavailable} // ✅ Disable click on unavailable dates
                style={[
                  styles.dayColumn,
                  item.isUnavailable
                    ? { backgroundColor: "rgba(0,0,0,0.1)", opacity: 0.5 } // ✅ Blur effect
                    : selectedDateTime?.date ===
                      item.date.toISOString().split("T")[0]
                    ? {
                        backgroundColor: "#E1EBEE",
                        borderColor: "black",
                        borderWidth: 1,
                      }
                    : {},
                ]}
                onPress={() => {
                  if (!item.isUnavailable) {
                    setSelectedDateTime({
                      date: item.date.toISOString().split("T")[0],
                      startTime: "",
                      endTime: "",
                      status: "Booked",
                    });
                  }
                }}
              >
                <Text
                  style={[
                    styles.dayHeader,
                    item.isUnavailable && { color: "gray" },
                  ]}
                >
                  {item.date.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
                <Text
                  style={[
                    styles.dateHeader,
                    item.isUnavailable && { color: "gray" },
                  ]}
                >
                  {item.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {appointments.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 10, marginLeft: 8 }}>Appointments:</Text>
              {appointments.map((appt, index) => (
                <View key={index} style={styles.appointmentCard}>
                  <Text style={styles.appointmentText}>
                    User: {userMap[appt.user_id] || "Unknown User"}{" "}
                    {userMapNumber[appt.user_id] || "Unknown User"}
                  </Text>

                  <Text style={styles.appointmentText}>
                    Time: {convertTo12HourFormat(appt.start_time)} -{" "}
                    {convertTo12HourFormat(appt.end_time)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 10, color: "gray", marginTop: 10 }}>
              No appointments found.
            </Text>
          )}
        </View>
      </View>
      <Footer />
    </>
  );
}
const styles = StyleSheet.create({
  appointmentContainer: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    padding: 8,
  },
  selectedAgentCard: {
    borderColor: "blue",
    borderWidth: 1.5,
  },
  selectedAgentName: {
    color: "blue",
  },
  selectedAgentNumber: {
    color: "blue",
  },
  closeIconContainer: {
    alignSelf: "flex-end",
  },
  calendarModalTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },

  dayColumn: {
    width: 60,
    marginRight: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    fontSize: 10,
    marginHorizontal: 5,
  },
  timePickerButton: {
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
    width: "100%",
  },
  timePickerText: {
    color: "white",
    fontSize: 10,
  },
  errorText: {
    color: "red",
    fontSize: 10,
    textAlign: "center",
    marginTop: 10,
  },

  dayHeader: {
    fontSize: 10,
  },
  dateHeader: {
    fontSize: 11,
  },
  appointmentCard: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginTop: 5,
  },
  appointmentText: {
    fontSize: 10,
    color: "#333",
  },

  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8, // Space between elements
    width: "63%",
  },
  ampmButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#007BFF",
    borderRadius: 6,
    backgroundColor: "white",
  },
  ampmText: {
    fontSize: 10,
    color: "black",
  },
  selectedAmPm: {
    backgroundColor: "#007BFF",
  },
  selectedAmPmText: {
    color: "black",
  },

  dropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    zIndex: 10,
    maxHeight: 100,
  },
  dropdownItem: {
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownText: {
    fontSize: 10,
    color: "#333",
  },

  calendarModalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarModalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 10,
    paddingTop: 23,
    maxHeight: "80%",
  },
  calendarModalTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
  },

  confirmButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    padding: 12,
    marginTop: 15,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },

  orderContainer: {
    marginBottom: 10,
    paddingLeft: 9,
    textAlign: "center",
  },
  text: {
    fontSize: 10,
    color: "#333",
  },
  productListContent: {
    paddingHorizontal: 5,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  rowContainer: {
    justifyContent: "space-between", // ✅ Ensures even spacing in the grid
    marginBottom: 10,
  },
  productContainer: {
    flex: 1, // ✅ Ensures equal spacing between items
    alignItems: "center",
    gap: 10,
  },
  productBox: {
    width: "95%", // ✅ Makes sure it fits properly inside columns
    padding: 5,
    backgroundColor: "white",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    height: 70,
  },

  counter: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "blue",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  productBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    fontSize: 10,
    color: "#333",
    textAlign: "center",
  },
  agentListContainer: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    padding: 10,
  },
  agentListTitle: {
    fontSize: 10,
    color: "#333",
    marginBottom: 4,
  },
  agentCard: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
    backgroundColor: "#E1EBEE",
    borderColor: "#007BFF",
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 3,
  },
  agentName: {
    fontSize: 10,
    color: "#007BFF",
    marginBottom: 3,
  },
  agentNumber: {
    fontSize: 10,
    color: "#007BFF",
  },

  selectedProductsContainer: {
    marginTop: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 3,
    width: "100%",
    paddingLeft: 10,
    paddingRight: 10,
  },
  selectedProductsTitle: {
    fontSize: 10,

    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  selectedProductRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  selectedProductName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
    flex: 2,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flex: 1,
    justifyContent: "center",
  },
  qtyInput: {
    width: 40,
    textAlign: "center",
    fontSize: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
    marginHorizontal: 6,
  },
  minusBtn: {
    color: "#ff4d4d",
  },
  plusBtn: {
    color: "#007BFF",
  },
  selectedProductPrice: {
    fontSize: 10,

    flex: 1,
    textAlign: "right",
  },

  totalContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#e0f2f1",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007BFF",
    alignItems: "center",
  },

  totalText: {
    fontSize: 10,

    color: "#007BFF",
  },

  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  selectedProductBox: {
    backgroundColor: "#cce5ff", // Light blue background for selected products
    borderColor: "#007BFF", // Blue border
  },

  counterText: {
    color: "white",
    fontSize: 10,
  },

  uniqueId: {
    fontSize: 10,
    color: "#f39c12",
  },
  price: {
    fontSize: 10,
    color: "#27ae60",
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#E1EBEE",
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
  },
  image: {
    width: 31,
    height: 31,
    marginRight: 10,
  },

  semiBold: {
    fontWeight: "600",
  },
  addDetails: {
    color: "#007BFF",
    fontWeight: "600",
  },
  savedDetails: {
    fontSize: 10,
    color: "#555",
    marginTop: 5,
  },
  modalOverlay: {
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20,
    height: "30%",
  },
  modalOverlayProduct: {
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
  },
  modalContentProduct: {
    backgroundColor: "white",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 20,
    height: "82%",
  },
  closeIconContainer: {
    position: "absolute",
    top: 6,
    right: 10,
  },
  menuIconContainer: {
    position: "absolute",
    top: 6,
    right: 35,
  },
  modalTitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#333",
    marginBottom: 5,
  },
  modalTitleProduct: {
    marginTop: 5,
    fontSize: 13,
    marginLeft: 15,
    color: "#333",
    marginBottom: 7,
  },
  modalSubtitle: {
    fontSize: 10,
    color: "#555",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    fontSize: 10,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    alignItems: "center",
    padding: 10,
  },
  addButtonText: {
    color: "white",
    fontSize: 10,
  },
});
