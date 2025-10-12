import { StyleSheet } from "react-native";

import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";

export default function HomeScreen() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const navigation = useNavigation<any>();
  const route = useRoute();

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
      // You can now use these receipts to set a state for a list of receipts if needed:
      setReceipts(receipts);
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  const deleteReceipt = async (receipt: any, index: number) => {
    await AsyncStorage.removeItem("@receipt_" + receipt.timestamp)
      .then(() => {
        setReceipts(receipts.filter((r) => r.timestamp !== receipt.timestamp));
      })
      .catch((error) => {
        console.error("Error deleting receipt:", error);
      });
  };

  useEffect(() => {
    // Load all the receipts to choose from
    loadReceipts();
  }, [route.params]);

  function editReceipt(receipt: any): void {
    navigation.navigate("receipt", { receipt: receipt });
  }

  function chooseReceipt(receipt: any): void {
    console.log("choose:", receipt);
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
          <ThemedView
            style={{
              alignItems: "center",
            }}
          >
            <ThemedText style={{ fontSize: 14, color: "#888" }}>
              Ei tallennettuja kuitteja
            </ThemedText>
            <ThemedButton
              text="Siirry luomaan kuitti"
              style={{ marginTop: 20 }}
              onPress={() => {
                navigation.navigate("receipt");
              }}
              color="green"
            ></ThemedButton>
          </ThemedView>
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
                text="Muokkaa"
                color="#878a00ff"
                style={{ marginTop: 10 }}
                onPress={() => {
                  editReceipt(receipt);
                }}
              ></ThemedButton>
              <ThemedButton
                text="Valitse"
                color="#007aff"
                style={{ marginTop: 10 }}
                onPress={() => {
                  chooseReceipt(receipt);
                }}
              ></ThemedButton>
              <ThemedButton
                text="Poista"
                color="#5f0000ff"
                style={{ marginTop: 10 }}
                onPress={() => {
                  deleteReceipt(receipt, index);
                }}
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
