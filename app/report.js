// import React, { useState , useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
  
// } from "react-native";
// import { createClient } from "@supabase/supabase-js";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { Feather } from "@expo/vector-icons";
// import Footer from "./footer";

// const supabase = createClient(
//   "https://cqdinxweotvfamknmgap.supabase.co",
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U"
// );

// const Report = () => {
//   const [startDate, setStartDate] = useState(new Date());
//   const [endDate, setEndDate] = useState(new Date())
//   const [totalSales, setTotalSales] = useState(0);
//   const [totalCash, setTotalCash] = useState(0);
//   const [totalCard, setTotalCard] = useState(0);
//   const [totalOnline, setTotalOnline] = useState(0);
//   const [showStartPicker, setShowStartPicker] = useState(false);
//   const [showEndPicker, setShowEndPicker] = useState(false);

//   const fetchTotalSales = async () => {
//     if (!startDate || !endDate) return;

//     try {
//       const startDateTime = new Date(startDate);
//       startDateTime.setHours(0, 0, 0, 0);
//       const startISO = startDateTime.toISOString();

//       const endDateTime = new Date(endDate);
//       endDateTime.setHours(23, 59, 59, 999);
//       const endISO = endDateTime.toISOString();

//       const { data, error } = await supabase
//         .from("Orders")
//         .select(
//           "grand_total, cash_amount, card_amount, online_amount, is_payment, created_at"
//         )
//         .gte("created_at", startISO)
//         .lte("created_at", endISO)
//         .eq("is_payment", true);

//       if (error) throw error;

//       // Calculate totals
//       const totals = data.reduce(
//         (acc, order) => {
//           acc.totalSales += order.grand_total || 0;
//           acc.totalCash += order.cash_amount || 0;
//           acc.totalCard += order.card_amount || 0;
//           acc.totalOnline += order.online_amount || 0;
//           return acc;
//         },
//         { totalSales: 0, totalCash: 0, totalCard: 0, totalOnline: 0 }
//       );

//       // Update state
//       setTotalSales(totals.totalSales);
//       setTotalCash(totals.totalCash);
//       setTotalCard(totals.totalCard);
//       setTotalOnline(totals.totalOnline);
//     } catch (error) {
//       console.error("Error fetching total sales:", error.message);
//     }
//   };

//   const isButtonDisabled = !startDate || !endDate;
//   useEffect(() => {
//     if (startDate && endDate) {
//       fetchTotalSales();
//     }
//   }, [startDate, endDate]);
//   return (
//     <>
//       <View style={styles.container}>
//         <Text style={styles.title}>📊 Sales Report</Text>

//         <View style={styles.dateContainer}>
//           <TouchableOpacity
//             onPress={() => setShowStartPicker(true)}
//             style={styles.dateButton}
//           >
//             <Feather name="calendar" size={20} color="#6c757d" />
//             <Text style={styles.dateButtonText}>
//               {startDate ? startDate.toDateString() : "Select Start Date"}
//             </Text>
//             {startDate && (
//               <Feather name="check-circle" size={20} color="#28a745" />
//             )}
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() => setShowEndPicker(true)}
//             style={styles.dateButton}
//           >
//             <Feather name="calendar" size={20} color="#6c757d" />
//             <Text style={styles.dateButtonText}>
//               {endDate ? endDate.toDateString() : "Select End Date"}
//             </Text>
//             {endDate && (
//               <Feather name="check-circle" size={20} color="#28a745" />
//             )}
//           </TouchableOpacity>
//         </View>

//         {showStartPicker && (
//           <DateTimePicker
//             value={startDate || new Date()}
//             mode="date"
//             display="default"
//             onChange={(event, date) => {
//               setShowStartPicker(false);
//               date && setStartDate(date);
//             }}
//           />
//         )}

//         {showEndPicker && (
//           <DateTimePicker
//             value={endDate || new Date()}
//             mode="date"
//             display="default"
//             onChange={(event, date) => {
//               setShowEndPicker(false);
//               date && setEndDate(date);
//             }}
//           />
//         )}


//         <View style={styles.tableContainer}>
//           <Text style={styles.tableTitle}>Payment Breakdown</Text>
//           <View style={styles.table}>
        
