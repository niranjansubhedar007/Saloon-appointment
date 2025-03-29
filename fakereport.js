import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { createClient } from "@supabase/supabase-js";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import Footer from "./footer";

const supabase = createClient(
  "https://cqdinxweotvfamknmgap.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U"
);

const Report = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [totalCash, setTotalCash] = useState(0);
  const [totalCard, setTotalCard] = useState(0);
  const [totalOnline, setTotalOnline] = useState(0);
  

  const fetchTotalSales = async () => {
    if (!startDate || !endDate) return;

    try {
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const startISO = startDateTime.toISOString();

      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      const endISO = endDateTime.toISOString();

      const { data, error } = await supabase
        .from("Orders")
        .select("grand_total, cash_amount, card_amount, online_amount, is_payment, created_at")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .eq("is_payment", true);

      if (error) throw error;

      // Calculate totals
      const totalSales = data.reduce((sum, order) => sum + order.grand_total, 0);
      const totalCash = data.reduce((sum, order) => sum + order.cash_amount, 0);
      const totalCard = data.reduce((sum, order) => sum + order.card_amount, 0);
      const totalOnline = data.reduce((sum, order) => sum + order.online_amount, 0);

      setTotalSales(totalSales);
      setTotalCash(totalCash);
      setTotalCard(totalCard);
      setTotalOnline(totalOnline);

      console.log("Total Sales:", totalSales);
      console.log("Total Cash:", totalCash);
      console.log("Total Card:", totalCard);
      console.log("Total Online:", totalOnline);

    } catch (error) {
      console.error("Error fetching total sales:", error.message);
    }
  };


  const isButtonDisabled = !startDate || !endDate;

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>📊 Sales Report</Text>

        <View style={styles.dateContainer}>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            <Feather name="calendar" size={20} color="#6c757d" />
            <Text style={styles.dateButtonText}>
              {startDate ? startDate.toDateString() : "Select Start Date"}
            </Text>
            {startDate && (
              <Feather name="check-circle" size={20} color="#28a745" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={styles.dateButton}
          >
            <Feather name="calendar" size={20} color="#6c757d" />
            <Text style={styles.dateButtonText}>
              {endDate ? endDate.toDateString() : "Select End Date"}
            </Text>
            {endDate && (
              <Feather name="check-circle" size={20} color="#28a745" />
            )}
          </TouchableOpacity>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
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
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false);
              date && setEndDate(date);
            }}
          />
        )}

        <TouchableOpacity
          onPress={fetchTotalSales}
          style={[
            styles.fetchButton,
            isButtonDisabled && styles.disabledButton,
          ]}
          disabled={isButtonDisabled}
        >
          <Text style={styles.buttonText}>
            <Feather name="dollar-sign" size={12} color="white" />
            {"  "}
            Generate Report
          </Text>
        </TouchableOpacity>
        <View style={styles.salesCard}>
        <Text style={styles.salesTitle}>Total Sales</Text>
        <Text style={styles.amount}>₹{totalSales.toFixed(2)}</Text>

        <Text style={styles.salesTitle}>Cash Payments</Text>
        <Text style={styles.amount}>₹{totalCash.toFixed(2)}</Text>

        <Text style={styles.salesTitle}>Card Payments</Text>
        <Text style={styles.amount}>₹{totalCard.toFixed(2)}</Text>

        <Text style={styles.salesTitle}>Online Payments</Text>
        <Text style={styles.amount}>₹{totalOnline.toFixed(2)}</Text>

        <Text style={styles.dateRangeText}>
          {startDate?.toDateString()} - {endDate?.toDateString()}
        </Text>
      </View>

      </View>
      <Footer />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
    marginVertical: 20,
    textAlign: "center",
 
  },
  dateContainer: {
    width: "100%",
    marginBottom: 20,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateButtonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 10,
    color: "#495057",
  },
  fetchButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: "#a0a0a0",
    shadowColor: "transparent",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 10,
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
    fontSize: 10,
    marginTop: 5,
  },
});

export default Report;
