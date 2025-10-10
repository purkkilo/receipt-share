import { StyleSheet } from "react-native";

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function TabTwoScreen() {
  const [receipts, setReceipts] = useState<any[]>([]);

  const loadReceipts = async () => {
    try {
      // Get all keys and filter for keys that represent individual receipts
      const allKeys = await AsyncStorage.getAllKeys();
      const receiptKeys = allKeys.filter((key) => key.startsWith("@receipt_"));
      // Load all receipts at once
      const receiptsRaw = await AsyncStorage.multiGet(receiptKeys);
      const receipts = receiptsRaw
        .map(([key, value]) => (value ? JSON.parse(value) : null))
        .filter((receipt) => receipt !== null);
      console.log("Receipts loaded successfully. Total:", receipts.length);
      // You can now use these receipts to set a state for a list of receipts if needed:
      setReceipts(receipts);
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  useEffect(() => {
    // Load all the receipts to choose from
    loadReceipts();
  }, []);

  function chooseReceipt(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView
        style={{
          alignItems: "center",
          marginTop: 20,
          marginBottom: 10,
        }}
      >
        <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
          Jaa kulut
        </ThemedText>
        <ThemedText style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
          Valitse kuitti ja jaa kulut ystäviesi kesken
        </ThemedText>
      </ThemedView>
      <ThemedView style={{ alignItems: "center", marginTop: 30 }}>
        <ThemedText
          style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}
        >
          Tallennetut kuitit
        </ThemedText>
        {receipts.length === 0 ? (
          <ThemedText style={{ fontSize: 14, color: "#888" }}>
            Ei tallennettuja kuitteja
          </ThemedText>
        ) : (
          receipts.map((receipt, index) => (
            <ThemedView
              key={index}
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 8,
                padding: 10,
                marginBottom: 10,
                width: "90%",
              }}
            >
              <ThemedView
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 10,
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    alignSelf: "center",
                  }}
                >
                  Kuitti {index + 1}
                </ThemedText>
                <ThemedText
                  style={{ fontSize: 14, color: "#666", alignSelf: "center" }}
                >
                  {new Date(receipt.timestamp).toLocaleString()}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {receipt.productTotal.toFixed(2)}€
                </ThemedText>
              </ThemedView>
              <ThemedButton
                text="Valitse"
                color="#007aff"
                style={{ marginTop: 10 }}
                onPress={chooseReceipt}
              ></ThemedButton>
            </ThemedView>
          ))
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});
