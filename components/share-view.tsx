import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useEffect } from "react";
import { ThemedButton } from "./themed-button";
import { ThemedText } from "./themed-text";

interface ShareViewProps {
  receipt: any;
  setShareView: (isOpen: boolean) => void;
}

export default function ShareView({ receipt, setShareView }: ShareViewProps) {
  useEffect(() => {
    console.log(receipt.sharers);
  });
  // TODO: Sharing functionalities
  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedButton
        text="Takaisin"
        color="gray"
        onPress={() => setShareView(false)}
      ></ThemedButton>
      <ThemedView>
        {receipt.sharers?.map((sharer: any, index: number) => (
          <ThemedText key={index}>
            {index + 1} {sharer.label}
          </ThemedText>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
