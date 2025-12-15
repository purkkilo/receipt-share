import { StyleSheet } from "react-native";

import ReceiptList from "@/components/receipt-list";
import ShareView from "@/components/share-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  deleteReceiptFromStorage,
  getAllReceiptsFromStorage,
} from "@/utils/storageApi";
import { Receipt } from "@/utils/util";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Searchbar } from "react-native-paper";

export default function HomeScreen() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [shareView, setShareView] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<Receipt>();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadReceipts = async () => {
    try {
      const receipts = await getAllReceiptsFromStorage();
      setReceipts(receipts.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error("Error loading receipts:", error);
    }
  };

  const deleteReceipt = async (receipt: any) => {
    try {
      await deleteReceiptFromStorage(receipt).then(() => {
        const updatedReceipts = receipts.filter(
          (r) => r.timestamp !== receipt.timestamp
        );
        setReceipts(updatedReceipts);
      });
    } catch (error) {
      console.error("Error deleting receipt:", error);
    }
  };

  useEffect(() => {
    // Load all the receipts to choose from
    loadReceipts();
  }, [route.params]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredReceipts = useMemo(() => {
    if (!normalizedQuery) return receipts;

    return receipts.filter((r) => {
      const haystack = [
        r.name,
        new Date(r.timestamp).toLocaleString(),
        ...(r.sharers?.map((s: any) => s?.name) ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [receipts, normalizedQuery]);

  function chooseReceipt(receipt: any): void {
    setReceipt(receipt);
    setShareView(true);
  }
  // TODO: Clean, add tests
  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedView
        style={{
          alignItems: "center",
          marginTop: 20,
          marginBottom: 10,
          padding: 10,
        }}
      >
        <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
          Jaa kulut
        </ThemedText>
        <ThemedText style={{ fontSize: 12, color: "#888", marginTop: 5 }}>
          Valitse kuitti ja jaa kulut ystäviesi kesken
        </ThemedText>
        <Searchbar
          placeholder="Hae"
          onChangeText={setSearchQuery}
          value={searchQuery}
        />
      </ThemedView>
      {shareView && receipt ? (
        <ShareView receipt={receipt} setShareView={setShareView}></ShareView>
      ) : (
        <ReceiptList
          receipts={filteredReceipts}
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
