import { StyleSheet } from "react-native";

import ReceiptList from "@/components/receipt-list";
import ShareView from "@/components/share-view";
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
  const [shareView, setShareView] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>();

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

  function chooseReceipt(receipt: any): void {
    setReceipt(receipt);
    setShareView(true);
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
      {shareView ? (
        <ShareView receipt={receipt} setShareView={setShareView}></ShareView>
      ) : (
        <ReceiptList
          receipts={receipts}
          navigation={navigation}
          deleteReceipt={deleteReceipt}
          chooseReceipt={chooseReceipt}
        ></ReceiptList>
      )}
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
