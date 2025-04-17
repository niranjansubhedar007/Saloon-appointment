import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
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
  const [totalCompletedAppointments, setTotalCompletedAppointments] = useState(0); // New state for completed appointments

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
  
      let query = supabase
        .from("Orders")
        .select("grand_total, cash_amount, card_amount, online_amount, is_payment, created_at, agentId")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .eq("is_payment", true);
  
      if (selectedAgents.length > 0) {
        query = query.in("agentId", selectedAgents);
      }
  
      const { data, error } = await query;
  
      if (error) throw error;
  
      const totals = data.reduce(
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
  
      // Fetch total completed appointments based on agent selection
      let appointmentQuery = supabase
        .from("Appointments")
        .select("id")
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .eq("is_complete", true);
  
      if (selectedAgents.length > 0) {
        appointmentQuery = appointmentQuery.in("agent_id", selectedAgents);
      }
  
      const { data: appointmentData, error: appointmentError } = await appointmentQuery;
      if (appointmentError) throw appointmentError;
  
      setTotalCompletedAppointments(appointmentData.length);
    } catch (error) {
      console.error("Error fetching total sales or appointments:", error.message);
    }
  };
  

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

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#007bff"]}
            tintColor="#007bff"
          />
        }
      >
        <Text style={styles.title}>📊 Sales Report</Text>
        <View style={styles.filterContainer}>
          {[{ label: "Today", type: "today" }, { label: "This Week", type: "this_week" }, { label: "Last Week", type: "last_week" }, { label: "This Month", type: "this_month" }, { label: "Last Month", type: "last_month" }].map((btn) => (
            <TouchableOpacity key={btn.type} style={styles.filterButton} onPress={() => setRange(btn.type)}>
              <Text style={styles.filterButtonText}>{btn.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dateContainer}>
          <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
            <Feather name="calendar" size={20} color="#6c757d" />
            <Text style={styles.dateButtonText}>{startDate.toDateString()}</Text>
            <Feather name="check-circle" size={20} color="#28a745" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
            <Feather name="calendar" size={20} color="#6c757d" />
            <Text style={styles.dateButtonText}>{endDate.toDateString()}</Text>
            <Feather name="check-circle" size={20} color="#28a745" />
          </TouchableOpacity>
        </View>

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
        
        {/* Agent List Section */}
        <View style={styles.agentListContainer}>
          <Text style={styles.agentListTitle}>Agents</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
            <TouchableOpacity
              style={[
                styles.agentButton,
                selectedAgents.length === 0 && { backgroundColor: "#007bff" },
              ]}
              onPress={() => {
                setSelectedAgents([]);
              }}
            >
              <Text style={styles.agentButtonText}>All</Text>
            </TouchableOpacity>

            {agents.map((agent) => (
              <TouchableOpacity
                key={agent.id}
                style={[
                  styles.agentButton,
                  selectedAgents[0] === agent.id && { backgroundColor: "#28a745" },
                ]}
                onPress={() => {
                  setSelectedAgents([agent.id]);
                }}
              >
                <Text style={styles.agentButtonText}>{agent.full_name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 10 }}>
            Total Completed Appointments: {totalCompletedAppointments}
          </Text>
        </View>

        {/* Payment Breakdown Section */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Payment Breakdown</Text>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Total Sales</Text>
            <Text style={styles.tableCell}>₹{totalSales}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Cash</Text>
            <Text style={styles.tableCell}>₹{totalCash}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Card</Text>
            <Text style={styles.tableCell}>₹{totalCard}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Online</Text>
            <Text style={styles.tableCell}>₹{totalOnline}</Text>
          </View>
        </View>
      </ScrollView>

      <Footer />
    </>
  );
};

const styles = StyleSheet.create({
  agentListContainer: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  agentListTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  agentCard: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  agentName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  agentDetail: {
    fontSize: 12,
    color: "#6c757d",
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },

  filterButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginHorizontal: 5,
    marginVertical: 5,
  },

  filterButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  container: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
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
  tableContainer: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tableTitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
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
