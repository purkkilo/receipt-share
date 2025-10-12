import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { ThemedButton } from "./themed-button";
import { ThemedText } from "./themed-text";

interface ReceiptListProps {
  receipts: any[];
  navigation: any;
  chooseReceipt: (receipt: any) => void;
  deleteReceipt: (receipt: any, index: number) => void;
}

export default function ReceiptList({
  receipts,
  navigation,
  chooseReceipt,
  deleteReceipt,
}: ReceiptListProps) {
  return (
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
        receipts.map((receipt: any, index: number) => (
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
                {receipt.name}
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
                navigation.navigate("receipt", { receipt: receipt });
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
  );
}

const styles = StyleSheet.create({});
