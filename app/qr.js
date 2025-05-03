import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cqdinxweotvfamknmgap.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZGlueHdlb3R2ZmFta25tZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTM4MTAsImV4cCI6MjA1NzUyOTgxMH0.dF8KE5aCGxaEEVXB-6SIzR_7cs1UgmgZhy7cql1aK3U";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Qr() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Since you know the exact filename, we can directly get its public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('qr-codes')
        .getPublicUrl('QR-code.png');

      // Verify the URL is accessible
      const response = await fetch(publicUrl);
      if (!response.ok) throw new Error('Failed to load QR code image');

      setQrCodes([{
        url: publicUrl,
        name: 'QR-code.png',
        id: '1' // Since we only have one file, we can use a simple ID
      }]);

    } catch (err) {
      console.error("Error fetching QR code:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Loading QR code...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchQRCodes}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Text style={styles.title}>Your QR Code</Text>
      
      {qrCodes.length === 0 ? (
        <Text style={styles.emptyText}>No QR code found.</Text>
      ) : (
        qrCodes.map((qrCode) => (
          <View key={qrCode.id} style={styles.qrContainer}>
            <Image
              source={{ uri: qrCode.url }}
              style={styles.qrImage}
              resizeMode="contain"
              onError={() => setError('Failed to load QR code image')}
            />
            <Text style={styles.qrName}>{qrCode.name}</Text>
            <Text style={styles.urlText}>URL: {qrCode.url}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  scrollContainer: {
    padding: 20,
    alignItems: "center"
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  qrContainer: {
    marginBottom: 30,
    alignItems: 'center'
  },
  qrImage: {
    width: 300,
    height: 300,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  qrName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5
  },
  urlText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 10
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
});



