import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
    await AsyncStorage.removeItem("@token");
    await AsyncStorage.removeItem("userName");
    await AsyncStorage.removeItem("role");
    await AsyncStorage.removeItem("waiter");
    await AsyncStorage.removeItem("admin");
    await AsyncStorage.removeItem("captain");
    await GoogleSignin.signOut(); // Clear Google Sign-In session

    router.push("/"); // Navigate to home on confirmation
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
              name="home"
              size={17}
              color={pathname === "/report" ? "#007BFF" : "gray"}
            />
            <Text
              style={[
                styles.text,
                pathname === "/report" && styles.selectedText,
              ]}
            >
              Home
            </Text>
          </View>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => handleTabPress("/customer")}>
        <View style={styles.footerItem}>
          <FontAwesome
            name="user"
            size={15}
            color={pathname === "/customer" ? "#007BFF" : "gray"}
          />
          <Text
            style={[
              styles.text,
              pathname === "/customer" && styles.selectedText,
            ]}
          >
            customer
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleTabPress("/billing")}>
        <View style={styles.footerItem}>
          <FontAwesome
            name="bell"
            size={15}
            color={pathname === "/billing" ? "#007BFF" : "gray"}
          />
          <Text
            style={[
              styles.text,
              pathname === "/billing" && styles.selectedText,
            ]}
          >
            Billing
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleTabPress("/appointment")}>
        <View style={styles.footerItem}>
          <FontAwesome
            name="table"
            size={15}
            color={pathname === "/appointment" ? "#007BFF" : "gray"}
          />
          <Text
            style={[
              styles.text,
              pathname === "/appointment" && styles.selectedText,
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
