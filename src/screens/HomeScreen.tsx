import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { apiClient } from "../api/client";
import { StatusCard } from "../components/StatusCard";
import { theme } from "../theme/theme";

type HealthData = {
  service: string;
  environment: string;
  database: string;
  timestamp: string;
};

export default function HomeScreen() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHealth = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get<HealthData>("/health");
      setHealth(response.data);
    } catch (requestError) {
      setHealth(null);
      setError(requestError instanceof Error ? requestError.message : "Unable to reach backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>OnlineBooking</Text>
          <Text style={styles.title}>Booking app foundation is ready</Text>
          <Text style={styles.subtitle}>
            Expo frontend connected to an Express API base URL from environment configuration.
          </Text>
        </View>

        <StatusCard
          title="API Connection"
          message={loading ? "Checking backend status..." : error || "Backend responded successfully."}
          tone={error ? "error" : health ? "success" : "default"}
        >
          {loading ? <ActivityIndicator color={theme.colors.primary} /> : null}
          {!loading && health ? (
            <View style={styles.details}>
              <Text style={styles.detailText}>Service: {health.service}</Text>
              <Text style={styles.detailText}>Environment: {health.environment}</Text>
              <Text style={styles.detailText}>Database: {health.database}</Text>
            </View>
          ) : null}
        </StatusCard>

        <StatusCard title="API URL" message={apiClient.baseUrl} />

        <Pressable style={styles.button} onPress={loadHealth}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  container: {
    gap: 16,
    padding: 20
  },
  header: {
    gap: 8,
    marginBottom: 8
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  title: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  details: {
    gap: 4
  },
  detailText: {
    color: theme.colors.text,
    fontSize: 14
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 18
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700"
  }
});

