import { ThemedView } from "@/components/themed-view";
import { calculateShares, Receipt } from "@/utils/util";
import { useCallback, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Button, Chip, MD3Colors, Modal, Portal } from "react-native-paper";
import { ThemedText } from "./themed-text";

interface ReceiptListProps {
  receipts: Receipt[];
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
  const [searchQuery, setSearchQuery] = useState("");

  const renderItem = useCallback(
    ({ item: receipt, index }: { item: Receipt; index: number }) => (
      <ThemedView
        key={index}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 5,
          marginHorizontal: 10,
          marginVertical: 5,
        }}
      >
        <ThemedText
          style={{ fontSize: 14, color: "#666", alignSelf: "center" }}
        >
          {new Date(receipt.timestamp).toLocaleString()}
        </ThemedText>
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

          <ThemedText style={styles.currencyContainer}>
            {receipt.productTotal.toFixed(2)}€
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {receipt.sharers?.map((sharer: any, sIndex: number) => {
            return (
              <Chip icon={"account"} key={sIndex} mode="outlined">
                {sharer.name}{" "}
                {calculateShares(receipt, receipt.products).sharerTotals[
                  sharer.name
                ]?.toFixed(2)}
                €
              </Chip>
            );
          })}
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
    ),
    [calculateShares, showModal, chooseReceipt]
  );

  const keyExtractor = useCallback((item: Receipt, index: number) => {
    // ensure a string is always returned
    if (item.id !== undefined && item.id !== null) return item.id.toString();
    return String(item.timestamp ?? index);
  }, []);

  return (
    <ThemedView style={{ alignItems: "center", marginBottom: 90 }}>
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
      <FlatList
        data={receipts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={(_: any, index: number) => ({
          length: 60,
          offset: 60 * index,
          index,
        })}
        maxToRenderPerBatch={12}
        initialNumToRender={12}
        windowSize={12}
        ListHeaderComponent={() => (
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 10,
              alignSelf: "center",
            }}
          >
            Tallennetut kuitit
          </ThemedText>
        )}
        ListEmptyComponent={() => (
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
        )}
      ></FlatList>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    marginTop: 5,
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
  subtitle: { fontSize: 12, color: "#888" },
  currencyContainer: {
    borderWidth: 1,
    backgroundColor: "rgba(148, 255, 157, 0.1)",
    borderColor: "rgba(148, 255, 157, 0.4)",
    padding: 5,
    borderRadius: 5,
    justifyContent: "flex-end",
  },
});
