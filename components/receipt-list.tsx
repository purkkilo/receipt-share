import { Pressable, StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useState } from "react";
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
  const [showDeleteMessage, setShowDeleteMessage] = useState<boolean>(true);
  const [showEditMessage, setShowEditMessage] = useState<boolean>(false);
  const [showChooseMessage, setShowChooseMessage] = useState<boolean>(false);
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
            }}
          >
            <ThemedView
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 5,
                gap: 20,
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

            <ThemedView style={styles.buttonRow}>
              <Pressable
                style={styles.button}
                onHoverIn={() => {
                  setShowDeleteMessage(false);
                }}
                onHoverOut={() => {
                  setShowDeleteMessage(true);
                }}
              >
                <AntDesign name="delete" color="#5f0000ff" size={20} />
                <ThemedText style={styles.tooltip}>delete</ThemedText>
              </Pressable>
              <Pressable
                style={styles.button}
                onPress={() => {
                  deleteReceipt(receipt, index);
                }}
              >
                <AntDesign
                  name="edit"
                  color="#878a00ff"
                  size={20}
                  onPress={() => {
                    navigation.navigate("receipt", { receipt: receipt });
                  }}
                />
                <ThemedText style={styles.tooltip}>edit</ThemedText>
              </Pressable>
              <Pressable
                style={styles.button}
                onPress={() => {
                  chooseReceipt(receipt);
                }}
              >
                <AntDesign name="enter" color="#007aff" size={20} />
                <ThemedText style={styles.tooltip}>choose</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        ))
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    borderRadius: 8,
    padding: 5,
    color: "grey",
  },
});
