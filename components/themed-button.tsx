import { StyleSheet, TouchableOpacity } from "react-native";
import { ThemedText } from "./themed-text";

export type ThemedButtonProps = {
  onPress: () => void;
  text: string;
  color?: string;
  style?: object;
};

export function ThemedButton({
  onPress,
  text,
  color,
  style,
}: ThemedButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.button, { backgroundColor: color }, style]}
    >
      <ThemedText style={styles.buttonText}>{text}</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    elevation: 10,
    backgroundColor: "#009688",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    alignSelf: "center",
    textTransform: "uppercase",
  },
});
