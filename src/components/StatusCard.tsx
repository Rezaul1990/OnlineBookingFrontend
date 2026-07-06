import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

type StatusCardProps = {
  title: string;
  message: string;
  tone?: "default" | "success" | "warning" | "error";
  children?: ReactNode;
};

export function StatusCard({ title, message, tone = "default", children }: StatusCardProps) {
  return (
    <View style={[styles.card, styles[tone]]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    width: "100%"
  },
  default: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border
  },
  success: {
    backgroundColor: "#ecfdf3",
    borderColor: "#abefc6"
  },
  warning: {
    backgroundColor: "#fffaeb",
    borderColor: "#fedf89"
  },
  error: {
    backgroundColor: "#fef3f2",
    borderColor: "#fecdca"
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  message: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  content: {
    marginTop: 12
  }
});

