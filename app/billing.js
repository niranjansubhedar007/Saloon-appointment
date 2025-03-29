import React, { useState, useEffect, useRef } from "react";
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
  Linking,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import DateTimePicker from "@react-native-community/datetimepicker";

import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Footer from "./footer";
// Initialize Supabase
const supabaseUrl = "https://cqdinxweotvfamknmgap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Billing() {
  const [savedRecipient, setSavedRecipient] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [agentCalendarModalVisible, setAgentCalendarModalVisible] =
    useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [orders, setOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [orderDetails, setOrderDetails] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [unavailableDates, setUnavailableDates] = useState([]);
  const selectedAppointmentRef = useRef(null);
  const fetchOrdersByAppointment = async (appointmentId) => {
    try {
      const { data, error } = await supabase
        .from("Orders")
        .select("*")
        .eq("appointment_id", appointmentId);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error.message);
    }
  };
  const fetchOrderDetails = async (orderNos) => {
    try {
      const { data, error } = await supabase
        .from("Order_details")
        .select("*")
        .in("order_no", orderNos); // Fetch multiple order details

      if (error) throw error;
      setOrderDetails(data || []);
    } catch (error) {
      console.error("Error fetching order details:", error.message);
    }
  };

  const getDaytimePeriod = () => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) return "AM"; // Morning: 6 AM - 11:59 AM
    if (hours >= 12 && hours < 18) return "PM"; // Afternoon: 12 PM - 5:59 PM
    return "AM"; // Default fallback (early morning or after evening)
  };
  const [startPeriod, setStartPeriod] = useState(getDaytimePeriod());
  const [endPeriod, setEndPeriod] = useState(getDaytimePeriod());
  useEffect(() => {
    if (agentCalendarModalVisible) {
      setStartPeriod(getDaytimePeriod());
      setEndPeriod(getDaytimePeriod());
    }
  }, [agentCalendarModalVisible]);

  const handleCompletePress = async (appointment) => {
    console.log("✅ Selected Appointment:", appointment);
    setSelectedAppointment(appointment);
    selectedAppointmentRef.current = appointment; // ✅ Store appointment in ref
    setModalVisible(true);

    if (appointment?.id) {
      await fetchOrdersByAppointment(appointment.id);
    }
  };

  useEffect(() => {
    if (appointments.length > 0 && !selectedAppointment) {
      setSelectedAppointment(appointments[0]); // ✅ Automatically select the first appointment
      selectedAppointmentRef.current = appointments[0];
    }
  }, [appointments]);

  useEffect(() => {
    if (orders.length > 0) {
      const orderNos = orders.map((order) => order.order_no);
      fetchOrderDetails(orderNos);
    }
  }, [orders]);

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
    fetchLatestUser();
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

  const updateProductQuantity = async (
    id,
    newQuantity,
    isSelectedProduct = false
  ) => {
    if (newQuantity < 1) {
      handleDelete(id, isSelectedProduct);
      return;
    }

    try {
      let order_no;
      let menu_rate;

      if (isSelectedProduct) {
        // ✅ Update state for selectedProducts
        setSelectedProducts((prevSelected) =>
          prevSelected.map((p) =>
            p.id === id ? { ...p, quantity: newQuantity } : p
          )
        );

        // ✅ Find the product in selectedProducts
        const selectedProduct = selectedProducts.find((p) => p.id === id);
        if (!selectedProduct) {
          console.warn("No matching selected product found for id:", id);
          return;
        }

        // ✅ Check if product exists in Order_details
        const { data: existingOrderDetail, error: fetchError } = await supabase
          .from("Order_details")
          .select("id, order_no, qty_sold, menu_rate")
          .eq("menu_name", selectedProduct.Name)
          .eq("order_no", selectedOrder?.order_no)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingOrderDetail) {
          // ✅ Use fetched data
          order_no = existingOrderDetail.order_no;
          menu_rate = existingOrderDetail.menu_rate;
        } else {
          console.warn(
            "No matching Order_details entry found for",
            selectedProduct.Name
          );
          return;
        }
      } else {
        // ✅ Fetch from Order_details if updating an existing order item
        const { data: detail, error: fetchError } = await supabase
          .from("Order_details")
          .select("order_no, menu_rate")
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;
        if (!detail) {
          console.warn("No matching order detail found for id:", id);
          return;
        }

        // ✅ Use fetched data
        order_no = detail.order_no;
        menu_rate = detail.menu_rate;
      }

      // ✅ Ensure newTotal is always defined
      const newTotal = newQuantity * menu_rate;

      // ✅ Update quantity in Order_details
      const { error: updateError } = await supabase
        .from("Order_details")
        .update({ qty_sold: newQuantity, menu_rate_total: newTotal })
        .eq("order_no", order_no)
        .eq("menu_rate", menu_rate);

      if (updateError) throw updateError;

      // ✅ Fetch updated order details
      const { data: orderDetails, error: detailsError } = await supabase
        .from("Order_details")
        .select("qty_sold, menu_rate_total")
        .eq("order_no", order_no);

      if (detailsError) throw detailsError;

      // ✅ Calculate new totals
      const totalItems = orderDetails.reduce(
        (sum, item) => sum + item.qty_sold,
        0
      );
      const subtotal = orderDetails.reduce(
        (sum, item) => sum + item.menu_rate_total,
        0
      );

      // ✅ Update Orders Table
      const { error: orderUpdateError } = await supabase
        .from("Orders")
        .update({
          total_items: totalItems,
          subtotal: subtotal,
          grand_total: subtotal,
        })
        .eq("order_no", order_no);

      if (orderUpdateError) throw orderUpdateError;

      // ✅ Update local state
      setOrderDetails((prevDetails) =>
        prevDetails.map((item) =>
          item.id === id
            ? { ...item, qty_sold: newQuantity, menu_rate_total: newTotal }
            : item
        )
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_no === order_no
            ? {
                ...order,
                total_items: totalItems,
                subtotal: subtotal,
                grand_total: subtotal,
              }
            : order
        )
      );

      console.log(
        "✅ Quantity updated successfully in Order_details and Orders"
      );
    } catch (error) {
      console.error("❌ Error updating quantity and totals:", error.message);
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

  // Call this function whenever the selected agent changes
  useEffect(() => {
    if (selectedAgent) {
      fetchUnavailableDates(selectedAgent.id);
    }
  }, [selectedAgent]);

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

  const handleDelete = async (id, isSelectedProduct = false) => {
    // Optimistic UI update
    setSelectedProducts((prevSelected) =>
      prevSelected.filter((p) => p.id !== id)
    );
    setOrderDetails((prevDetails) =>
      prevDetails.filter((detail) => detail.id !== id)
    );

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              if (isSelectedProduct) {
                return; // Exit early since it’s already removed from state
              }

              // ✅ Fetch order detail to get order_no
              const { data: deletedDetail, error: fetchError } = await supabase
                .from("Order_details")
                .select("order_no, menu_name, qty_sold, menu_rate_total")
                .eq("id", id)
                .single();

              if (fetchError) throw fetchError;

              // ✅ Delete from Supabase
              const { error: deleteError } = await supabase
                .from("Order_details")
                .delete()
                .eq("id", id);

              if (deleteError) throw deleteError;

              const orderNo = deletedDetail.order_no;

              // ✅ Fetch remaining order details
              const { data: remainingDetails, error: detailsError } =
                await supabase
                  .from("Order_details")
                  .select("qty_sold, menu_rate_total")
                  .eq("order_no", orderNo);

              if (detailsError) throw detailsError;

              // ✅ Calculate new totals
              const totalItems = remainingDetails.reduce(
                (sum, item) => sum + item.qty_sold,
                0
              );
              const subtotal = remainingDetails.reduce(
                (sum, item) => sum + item.menu_rate_total,
                0
              );

              // ✅ Update Orders table
              const { error: updateError } = await supabase
                .from("Orders")
                .update({
                  total_items: totalItems,
                  subtotal: subtotal,
                  grand_total: subtotal,
                })
                .eq("order_no", orderNo);

              if (updateError) throw updateError;

              // ✅ Ensure UI updates after Supabase response
              setTimeout(() => {
                setOrders((prevOrders) =>
                  prevOrders.map((order) =>
                    order.order_no === orderNo
                      ? {
                          ...order,
                          total_items: totalItems,
                          subtotal: subtotal,
                          grand_total: subtotal,
                        }
                      : order
                  )
                );
              }, 300); // Small delay to ensure UI reflects changes

              // ✅ Ensure deleted item is removed from selectedProducts
              setSelectedProducts((prev) =>
                prev.filter(
                  (product) => product.Name !== deletedDetail.menu_name
                )
              );
            } catch (error) {
              console.error("Error deleting order detail:", error.message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Add this function in your component
  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this appointment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              // Delete from Supabase
              const { error } = await supabase
                .from("Appointments")
                .delete()
                .eq("id", appointmentId);

              if (error) throw error;

              // Update local state
              setAppointments((prev) =>
                prev.filter((a) => a.id !== appointmentId)
              );

              // Refresh orders list
              if (selectedAppointment?.id === appointmentId) {
                setModalVisible(false);
              }

              Alert.alert("Success", "Appointment cancelled successfully");
            } catch (error) {
              console.error("Error cancelling appointment:", error);
              Alert.alert("Error", "Failed to cancel appointment");
            }
          },
          style: "destructive",
        },
      ]
    );
  };
  const handlePaymentConfirmation = async (order) => {
    try {
      const updates = {
        is_print: true,
        is_payment: true,
        mobile_number: Number(userMapNumber[selectedAppointment.user_id]) || 0,
        cash_amount: paymentMethod === "cash" ? parseFloat(paymentAmount) : 0,
        card_amount: paymentMethod === "card" ? parseFloat(paymentAmount) : 0,
        online_amount:
          paymentMethod === "online" ? parseFloat(paymentAmount) : 0,
      };

      // ✅ Step 1: Update Orders Table (Only payment status & amounts)
      const { error: orderError } = await supabase
        .from("Orders")
        .update(updates)
        .eq("order_no", order.order_no);

      if (orderError) throw orderError;

      // ✅ Step 2: Update Appointments Table (Mark as Success)
      const { error: appointmentError } = await supabase
        .from("Appointments")
        .update({ is_complete: true })
        .eq("id", order.appointment_id);

      if (appointmentError) throw appointmentError;

      // ✅ Step 3: Clear selected products and show success message
      setSelectedProducts([]);
      Alert.alert("Success", "Payment recorded successfully!");

      // Close modal
      setPaymentMethod(null);
      setPaymentAmount("");
      setModalVisible(false);
    } catch (error) {
      console.error("Payment error:", error.message);
      Alert.alert("Error", "Failed to process payment.");
    }
  };

  // ✅ Function to Save Data in Supabase
  const handleSubmit = async () => {
    if (!selectedAgent) {
      Alert.alert("Error", "Please select an agent.");
      return;
    }

    const formattedStartDate = startDate.toISOString().split("T")[0]; // Convert to YYYY-MM-DD
    const formattedEndDate = endDate.toISOString().split("T")[0];
    const formattedStartTime = startTime.toTimeString().split(" ")[0]; // Convert to HH:MM:SS
    const formattedEndTime = endTime.toTimeString().split(" ")[0];

    try {
      const { data, error } = await supabase.from("Unavailability").insert([
        {
          agent_id: selectedAgent.id,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
        },
      ]);

      if (error) {
        console.error("Error inserting data:", error.message);
        Alert.alert("Error", "Failed to save data.");
      } else {
        Alert.alert("Success", "Unavailability saved successfully.");
        setAgentCalendarModalVisible(false);
      }
    } catch (error) {
      console.error("Unexpected error:", error.message);
      Alert.alert("Error", "Something went wrong.");
    }
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

  const handleProductPress = async (product) => {
    try {
      let currentOrder = selectedOrder;

      // ✅ Ensure selectedOrder is set before proceeding
      if (!selectedOrder) {
        if (orders.length === 1) {
          setSelectedOrder(orders[0]);
          currentOrder = orders[0]; // ✅ Set a temporary reference to use immediately
        } else {
          Alert.alert(
            "Error",
            "Please select an order before adding products."
          );
          return;
        }
      }

      if (!currentOrder) {
        Alert.alert("Error", "Order is not selected. Please try again.");
        return;
      }

      const existingProduct = selectedProducts.find((p) => p.id === product.id);
      let updatedSelectedProducts;
      let newQuantity = existingProduct ? existingProduct.quantity + 1 : 1;

      if (existingProduct) {
        updatedSelectedProducts = selectedProducts.map((p) =>
          p.id === product.id ? { ...p, quantity: newQuantity } : p
        );
      } else {
        updatedSelectedProducts = [
          ...selectedProducts,
          { ...product, quantity: 1 },
        ];
      }

      setSelectedProducts(updatedSelectedProducts);

      // ✅ Step 1: Check if the product exists in Order_details
      const { data: existingOrderDetail, error: fetchError } = await supabase
        .from("Order_details")
        .select("id, order_id, qty_sold, appointment_id")
        .eq("order_no", currentOrder.order_no)
        .eq("menu_name", product.Name)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingOrderDetail) {
        // ✅ Step 2: Update existing product quantity in Order_details
        const updatedQuantity = existingOrderDetail.qty_sold + 1;
        const updatedTotal = updatedQuantity * product.Price;
        const { error: updateError } = await supabase
          .from("Order_details")
          .update({ qty_sold: updatedQuantity, menu_rate_total: updatedTotal })
          .eq("id", existingOrderDetail.id);

        if (updateError) throw updateError;
      } else {
        // ✅ Step 3: Ensure appointment_id is not null before inserting
        const appointmentId =
          currentOrder.appointment_id !== undefined
            ? currentOrder.appointment_id
            : null;

        const { error: insertError } = await supabase
          .from("Order_details")
          .insert([
            {
              order_id: currentOrder.id, // ✅ Using the reference order_id
              order_no: currentOrder.order_no,
              menu_name: product.Name,
              qty_sold: 1,
              menu_rate: product.Price,
              menu_rate_total: product.Price,
              appointment_id: appointmentId, // ✅ Ensuring correct value
            },
          ]);

        if (insertError) throw insertError;
      }

      // ✅ Step 4: Fetch updated order details and recalculate total items & price
      const { data: orderDetails, error: detailsError } = await supabase
        .from("Order_details")
        .select("qty_sold, menu_rate_total")
        .eq("order_no", currentOrder.order_no);

      if (detailsError) throw detailsError;

      const totalItems = orderDetails.reduce(
        (sum, item) => sum + item.qty_sold,
        0
      );
      const subtotal = orderDetails.reduce(
        (sum, item) => sum + item.menu_rate_total,
        0
      );

      // ✅ Step 5: Update Orders table with new totals
      const { error: orderUpdateError } = await supabase
        .from("Orders")
        .update({
          total_items: totalItems,
          subtotal: subtotal,
          grand_total: subtotal,
        })
        .eq("order_no", currentOrder.order_no);

      if (orderUpdateError) throw orderUpdateError;

      console.log("✅ Product added/updated in Order_details successfully!");
    } catch (error) {
      console.error(
        "❌ Error updating selected product in Order_details:",
        error.message
      );
    }
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
  useEffect(() => {
    if (paymentMethod && selectedOrder) {
      const updatedTotal = (
        selectedOrder.grand_total +
        selectedProducts
          .filter((p) => !orderDetails.some((d) => d.menu_name === p.Name))
          .reduce((sum, p) => sum + p.quantity * p.Price, 0)
      ).toFixed(2);

      setPaymentAmount(updatedTotal);
    }
  }, [paymentMethod, selectedOrder, selectedProducts]); // ✅ Runs when paymentMethod, order, or products change

  return (
    <>
      <View style={{ padding: 10 }}>
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

        <View style={styles.appointmentContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {generateWeekDatesForAppointments().map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayColumn,
                  item.isUnavailable
                    ? { backgroundColor: "rgba(0,0,0,0.1)", opacity: 0.5 }
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
                  const selectedDate = item.date.toISOString().split("T")[0];

                  if (item.isUnavailable) {
                    handleUnavailableDateClick(selectedDate);
                  } else {
                    setSelectedDateTime({
                      date: selectedDate,
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
                  <View>
                    <Text style={styles.appointmentText}>
                      User: {userMap[appt.user_id] || "Unknown User"}{" "}
                      {userMapNumber[appt.user_id] || "Unknown User"}
                    </Text>

                    <Text style={styles.appointmentText}>
                      Time: {convertTo12HourFormat(appt.start_time)} -{" "}
                      {convertTo12HourFormat(appt.end_time)}
                    </Text>
                  </View>
                  <View style={styles.buttonContainer}>
                    {/* Complete Button */}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => handleCompletePress(appt)}
                    >
                      <FontAwesome name="check" size={15} color="white" />
                    </TouchableOpacity>
                    {/* Cancel Button */}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelAppointment(appt.id)}
                    >
                      <FontAwesome name="times" size={15} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.recallButton]}
                      onPress={() => {

                        if (!selectedAppointmentRef.current) {
                          Alert.alert("Error", "No appointment available.");
                          return;
                        }

                        const userId = selectedAppointmentRef.current.user_id;

                        if (!userId) {
                          Alert.alert(
                            "Error",
                            "No user ID found in appointment."
                          );
                          return;
                        }

                        const userPhoneNumber = userMapNumber[userId];

                        if (!userPhoneNumber) {
                          Alert.alert("Error", "User phone number not found.");
                          return;
                        }

                        setTimeout(() => {
                          Linking.openURL(`tel:${userPhoneNumber}`);
                        }, 500); // ✅ Small delay
                      }}
                    >
                      <FontAwesome name="phone" size={15} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={{
                fontSize: 10,
                color: "gray",
                marginTop: 10,
                marginLeft: 5,
              }}
            >
              No appointments found.
            </Text>
          )}
        </View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={agentCalendarModalVisible}
          onRequestClose={() => setAgentCalendarModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 10,
                width: "80%",
              }}
            >
              <Text style={{ fontSize: 12, marginBottom: 10 }}>
                {selectedAgent?.full_name}'s Unavailability 
              </Text>

              {/* Start Date Picker */}
              <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
                <Text
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderRadius: 5,
                    fontSize: 10,
                  }}
                >
                  📅 Start Date: {startDate.toDateString()}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              {/* End Date Picker */}
              <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
                <Text
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderRadius: 5,
                    marginTop: 10,
                    fontSize: 10,
                  }}
                >
                  📅 End Date: {endDate.toDateString()}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}

              {/* Start Time Picker */}
              <TouchableOpacity onPress={() => setShowStartTimePicker(true)}>
                <Text
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderRadius: 5,
                    marginTop: 10,
                    fontSize: 10,
                  }}
                >
                  ⏰ Start Time: {startTime.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={(event, time) => {
                    setShowStartTimePicker(false);
                    if (time) setStartTime(time);
                  }}
                />
              )}

              {/* End Time Picker */}
              <TouchableOpacity onPress={() => setShowEndTimePicker(true)}>
                <Text
                  style={{
                    padding: 10,
                    borderWidth: 1,
                    borderRadius: 5,
                    marginTop: 10,
                    fontSize: 10,
                  }}
                >
                  ⏰ End Time: {endTime.toLocaleTimeString()}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="default"
                  onChange={(event, time) => {
                    setShowEndTimePicker(false);
                    if (time) setEndTime(time);
                  }}
                />
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#007BFF",
                  padding: 10,
                  borderRadius: 5,
                  alignItems: "center",
                  marginTop: 10,
                }}
                onPress={handleSubmit}
              >
                <Text style={{ color: "white", fontSize: 10 }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setAgentCalendarModalVisible(false)}
              >
                <FontAwesome name="times" color="red" size={15} />
              </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Appointment Details</Text>

              {selectedAppointment && (
                <>
                  <View style={styles.rowContainer}>
                    <Text style={styles.bold}>User</Text>
                    <Text style={styles.bold}>
                      {userMap[selectedAppointment.user_id] || "Unknown User"}{" "}
                    </Text>
                  </View>
                  <View style={styles.rowContainer}>
                    <Text style={styles.bold}>Mobile</Text>
                    <Text style={styles.bold}>
                      {userMapNumber[selectedAppointment.user_id] ||
                        "Unknown User"}
                    </Text>
                  </View>
                  <View style={styles.rowContainer}>
                    <Text style={styles.bold}>Time</Text>
                    <Text style={styles.bold}>
                      {convertTo12HourFormat(selectedAppointment.start_time)} -{" "}
                      {convertTo12HourFormat(selectedAppointment.end_time)}
                    </Text>
                  </View>

                  <View style={styles.rowContainer}>
                    <Text style={styles.bold}>Date</Text>
                    <Text style={styles.bold}>
                      {formatDate(selectedAppointment.appointment_date)}
                    </Text>
                  </View>

                  <View style={styles.rowContainer}>
                    <Text style={styles.bold}>Agent</Text>
                    <Text style={styles.bold}>
                      {selectedAgent?.full_name || "N/A"}
                    </Text>
                  </View>
                  <View>
                    <Text
                      style={[styles.text, { marginBottom: 2, paddingLeft: 2 }]}
                    >
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
                  {orders.length > 0 ? (
                    <View>
                      {orders.map((order) => (
                        <View key={order.id} style={styles.orderCard}>
                          {/* Order Details */}
                          <Text style={styles.orderText}>
                            <Text style={styles.bold}>Order No:</Text>{" "}
                            {order.order_no}
                          </Text>

                          {orderDetails.length > 0 ||
                          selectedProducts.length > 0 ? (
                            <View>
                              {/* ✅ Render Order Details First */}
                              {orderDetails.map((detail) => (
                                <View
                                  key={`order_${detail.id}`}
                                  style={styles.orderDetailCard}
                                >
                                  <View style={styles.orderDetailRow}>
                                    <View style={styles.orderDetailColumn}>
                                      <Text style={styles.orderDetailText}>
                                        <Text style={styles.bold}></Text>{" "}
                                        {detail.menu_name}
                                      </Text>
                                      <Text style={styles.orderDetailText}>
                                        <Text style={styles.bold}>₹</Text>{" "}
                                        {detail.menu_rate_total.toFixed(2)}
                                      </Text>
                                    </View>
                                    <View style={styles.quantityContainer}>
                                      <TouchableOpacity
                                        style={styles.qtyButton}
                                        onPress={() =>
                                          updateProductQuantity(
                                            detail.id,
                                            detail.qty_sold - 1
                                          )
                                        }
                                      >
                                        <FontAwesome
                                          name="minus"
                                          size={12}
                                          color="red"
                                        />
                                      </TouchableOpacity>

                                      <TextInput
                                        style={styles.qtyInput}
                                        keyboardType="numeric"
                                        value={String(detail.qty_sold)}
                                        onChangeText={(value) =>
                                          updateProductQuantity(
                                            detail.id,
                                            parseInt(value) || 1
                                          )
                                        }
                                      />

                                      <TouchableOpacity
                                        style={styles.qtyButton}
                                        onPress={() =>
                                          updateProductQuantity(
                                            detail.id,
                                            detail.qty_sold + 1
                                          )
                                        }
                                      >
                                        <FontAwesome
                                          name="plus"
                                          size={12}
                                          color="green"
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              ))}

                              {/* ✅ Render Selected Products That Are Not in Order Details */}
                              {selectedProducts
                                .filter(
                                  (product) =>
                                    !orderDetails.some(
                                      (detail) =>
                                        detail.menu_name === product.Name
                                    )
                                )
                                .map((product) => (
                                  <ScrollView
                                    key={`selected_${product.id}`}
                                    style={styles.orderDetailCard}
                                  >
                                    <View style={styles.orderDetailRow}>
                                      <View style={styles.orderDetailColumn}>
                                        <Text style={styles.orderDetailText}>
                                          <Text style={styles.bold}>Item:</Text>{" "}
                                          {product.Name}
                                        </Text>
                                        <Text style={styles.orderDetailText}>
                                          <Text style={styles.bold}>₹</Text>{" "}
                                          {(
                                            product.quantity * product.Price
                                          ).toFixed(2)}
                                        </Text>
                                      </View>
                                      <View style={styles.quantityContainer}>
                                        <TouchableOpacity
                                          style={styles.qtyButton}
                                          onPress={() =>
                                            updateProductQuantity(
                                              product.id,
                                              product.quantity - 1,
                                              true
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name="minus"
                                            size={12}
                                            color="red"
                                          />
                                        </TouchableOpacity>

                                        <TextInput
                                          style={styles.qtyInput}
                                          keyboardType="numeric"
                                          value={String(product.quantity)}
                                          onChangeText={(value) =>
                                            updateProductQuantity(
                                              product.id,
                                              parseInt(value) || 1,
                                              true
                                            )
                                          }
                                        />

                                        <TouchableOpacity
                                          style={styles.qtyButton}
                                          onPress={() =>
                                            updateProductQuantity(
                                              product.id,
                                              product.quantity + 1,
                                              true
                                            )
                                          }
                                        >
                                          <FontAwesome
                                            name="plus"
                                            size={12}
                                            color="green"
                                          />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  </ScrollView>
                                ))}
                            </View>
                          ) : (
                            <Text
                              style={{
                                fontSize: 14,
                                color: "gray",
                                marginTop: 10,
                              }}
                            >
                              No orders found.
                            </Text>
                          )}

                          <View style={styles.rowContainer}>
                            <Text style={styles.boldSecond}>
                              <Text style={styles.boldSecond}>
                                Total Items:
                              </Text>{" "}
                              {order.total_items +
                                selectedProducts
                                  .filter(
                                    (p) =>
                                      !orderDetails.some(
                                        (d) => d.menu_name === p.Name
                                      )
                                  )
                                  .reduce((sum, p) => sum + p.quantity, 0)}
                            </Text>
                            <Text style={styles.boldSecond}>
                              <Text style={styles.boldSecond}>Total:</Text> ₹{" "}
                              {(
                                order.grand_total +
                                selectedProducts
                                  .filter(
                                    (p) =>
                                      !orderDetails.some(
                                        (d) => d.menu_name === p.Name
                                      )
                                  )
                                  .reduce(
                                    (sum, p) => sum + p.quantity * p.Price,
                                    0
                                  )
                              ).toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.paymentMethodContainer}>
                            {["cash", "card", "online"].map((method) => (
                              <TouchableOpacity
                                key={method}
                                style={[
                                  styles.paymentButton,
                                  paymentMethod === method &&
                                    styles.selectedPayment,
                                ]}
                                onPress={() => {
                                  setPaymentMethod(method);
                                  setSelectedOrder(order); // ✅ Order state updates first
                                }}
                              >
                                <Text
                                  style={[
                                    { fontSize: 10 }, // ✅ Set font size to 10
                                    paymentMethod === method
                                      ? { color: "white" }
                                      : {},
                                  ]}
                                >
                                  {method.charAt(0).toUpperCase() +
                                    method.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          {/* Payment Input & Confirmation */}
                          {paymentMethod &&
                            selectedOrder?.order_no === order.order_no && (
                              <View>
                                <TextInput
                                  style={styles.paymentInput}
                                  keyboardType="numeric"
                                  value={paymentAmount}
                                  editable={false}
                                  placeholder="Amount"
                                />

                                <TouchableOpacity
                                  style={styles.confirmButton}
                                  onPress={() =>
                                    handlePaymentConfirmation(order)
                                  }
                                >
                                  <Text style={styles.confirmButtonText}>
                                    Payment
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text
                      style={{ fontSize: 12, color: "gray", marginTop: 10 }}
                    >
                      No orders found.
                    </Text>
                  )}
                </>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <FontAwesome name="times" color="red" size={15} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
      </View>
      <Footer />
    </>
  );
}
const styles = StyleSheet.create({
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
  boldSecond: {
    marginTop: 7,
    fontSize: 12,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  qtyButton: {
    marginTop: 8,
  },
  quantityContainer: {
    flexDirection: "row",
  },
  paymentMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 10,
  },
  paymentButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 10,
  },
  selectedPayment: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    fontSize: 10,
  },
  confirmButton: {
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "semibold",
    fontSize: 12,
  },
  semiBold: {
    fontSize: 10,
  },
  orderDetailRow: {
    justifyContent: "space-between",
    display: "flex",
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
  },
  orderCard: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  orderText: {
    fontSize: 10,
    color: "#333",
    marginLeft: 5,
  },
  orderDetailCard: {
    backgroundColor: "#e9f7ef",
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
  },
  orderDetailText: {
    fontSize: 10,
    color: "#555",
    flexDirection: "column",
  },
  bold: {
    fontWeight: "semibold",
    fontSize: 10,
  },
  closeButton: {
    padding: 5,
    borderRadius: 5,
    alignItems: "center",
    position: "absolute",
    top: 5,
    right: 5,
  },

  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    backgroundColor: "green",
  },
  cancelButton: {
    backgroundColor: "red",
  },
  recallButton: {
    backgroundColor: "orange",
  },

  buttonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  appointmentContainer: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
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
  dayColumn: {
    width: 60,
    marginRight: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
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
    flexDirection: "row",
    justifyContent: "space-between",
  },
  appointmentText: {
    fontSize: 10,
    color: "#333",
  },
  agentListContainer: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
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
    paddingLeft: 10,
    paddingRight: 10,
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
  selectedProductPrice: {
    fontSize: 10,
    flex: 1,
    textAlign: "right",
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
  addDetails: {
    color: "#007BFF",
    fontWeight: "600",
    fontSize: 10,
  },

  savedDetails: {
    fontSize: 10,
    color: "#555",
    marginTop: 5,
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