//             <View style={styles.row}>
//               <Text style={styles.cell}>Cash</Text>
//               <Text style={styles.cell}>₹{ " "}{totalCash.toFixed(2)}</Text>
//             </View>
//             <View style={styles.row}>
//               <Text style={styles.cell}>Card</Text>
//               <Text style={styles.cell}>₹{" "}{totalCard.toFixed(2)}</Text>
//             </View>
//             <View style={styles.row}>
//               <Text style={styles.cell}>Online</Text>
//               <Text style={styles.cell}>₹{" "}{totalOnline.toFixed(2)}</Text>
//             </View>
//           </View>
//         </View>
//         <View style={styles.salesCard}>
//           <Text style={styles.salesTitle}>Total Sales</Text>
//           <View style={styles.amountContainer}>
//             <Text style={styles.currencySymbol}>₹</Text>
//             <Text style={styles.amount}>
//               {totalSales.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
//             </Text>
//           </View>
//           <Text style={styles.dateRangeText}>
//             {startDate?.toDateString()} - {endDate?.toDateString()}
//           </Text>
//         </View>

      
//       </View>
//       <Footer />
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 25,
//     backgroundColor: "#f8f9fa",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 50,
//   },
//   title: {
//     fontSize: 15,
//     fontWeight: "700",
//     color: "#2c3e50",
//     marginVertical: 20,
//     textAlign: "center",
//   },
//   dateContainer: {
//     width: "100%",
//     marginBottom: 20,
//   },
//   dateButton: {
//     backgroundColor: "white",
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 10,
//     borderRadius: 12,
//     marginVertical: 10,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   dateButtonText: {
//     flex: 1,
//     marginLeft: 10,
//     fontSize: 12,
//     color: "#495057",
//   },
//   fetchButton: {
//     backgroundColor: "#007bff",
//     padding: 10,
//     borderRadius: 10,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   disabledButton: {
//     backgroundColor: "#a0a0a0",
//     shadowColor: "transparent",
//   },
//   buttonText: {
//     color: "white",
//     fontWeight: "600",
//     fontSize: 12,
//   },
//   salesCard: {
//     backgroundColor: "white",
//     padding: 25,
//     borderRadius: 16,
//     marginTop: 30,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 5,
//     width: "100%",
//   },
//   salesTitle: {
//     fontSize: 13,
//     color: "#6c757d",
//     marginBottom: 10,
//   },
//   amountContainer: {
//     flexDirection: "row",
//     alignItems: "baseline",
//     marginBottom: 8,
//   },
//   currencySymbol: {
//     fontSize: 28,
//     color: "#28a745",
//     marginRight: 5,
//     fontWeight: "600",
//   },
//   amount: {
//     fontSize: 28,
//     fontWeight: "800",
//     color: "#2c3e50",
//   },
//   dateRangeText: {
//     color: "#868e96",
//     fontSize: 12,
//     marginTop: 5,
//   },
//   tableContainer: {
//     marginTop: 20,
//     width: "100%",
//     backgroundColor: "white",
//     borderRadius: 10,
//     padding: 15,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 3,
//   },
//   tableTitle: {
//     fontSize: 12,
//     textAlign: "center",
//     marginBottom: 10,
//   },
//   table: {
//     borderWidth: 1,
//     borderColor: "#ddd",
//     borderRadius: 5,
//   },
//   row: {
//     flexDirection: "row",
//     justifyContent: "space-between", // ✅ Added to space out Method and Amount
//     borderBottomWidth: 1,
//     borderBottomColor: "#ddd",
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//   },
//   cellHeader: {
//     fontSize: 12,
//     textAlign: "left",
//   },
//   cell: {
//     fontSize: 12,
//     textAlign: "left",
//   },
// });

// export default Report;


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
      const startDateTime = new Date(startDate);
      startDateTime.setHours(0, 0, 0, 0);
      const startISO = startDateTime.toISOString();

      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      const endISO = endDateTime.toISOString();

      const { data, error } = await supabase
        .from("Orders")
        .select(
          "grand_total, cash_amount, card_amount, online_amount, is_payment, created_at"
        )
        .gte("created_at", startISO)
        .lte("created_at", endISO)
        .eq("is_payment", true);

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
    } catch (error) {
      console.error("Error fetching total sales:", error.message);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchTotalSales();
    }
  }, [startDate, endDate]);

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

        <View style={styles.dateContainer}>
          <TouchableOpacity
            onPress={() => setShowStartPicker(true)}
            style={styles.dateButton}
          >
            <Feather name="calendar" size={20} color="#6c757d" />
            <Text style={styles.dateButtonText}>
              {startDate.toDateString()}
            </Text>
            <Feather name="check-circle" size={20} color="#28a745" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowEndPicker(true)}
            style={styles.dateButton}
          >
            <Feather name="calendar" size={20} color="#6c757d" />
            <Text style={styles.dateButtonText}>
              {endDate.toDateString()}
            </Text>
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

        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Payment Breakdown</Text>
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={styles.cell}>Cash</Text>
              <Text style={styles.cell}>₹ {totalCash.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>Card</Text>
              <Text style={styles.cell}>₹ {totalCard.toFixed(2)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.cell}>Online</Text>
              <Text style={styles.cell}>₹ {totalOnline.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.salesCard}>
          <Text style={styles.salesTitle}>Total Sales</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.amount}>
              {totalSales.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            </Text>
          </View>
          <Text style={styles.dateRangeText}>
            {startDate.toDateString()} - {endDate.toDateString()}
          </Text>
        </View>
      </ScrollView>
      <Footer />
    </>
  );
};

const styles = StyleSheet.create({
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