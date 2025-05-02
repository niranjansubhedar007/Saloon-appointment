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
  TouchableWithoutFeedback,
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

export default function OwnerAppointment() {
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
  const [isSelectedeAgent, setIsSelectedAgent] = useState(false);

  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [bookingError, setBookingError] = useState(""); // State for error message
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editStartTime, setEditStartTime] = useState(new Date());
  const [editEndTime, setEditEndTime] = useState(new Date());
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);

  const handleEditStartTime = (event, selectedTime) => {
    setShowEditStartPicker(false);
    if (selectedTime) {
      setEditStartTime(selectedTime);
    }
  };

  const handleEditEndTime = (event, selectedTime) => {
    setShowEditEndPicker(false);
    if (selectedTime) {
      setEditEndTime(selectedTime);
    }
  };

  const updateAppointmentTime = async () => {
    if (!editingAppointment) return;

    const formattedStart = editStartTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const formattedEnd = editEndTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    try {
      const { error } = await supabase
        .from("Appointments")
        .update({
          start_time: formattedStart + ":00",
          end_time: formattedEnd + ":00",
        })
        .eq("id", editingAppointment.id);

      if (error) throw error;

      Alert.alert("Success", "Appointment updated successfully");
      setEditingAppointment(null);
      setIsSelectedAgent(false); // Close product modal after booking
      setSelectedDateTime((prev) => ({
        ...prev,
        startTime: formattedStart,
        endTime: formattedEnd,
      }));

      if (selectedAgent && selectedDateTime?.date) {
        await fetchAppointments(selectedAgent.id, selectedDateTime.date);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // // Handle Start Time Selection
  // const handleStartTimeChange = (event, selectedTime) => {
  //   setShowStartPicker(false);
  //   if (selectedTime) {
  //     const formattedTime = selectedTime.toLocaleTimeString("en-US", {
  //       hour: "2-digit",
  //       minute: "2-digit",
  //       hour12: false, // Ensure 24-hour format
  //     });

  //     console.log("Formatted Start Time:", formattedTime);

  //     setStartTime(selectedTime);
  //     setSelectedDateTime((prev) => ({
  //       ...prev,
  //       startTime: formattedTime,
  //     }));
  //   }
  // };
  const calculateDuration = (start, end) => {
    const diffMs = end - start;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return (
      (hours > 0 ? `${hours} hr${hours > 1 ? "s" : ""} ` : "") +
      (minutes > 0 ? `${minutes} min` : hours === 0 ? "0 min" : "")
    );
  };

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartPicker(false);
    if (selectedTime) {
      const formattedTime = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Ensure 24-hour format
      });

      console.log("Formatted Start Time:", formattedTime);

      // Calculate end time (1 hour later)
      const endTime = new Date(selectedTime);
      endTime.setHours(endTime.getHours() + 1);

      const formattedEndTime = endTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      setStartTime(selectedTime);
      setEndTime(endTime); // Update end time state

      const duration = calculateDuration(selectedTime, endTime);

      setSelectedDateTime((prev) => ({
        ...prev,
        startTime: formattedTime,
        endTime: formattedEndTime,
        duration, // save for display
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
      const duration = calculateDuration(startTime, selectedTime);
      setEndTime(selectedTime);
      setSelectedDateTime((prev) => ({
        ...prev,
        endTime: formattedTime,
        duration,
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
      setIsSelectedAgent(true); // Reset selected agent state

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

    // Clear saved recipient from AsyncStorage and state
    await AsyncStorage.removeItem("savedRecipient");
    await AsyncStorage.removeItem("recipientName");
    setSavedRecipient(null); // Clear the state immediately
    setRecipientName(""); // Reset recipient name
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
        .select("start_time, end_time, is_complete") // ✅ Include is_complete field
        .eq("agent_id", agentId)
        .eq("appointment_date", selectedDateTime.date);

      if (fetchError) throw fetchError;
      console.log("existingAppointments", existingAppointments);

      const newStartTime = new Date(`1970-01-01T${formattedStartTime}:00`);
      const newEndTime = new Date(`1970-01-01T${formattedEndTime}:00`);

      // Check for overlapping time slots only for active (not completed) appointments
      const isOverlap = existingAppointments.some((appt) => {
        if (appt.is_complete) return false; // ✅ Ignore completed appointments

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

      Alert.alert("Success", `Appointment Booked successfully!`);

      await fetchAppointments(agentId, selectedDateTime.date);

      setIsSelectedAgent(false); // Close product modal after booking
    } catch (error) {
      console.error("Supabase error:", error.message);
      setBookingError("Failed to book appointment and order. Try again.");
    }
  };

  const fetchAgents = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      console.log("Fetching agents for date:", today);

      const { data, error } = await supabase
        .from("Agents")
        .select("id, full_name, mobile_number");

      if (error) throw error;

      setAgents(data);

      // ✅ Auto-select the first agent (index 0) if at least one exists
      if (data.length > 0) {
        const firstAgent = data[0];
        setSelectedAgent(firstAgent);

        setSelectedDateTime({
          date: today,
          startTime: "",
          endTime: "",
          status: "Booked",
        });

        await fetchAppointments(firstAgent.id, today);
      }
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

      // Insert new user into Supabase
      const { data, error } = await supabase
        .from("User")
        .insert([{ full_name: formattedName, mobile_number: mobileNumber }])
        .select("id, full_name, mobile_number")
        .single();

      if (error) throw error;

      const newRecipient = {
        id: data.id,
        full_name: data.full_name,
        mobile_number: data.mobile_number,
      };

      // Save to AsyncStorage
      const addDetails = await AsyncStorage.setItem(
        "savedRecipient",
        JSON.stringify(newRecipient)
      );
      const handleAdd = await AsyncStorage.setItem(
        "recipientName",
        data.full_name
      );
      console.log("savedRecipient", addDetails);
      console.log("recipientName", handleAdd);

      setUsers((prevUsers) => [...prevUsers, newRecipient]);
      setSavedRecipient(newRecipient);
      setRecipientName(data.full_name);

      Alert.alert("Success", "Recipient details added successfully!");
      setModalVisible(false);
      setRecipientName("");
      setMobileNumber("");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };
  // const handleAddDetails = async () => {
  //   if (!recipientName || !mobileNumber) {
  //     Alert.alert("Error", "Please fill in both fields.");
  //     return;
  //   }

  //   try {
  //     const formattedName = capitalizeWords(recipientName);

  //     // Insert new user into Supabase
  //     const { data, error } = await supabase
  //       .from("User")
  //       .insert([{ full_name: formattedName, mobile_number: mobileNumber }])
  //       .select("id, full_name, mobile_number")
  //       .single();

  //     if (error) throw error;

  //     const newRecipient = {
  //       id: data.id,
  //       full_name: data.full_name, // ✅ Ensure correct field name
  //       mobile_number: data.mobile_number,
  //     };

  //     setUsers((prevUsers) => [...prevUsers, newRecipient]); // ✅ Update users list
  //     setSavedRecipient(newRecipient); // ✅ Update savedRecipient

  //     const addData = await AsyncStorage.setItem(
  //       "savedRecipient",
  //       JSON.stringify(newRecipient)
  //     );
  //     setSavedRecipient(newRecipient);
  //     console.log("savedRecipient", addData);

  //     Alert.alert("Success", "Recipient details added successfully!");
  //     setModalVisible(false);
  //     setRecipientName("");
  //     setMobileNumber("");
  //   } catch (error) {
  //     Alert.alert("Error", error.message);
  //   }
  // };
  // const selectRecipient = async (recipient) => {
  //   setRecipientName(recipient.full_name);
  //   setMobileNumber(recipient.mobile_number);
  //   setFilteredRecipients([]);

  //   const recipientData = {
  //     id: recipient.id,
  //     full_name: recipient.full_name,
  //     mobile_number: recipient.mobile_number,
  //   };

  //   try {
  //     // ✅ Properly await the AsyncStorage operation
  //     await AsyncStorage.setItem(
  //       "savedRecipient",
  //       JSON.stringify(recipientData)
  //     );

  //     // ✅ Now set the state AFTER successful storage
  //     setSavedRecipient(recipientData);
  //     console.log("Saved recipient:", recipientData); // Log the data directly

  //     // Update users state
  //     setUsers((prevUsers) => {
  //       const userExists = prevUsers.some((user) => user.id === recipient.id);
  //       return userExists ? prevUsers : [...prevUsers, recipientData];
  //     });
  //   } catch (error) {
  //     console.error("Failed to save recipient:", error);
  //   }

  //   setModalVisible(false);
  // };

  const selectRecipient = async (recipient) => {
    setRecipientName(recipient.full_name);
    setMobileNumber(recipient.mobile_number);
    setFilteredRecipients([]);

    const recipientData = {
      id: recipient.id,
      full_name: recipient.full_name,
      mobile_number: recipient.mobile_number,
    };

    try {
      // Save both savedRecipient and recipientName
      await AsyncStorage.setItem(
        "savedRecipient",
        JSON.stringify(recipientData)
      );
      await AsyncStorage.setItem("recipientName", recipient.full_name);

      setSavedRecipient(recipientData);
      console.log("Saved recipient:", recipientData);

      // Update users state
      setUsers((prevUsers) => {
        const userExists = prevUsers.some((user) => user.id === recipient.id);
        return userExists ? prevUsers : [...prevUsers, recipientData];
      });
    } catch (error) {
      console.error("Failed to save recipient:", error);
    }

    setModalVisible(false);
  };
  const userMap = React.useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.full_name;
      return acc;
    }, {});
  }, [users]);

  const userMapNumber = React.useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user.mobile_number;
      return acc;
    }, {});
  }, [users]);

  // const fetchLatestUser = async () => {
  //   try {
  //     const savedData = await AsyncStorage.getItem("savedRecipient");

  //     if (savedData) {
  //       try {
  //         const parsedData = JSON.parse(savedData);
  //         setSavedRecipient(parsedData);
  //       } catch (parseError) {
  //         console.error("Error parsing saved recipient:", parseError);
  //       }
  //       return;
  //     }

  //     const { data, error } = await supabase
  //       .from("User")
  //       .select("id, full_name, mobile_number")
  //       .order("id", { ascending: false })
  //       .limit(1);

  //     if (error) throw error;

  //     if (data.length > 0) {
  //       const latestUser = {
  //         id: data[0].id,
  //         full_name: data[0].full_name,
  //         mobile_number: data[0].mobile_number,
  //       };

  //       setSavedRecipient(latestUser);
  //       await AsyncStorage.setItem(
  //         "savedRecipient",
  //         JSON.stringify(latestUser)
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error fetching user:", error.message);
  //   }
  // };

  // ✅ Fetch saved recipient on component mount

  const fetchLatestUser = async () => {
    try {
      // Retrieve savedRecipient
      const savedData = await AsyncStorage.getItem("savedRecipient");
      const savedName = await AsyncStorage.getItem("recipientName");

      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setSavedRecipient(parsedData);
          if (savedName) {
            setRecipientName(savedName);
          }
        } catch (parseError) {
          console.error("Error parsing saved recipient:", parseError);
        }
      }
    } catch (error) {
      console.error("Error retrieving saved recipient:", error.message);
    }
  };

  useEffect(() => {
    fetchLatestUser();
  }, []);

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

  // const convertTo12HourFormat = (timeString) => {
  //   if (!timeString) return ""; // Handle empty time

  //   const [hours, minutes] = timeString.split(":").map(Number);
  //   const period = hours >= 12 ? "PM" : "AM";
  //   const formattedHours = hours % 12 || 12; // Convert 0 to 12

  //   return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  // };
  const convertTo12HourFormat = (timeString) => {
    if (!timeString) return ""; // Handle empty time

    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12

    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const sortAppointmentsByTime = (appointments) => {
    return appointments.sort((a, b) => {
      // Convert start time to minutes since midnight for comparison
      const [aHours, aMinutes] = a.start_time.split(":").map(Number);
      const [bHours, bMinutes] = b.start_time.split(":").map(Number);

      const aTimeInMinutes = aHours * 60 + aMinutes;
      const bTimeInMinutes = bHours * 60 + bMinutes;

      return aTimeInMinutes - bTimeInMinutes; // Ascending order (smallest to largest)
    });
  };

  const sortedAppointments = sortAppointmentsByTime(appointments);
  const formatDate = (dateString) => {
    if (!dateString) return ""; // Handle empty date

    const [year, month, day] = dateString.split("-").map(Number);
    return `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;
  };

  const fetchFilteredRecipients = async (text, field) => {
    if (text.length >= 3) {
      try {
        let query = supabase
          .from("User")
          .select("id, full_name, mobile_number");

        // If searching by name, we need to also check if the mobile number exists
        if (field === "full_name") {
          // Only show results where name matches AND mobile number is in our database
          query = query
            .ilike("full_name", `%${text}%`)
            .not("mobile_number", "is", null); // Ensure mobile number exists
        }
        // If searching by mobile number, just do the normal search
        else if (field === "mobile_number") {
          query = query.ilike("mobile_number", `%${text}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Additional filtering for name search to ensure mobile number matches
        if (field === "full_name" && mobileNumber) {
          const filteredData = data.filter(
            (recipient) => recipient.mobile_number === mobileNumber
          );
          setFilteredRecipients(filteredData || []);
        } else {
          setFilteredRecipients(data || []);
        }
      } catch (error) {
        console.error("Error fetching matching users:", error.message);
      }
    } else {
      setFilteredRecipients([]);
    }
  };
  const handleRecipientNameChange = (text) => {
    setRecipientName(text);
    fetchFilteredRecipients(text, "full_name");
  };

  const handleMobileNumberChange = (text) => {
    setMobileNumber(text);
    fetchFilteredRecipients(text, "mobile_number");
  };
  const convertTo12HourFormats = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };
  const resetSelectedProduct = () => {
    setSelectedProducts([]);
  };
  const handleUnavailableDateClick = async (selectedDate) => {
    Alert.alert(
      "Cancel Unavailability",
      `Do you want to remove unavailability for ${selectedDate}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              // Fetch the record where selectedDate falls within start_date and end_date
              const { data, error } = await supabase
                .from("Unavailability")
                .select("id, start_date, end_date, agent_id")
                .eq("agent_id", selectedAgent.id)
                .lte("start_date", selectedDate)
                .gte("end_date", selectedDate)
                .maybeSingle();

              if (error) throw error;
              if (!data) {
                Alert.alert("Error", "No matching record found.");
                return;
              }

              const { id, start_date, end_date, agent_id } = data;

              // Convert to Date objects for easy comparison
              const startDateObj = new Date(start_date);
              const endDateObj = new Date(end_date);
              const selectedDateObj = new Date(selectedDate);

              if (startDateObj.getTime() === endDateObj.getTime()) {
                // Case 1: Single-day range → Delete the record
                await supabase.from("Unavailability").delete().eq("id", id);
              } else if (selectedDateObj.getTime() === startDateObj.getTime()) {
                // Case 2: Selected date is the start date → Update start_date to next day
                const newStartDate = new Date(startDateObj);
                newStartDate.setDate(newStartDate.getDate() + 1);
                await supabase
                  .from("Unavailability")
                  .update({
                    start_date: newStartDate.toISOString().split("T")[0],
                  })
                  .eq("id", id);
              } else if (selectedDateObj.getTime() === endDateObj.getTime()) {
                // Case 3: Selected date is the end date → Update end_date to previous day
                const newEndDate = new Date(endDateObj);
                newEndDate.setDate(newEndDate.getDate() - 1);
                await supabase
                  .from("Unavailability")
                  .update({ end_date: newEndDate.toISOString().split("T")[0] })
                  .eq("id", id);
              } else {
                // Case 4: Selected date is in between → Split into two records
                const beforeSplitEnd = new Date(selectedDateObj);
                beforeSplitEnd.setDate(beforeSplitEnd.getDate() - 1);

                const afterSplitStart = new Date(selectedDateObj);
                afterSplitStart.setDate(afterSplitStart.getDate() + 1);

                await supabase
                  .from("Unavailability")
                  .update({
                    end_date: beforeSplitEnd.toISOString().split("T")[0],
                  })
                  .eq("id", id);

                await supabase.from("Unavailability").insert([
                  {
                    agent_id,
                    start_date: afterSplitStart.toISOString().split("T")[0],
                    end_date: endDateObj.toISOString().split("T")[0],
                    start_time: "00:00:00",
                    end_time: "23:59:59",
                  },
                ]);
              }

              // ✅ Refresh unavailable dates after update
              fetchUnavailableDates(selectedAgent.id);
              Alert.alert("Success", "Unavailability updated successfully.");
            } catch (error) {
              console.error("Error updating unavailable date:", error.message);
              Alert.alert("Error", "Failed to update unavailability.");
            }
          },
        },
      ]
    );
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
                  setFilteredRecipients([]); // ✅ Clear dropdown on modal open
                }}
              >
                ADD CUSTOMER
              </Text>
            </Text>
            {savedRecipient && (
              <Text style={styles.savedDetails}>
                {savedRecipient.full_name || "Select Customer"} -{" "}
                {savedRecipient.mobile_number || ""}
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
            <TouchableWithoutFeedback onPress={() => setFilteredRecipients([])}>
              <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback onPress={() => {}}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      Booking for someone else
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      We will share booking details on recipient's mobile
                      number.
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
                        onChangeText={handleRecipientNameChange}
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
                                {recipient.full_name} -{" "}
                                {recipient.mobile_number}
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
                    <TouchableOpacity
                      style={styles.closeBUtton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
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
              ADD SERVICE
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
                      <FontAwesome name="minus" size={15} color={"red"} />
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
                      <FontAwesome name="plus" size={15} color={"green"} />
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
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        <View style={styles.agentListContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {generateWeekDatesForAppointments().map((item, index) => {
              const formattedDate = item.date.toISOString().split("T")[0];

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayColumn,
                    item.isUnavailable
                      ? { backgroundColor: "rgba(230, 95, 95, 0.1)", opacity: 0.5 , borderColor: "#ff0000" , borderWidth: 1}
                      : selectedDateTime?.date === formattedDate
                      ? {
                          borderColor: "#007bff",
                          borderWidth: 1,
                          backgroundColor: "rgba(0,123,255,0.1)",
                        }
                      : {},
                  ]}
                  onPress={() => {
                    if (item.isUnavailable) {
                      handleUnavailableDateClick(formattedDate);
                    } else {
                      setSelectedDateTime({
                        date: formattedDate,
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
                      item.isUnavailable
                        ? { color: "#ff0000" } // Make unavailable dates red
                        : selectedDateTime?.date === formattedDate
                        ? { color: "#007bff" }
                        : {},
                    ]}
                  >
                    {item.date.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}
                  </Text>
                  <Text
                    style={[
                      styles.dateHeader,
                      item.isUnavailable
                        ? { color: "#ff0000" } // Make unavailable dates red
                        : selectedDateTime?.date === formattedDate
                        ? { color: "#007bff" }
                        : {},
                    ]}
                  >
                    {item.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.appointmentContainer}>
          <ScrollView style={{ height: 290 }}>
            {appointments.length > 0 ? (
              <View style={{ marginTop: 3 }}>
                <Text style={{ fontSize: 12, marginLeft: 5 }}>
                  Appointments:
                </Text>
                {appointments.map((appt, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setEditingAppointment(appt);
                      setEditStartTime(
                        new Date(`1970-01-01T${appt.start_time}`)
                      );
                      setEditEndTime(new Date(`1970-01-01T${appt.end_time}`));
                    }}
                    style={[
                      styles.appointmentCard,
                      { flexDirection: "row", justifyContent: "space-between" },
                    ]}
                  >
                    <View style={{ flexDirection: "column" }}>
                      <Text style={styles.appointmentText}>
                        {userMap[appt.user_id] || "Unknown User"}{" "}
                      </Text>
                    </View>
                    <Text style={styles.appointmentText}>
                      {convertTo12HourFormat(appt.start_time)} -{" "}
                      {convertTo12HourFormat(appt.end_time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  fontSize: 12,
                  color: "gray",
                  marginTop: 5,
                  marginLeft: 5,
                }}
              >
                No appointments found.
              </Text>
            )}
          </ScrollView>
        </View>
        {/* Agent Calendar Modal */}
      </View>
      {/* Add this modal at the end of the component */}
      <Modal
        visible={!!editingAppointment}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditingAppointment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIconContainer}
              onPress={() => setEditingAppointment(null)}
            >
              <FontAwesome name="close" size={20} color="red" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Edit Appointment Time</Text>

            <View style={styles.timePickerContainer}>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowEditStartPicker(true)}
              >
                <Text>Start Time: {editStartTime.toLocaleTimeString()}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => setShowEditEndPicker(true)}
              >
                <Text>End Time: {editEndTime.toLocaleTimeString()}</Text>
              </TouchableOpacity>

              {showEditStartPicker && (
                <DateTimePicker
                  value={editStartTime}
                  mode="time"
                  onChange={handleEditStartTime}
                />
              )}

              {showEditEndPicker && (
                <DateTimePicker
                  value={editEndTime}
                  mode="time"
                  onChange={handleEditEndTime}
                />
              )}

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={updateAppointmentTime}
              >
                <Text style={styles.confirmButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {isSelectedeAgent && (
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarModalContent}>
            {/* Agent's Schedule Title */}
            <Text style={styles.calendarModalTitle}>
              {selectedAgent?.full_name}'s Schedule
            </Text>

            {/* Time Selection */}
            {selectedDateTime && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    paddingHorizontal: 10,
                    marginTop: 5,
                  }}
                >
                  {/* Start Time Selection */}
                  <View
                    style={{ alignItems: "center", flex: 1, marginRight: 10 }}
                  >
                    <Text style={{ fontSize: 13, marginBottom: 5 }}>
                      Start Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowStartPicker(true)}
                      style={[styles.timePickerButton, { width: "auto" }]}
                    >
                      <Text style={styles.timePickerText}>
                        {selectedDateTime?.startTime
                          ? convertTo12HourFormat(selectedDateTime.startTime)
                          : "Select Start Time"}
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
                  {selectedDateTime?.startTime && selectedDateTime?.endTime && (
                    <Text
                      style={{
                        textAlign: "center",
                        marginTop: 5,
                        color: "red",
                      }}
                    >
                      {selectedDateTime.duration}
                    </Text>
                  )}
                  {/* End Time Selection */}
                  <View
                    style={{ alignItems: "center", flex: 1, marginLeft: 10 }}
                  >
                    <Text style={{ fontSize: 13, marginBottom: 5 }}>
                      End Time
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowEndPicker(true)}
                      style={[
                        styles.timePickerButton,
                        { backgroundColor: "#28A745", width: "auto" },
                      ]}
                    >
                      <Text style={styles.timePickerText}>
                        {selectedDateTime?.endTime
                          ? convertTo12HourFormat(selectedDateTime.endTime)
                          : "Select End Time"}
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
      )}

      <Footer />
    </>
  );
}
const styles = StyleSheet.create({
  selectedProductsScroll: {
    maxHeight: 110,
  },
  timePickerContainer: {
    width: "100%",
  },
  timeInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
  },
  confirmButton: {
    borderColor: "#007bff",
    borderWidth: 1,
    backgroundColor: "#E1EBEE",

    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  appointmentContainer: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    padding: 8,
  },
  selectedAgentCard: {
    borderColor: "#007bff",
    borderWidth: 1,
    backgroundColor: "rgba(0,123,255,0.1)",
  },
  selectedAgentName: {
    color: "#007bff",
  },
  selectedAgentNumber: {
    color: "blue",
  },
  closeIconContainer: {
    alignSelf: "flex-end",
  },
  calendarModalTitle: {
    fontSize: 12,
    textAlign: "center",
  },

  dayColumn: {
    width: 70,
    marginRight: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
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
    fontSize: 12,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    textAlign: "center",
  },

  dayHeader: {
    fontSize: 12,
  },
  dateHeader: {
    fontSize: 13,
  },
  appointmentCard: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
    marginTop: 5,
  },
  appointmentText: {
    fontSize: 12,
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
    fontSize: 12,
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
    top: 84,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    zIndex: 10,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownText: {
    fontSize: 12,
    color: "#333",
  },

  calendarModalOverlay: {
    position: "absolute",
    bottom: 55,
  },
  calendarModalContent: {
    backgroundColor: "white",
    margin: 10,
    borderRadius: 10,
    paddingTop: 23,
    maxHeight: "80%",
  },
  calendarModalTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
  },

  orderContainer: {
    marginBottom: 10,
    paddingLeft: 9,
    textAlign: "center",
  },
  text: {
    fontSize: 12,
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
    fontSize: 12,
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
    flexDirection: "row",
  },
  agentListTitle: {
    fontSize: 12,
    color: "#333",
    marginBottom: 4,
  },
  agentCard: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
  },
  agentName: {
    fontSize: 12,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  agentNumber: {
    fontSize: 12,
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
    fontSize: 12,

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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,

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
    fontSize: 12,

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
    fontSize: 12,
  },

  uniqueId: {
    fontSize: 12,
    color: "#f39c12",
  },
  price: {
    fontSize: 12,
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
    fontSize: 12,
  },
  addDetails: {
    color: "#007BFF",
    fontWeight: "600",
    fontSize: 12,
    borderColor: "black",
    borderWidth: 1,
    padding: 5,
  },
  savedDetails: {
    fontSize: 13,
    color: "#555",
    marginTop: 7,
    fontWeight: "600",
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    margin: 10,
    padding: 20,
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
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 20,
    height: "auto",
    margin: 10,
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
    fontWeight: "bold",
  },
  modalTitleProduct: {
    marginTop: 5,
    fontSize: 13,
    marginLeft: 15,
    color: "#333",
    marginBottom: 7,
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#555",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
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
    fontSize: 12,
  },
  closeBUtton: {
    backgroundColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    padding: 10,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "black",
    fontSize: 12,
  },
});
