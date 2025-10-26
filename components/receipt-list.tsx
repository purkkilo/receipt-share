import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { Button, MD3Colors, Modal, Portal } from "react-native-paper";
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
  const [showDeleteMessage, setShowDeleteMessage] = useState<boolean>(false);
  const showModal = () => setShowDeleteMessage(true);
  const hideModal = () => setShowDeleteMessage(false);
  const [toDelete, setToDelete] = useState<any>(null);

  return (
    <ThemedView style={{ alignItems: "center", marginTop: 30 }}>
      <Portal>
        <Modal
          visible={showDeleteMessage}
          contentContainerStyle={styles.confirmBox}
          dismissableBackButton
        >
          <ThemedView
            style={{
              padding: 30,
              gap: 20,
              backgroundColor: MD3Colors.secondary10,
              alignItems: "center",
            }}
          >
            <ThemedText type="defaultSemiBold">
              Oletko varma että haluat poistaa kuitin?
            </ThemedText>
            {toDelete ? (
              <>
                <ThemedText type="title">{toDelete?.receipt.name}</ThemedText>
                <ThemedText type="subtitle">
                  {new Date(toDelete.receipt.timestamp).toLocaleString()}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText>Poistetaan...</ThemedText>
              </>
            )}

            <ThemedView
              style={{
                flexDirection: "row",
                gap: 100,
              }}
            >
              <Button icon="cancel" mode="contained" onPress={hideModal}>
                Peruuta
              </Button>
              <Button
                icon="delete"
                mode="contained"
                textColor={MD3Colors.error30}
                onPress={() => {
                  if (toDelete) {
                    hideModal();
                    deleteReceipt(toDelete.receipt, toDelete.index);
                    setToDelete(null);
                  }
                }}
              >
                Poista
              </Button>
            </ThemedView>
          </ThemedView>
        </Modal>
      </Portal>
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
          <Button
            mode="contained"
            icon="receipt-text-arrow-right"
            style={{ marginTop: 20 }}
            onPress={() => {
              navigation.navigate("receipt");
            }}
          >
            Siirry luomaan kuitti
          </Button>
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
              <Button
                compact
                textColor={MD3Colors.error50}
                icon="delete"
                mode="text"
                onPress={() => {
                  setToDelete({ receipt, index });
                  showModal();
                }}
              >
                Poista
              </Button>
              <Button
                compact
                textColor={"#a0a82aff"}
                icon="pencil"
                mode="text"
                onPress={() => {
                  navigation.navigate("receipt", { receipt: receipt });
                }}
              >
                Muokkaa
              </Button>
              <Button
                compact
                icon="share"
                mode="text"
                onPress={() => {
                  chooseReceipt(receipt);
                }}
              >
                Jaa kulut
              </Button>
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
    gap: 5,
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
  confirmBox: { padding: 10 },
});
