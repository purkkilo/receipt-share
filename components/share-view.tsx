import {
  FlatList,
  ListRenderItem,
  Share,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import { ThemedView } from "@/components/themed-view";
import { saveReceiptToStorage } from "@/utils/storageApi";
import { Product, Receipt, calculateShares } from "@/utils/util";
import { useCallback, useEffect, useState } from "react";
import { Button, Checkbox, Divider, Icon, Tooltip } from "react-native-paper";
import { ThemedText } from "./themed-text";

interface ShareViewProps {
  receipt: Receipt;
  setShareView: (isOpen: boolean) => void;
}

const ProductShareList = ({ receipt }: { receipt: Receipt }) => {
  const [productSharings, setProductSharings] = useState<Product[]>(
    receipt.products.map((product: any) => ({
      ...(product as Product),
      sharers: product.sharers || [],
    }))
  );

  const [individualTotals, setIndividualTotals] = useState<{
    [key: string]: number;
  }>({});
  const [sharerTotals, setSharerTotals] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    if (receipt.sharers.length === 0) return;
    const { individualTotals, sharerTotals } = calculateShares(
      receipt,
      productSharings
    );
    setIndividualTotals(individualTotals);
    setSharerTotals(sharerTotals);
  }, [productSharings]);

  const handleSharerSelect = async (productId: number, sharerName: string) => {
    let updatedProducts: Product[] = [];
    setProductSharings((prevProducts: Product[]) => {
      updatedProducts = prevProducts.map((product) => {
        if (product.id === productId) {
          const newSharers = product.sharers.includes(sharerName)
            ? product.sharers.filter((s: string) => s !== sharerName)
            : [...product.sharers, sharerName];
          return { ...product, sharers: newSharers };
        }
        return product;
      });
      return updatedProducts;
    });
    // Update receipt in storage
    const updatedReceipt = {
      ...receipt,
      products: updatedProducts,
    };
    await saveReceiptToStorage(updatedReceipt)
      .finally(() => {
        // Update receipt reference in receipt-list
        receipt.products = updatedProducts;
      })
      .catch((err) => console.error("Failed to save updated receipt:", err));
  };
  const shareToOthers = async (copyAll: boolean, sharerName?: string) => {
    let clipboardText = `${receipt.name}\n`;
    if (copyAll) {
      Object.keys(sharerTotals).forEach((name) => {
        clipboardText += `${name}: ${sharerTotals[name].toFixed(2)}€\n`;
      });
    } else if (sharerName) {
      clipboardText += `${sharerName}: ${sharerTotals[sharerName].toFixed(
        2
      )}€\n`;
    }

    clipboardText += `Yhteensä: ${receipt.productTotal.toFixed(2)}€`;
    await Share.share({
      message: clipboardText,
    });
  };

  // First, memoize the renderItem function at the top level of your component
  const renderItem = useCallback<ListRenderItem<Product>>(
    ({ item: product }) => (
      <ThemedView
        style={{
          gap: 5,
          borderColor: "#555",
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
          marginBottom: 10,
        }}
      >
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 5,
          }}
        >
          <ThemedText
            type="default"
            style={{
              borderWidth: 1,
              borderColor: "rgba(162, 184, 241, 0.4)",
              backgroundColor: "rgba(162, 184, 241, 0.2)",
              padding: 5,
              borderRadius: 5,
            }}
          >
            {product.name}
          </ThemedText>
          <ThemedText
            type="default"
            style={{
              borderWidth: 1,
              backgroundColor: "rgba(148, 255, 157, 0.1)",
              borderColor: "rgba(148, 255, 157, 0.4)",
              padding: 5,
              borderRadius: 5,
              justifyContent: "flex-end",
            }}
          >
            {product.price}€
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            alignSelf: "center",
          }}
        >
          {receipt.sharers.map((sharer: any, idx: number) => (
            <ThemedView
              key={idx}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderColor: "#888",
                borderWidth: 1,
                borderRadius: 8,
                paddingVertical: 2,
                paddingHorizontal: 5,
              }}
            >
              <ThemedText type="default" style={{ marginRight: 8 }}>
                {sharer.name}
              </ThemedText>
              <Checkbox
                status={
                  product.sharers.includes(sharer.name)
                    ? "checked"
                    : "unchecked"
                }
                onPress={() => handleSharerSelect(product.id, sharer.name)}
              ></Checkbox>
            </ThemedView>
          ))}
        </ThemedView>
      </ThemedView>
    ),
    []
  ); // Empty dependency array since it doesn't depend on any props

  // Memorize the keyExtractor
  const keyExtractor = useCallback(
    (item: Product) => item.id?.toString() || item.name,
    []
  );

  const listHeader = useCallback(() => {
    return (
      <ThemedView
        style={{
          marginBottom: 10,
          alignItems: "center",
        }}
        key={"header"}
      >
        <ThemedView
          style={{
            marginTop: 10,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <ThemedText type="subtitle" style={{ alignSelf: "center" }}>
            Jaetut kulut
          </ThemedText>
          {Object.keys(sharerTotals).map((sharerName, index) => (
            <ThemedView key={index}>
              <ThemedView
                style={{
                  flexDirection: "row",
                  gap: 20,
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 5,
                }}
              >
                <ThemedText type="default">{sharerName}</ThemedText>

                <ThemedText type="subtitle" style={styles.subtitle}>
                  (Omat: {individualTotals[sharerName]?.toFixed(2) || "0.00"}
                  €)
                </ThemedText>
                <Tooltip title="Jaa summa">
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 3,
                    }}
                    onPress={() => {
                      shareToOthers(false, sharerName);
                    }}
                  >
                    <ThemedText type="default" style={styles.currencyContainer}>
                      {sharerTotals[sharerName].toFixed(2)}€
                    </ThemedText>
                    <Icon
                      source={"share-variant"}
                      color="white"
                      size={14}
                    ></Icon>
                  </TouchableOpacity>
                </Tooltip>
              </ThemedView>
              <Divider bold />
            </ThemedView>
          ))}
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottomColor: "#ccc",
              marginTop: 10,
            }}
          >
            <ThemedText>Yhteensä</ThemedText>
            <Tooltip title="Jaa kuitin summat">
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 3,
                }}
                onPress={() => {
                  shareToOthers(true);
                }}
              >
                <ThemedText style={styles.currencyContainer}>
                  {receipt.productTotal.toFixed(2)}€
                </ThemedText>
                <Icon source={"share-variant"} color="white" size={14}></Icon>
              </TouchableOpacity>
            </Tooltip>
          </ThemedView>
        </ThemedView>

        <ThemedText type="subtitle">Tuotteet</ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Valitse listalta nimet niiden tuotteiden kohdalta,
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          joita ei jaeta kaikkien kesken
        </ThemedText>
      </ThemedView>
    );
  }, [sharerTotals, individualTotals]);

  return (
    <ThemedView style={{ alignItems: "center" }}>
      <FlatList
        style={{ maxHeight: 450, width: "95%" }}
        data={productSharings}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        disableVirtualization
      />
    </ThemedView>
  );
};

export default function ShareView({ receipt, setShareView }: ShareViewProps) {
  return (
    <ThemedView style={{ flex: 1 }}>
      <Button
        style={{ width: "80%", alignSelf: "center" }}
        icon={"arrow-left"}
        mode="contained"
        onPress={() => setShareView(false)}
      >
        Takaisin
      </Button>
      <ThemedView style={{ alignItems: "center", marginTop: 30 }}>
        <ThemedText type="title">{receipt.name}</ThemedText>
        <ThemedText type="subtitle">
          {new Date(receipt.timestamp).toLocaleString()}
        </ThemedText>
      </ThemedView>

      <ProductShareList receipt={receipt} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
