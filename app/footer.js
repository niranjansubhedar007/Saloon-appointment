import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useRouter, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Footer = () => {
  const router = useRouter();
  const pathname = usePathname(); // Get the current route
  const [role, setRole] = useState(null); // Store role from AsyncStorage

  const handleTabPress = (route) => {
    router.push(route);
  };
  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel pressed"),
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            await AsyncStorage.removeItem("@token");
            await AsyncStorage.removeItem("userName");
            await AsyncStorage.removeItem("role");
            await AsyncStorage.removeItem("waiter");
            await AsyncStorage.removeItem("admin");
            await AsyncStorage.removeItem("captain");
            await GoogleSignin.signOut(); // Clear Google Sign-In session
  
            router.push("/"); // Navigate to home on confirmation
          },
        },
      ]
    );
  };
  



  useEffect(() => {
    const fetchRole = async () => {
      const storedRole = await AsyncStorage.getItem("@role");
      setRole(storedRole);
    };

    fetchRole();
  }, []);

  return (
    <View style={styles.footer}>
      {role === "owner" && (
        <TouchableOpacity onPress={() => handleTabPress("/report")}>
          <View style={styles.footerItem}>
            <FontAwesome
              name="dollar"
              size={17}
              color={pathname === "/report" ? "#007BFF" : "gray"}
            />
            <Text
              style={[
                styles.text,
                pathname === "/report" && styles.selectedText,
              ]}
            >
              Sale
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() =>
          handleTabPress(
            role === "owner" ? "/ownerCustomer" : "/customer"
          )
        }
      >
        <View style={styles.footerItem}>
          <FontAwesome
            name="user"
            size={15}
            color={
              pathname === "/customer" || pathname === "/ownerCustomer"
                ? "#007BFF"
                : "gray"
            }
          />
          <Text
            style={[
              styles.text,
              (pathname === "/customer" ||
                pathname === "/ownerCustomer") &&
                styles.selectedText,
            ]}
          >
            customer
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          handleTabPress(
            role === "owner" ? "/ownerBilling" : "/billing"
          )
        }
      >
        <View style={styles.footerItem}>
          <FontAwesome
            name="money"
            size={15}
            color={
              pathname === "/billing" || pathname === "/ownerBilling"
                ? "#007BFF"
                : "gray"
            }
          />
          <Text
            style={[
              styles.text,
              (pathname === "/billing" ||
                pathname === "/ownerBilling") &&
                styles.selectedText,
            ]}
          >
            billing
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() =>
          handleTabPress(
            role === "owner" ? "/ownerAppointment" : "/appointment"
          )
        }
      >
        <View style={styles.footerItem}>
          <FontAwesome
            name="clipboard"
            size={15}
            color={
              pathname === "/appointment" || pathname === "/ownerAppointment"
                ? "#007BFF"
                : "gray"
            }
          />
          <Text
            style={[
              styles.text,
              (pathname === "/appointment" ||
                pathname === "/ownerAppointment") &&
                styles.selectedText,
            ]}
          >
            Appointment
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout}>
        <View style={styles.footerItem}>
          <FontAwesome
            name="sign-out"
            size={15}
            color={pathname === "/" ? "#007BFF" : "gray"}
          />
          <Text style={[styles.text, pathname === "/" && styles.selectedText]}>
            Logout
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  footerItem: {
    alignItems: "center",
  },
  text: {
    fontSize: 10,
    marginTop: 3,
    color: "gray",
  },
  selectedText: {
    color: "#007BFF",
  },
});

export default Footer;
