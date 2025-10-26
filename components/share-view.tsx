import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useEffect, useState } from "react";
import { ThemedButton } from "./themed-button";
import { ThemedText } from "./themed-text";

interface ShareViewProps {
  receipt: any;
  setShareView: (isOpen: boolean) => void;
}
//TODO: Make list so that every product has it's own selection, now it's shared
//TODO: Make the list scrollable
const ProductShareList = ({
  products,
  sharers,
}: {
  products: any[];
  sharers: any[];
}) => {
  const [selectedShares, setSelectedShares] = useState<
    Map<string, Set<number>>
  >(new Map(products.map((p) => [p.id, new Set()])));

  const toggle = (productId: string, sharerId: number) => {
    const next = new Map(selectedShares);
    const sharerSet = next.get(productId) || new Set();

    if (sharerSet.has(sharerId)) {
      sharerSet.delete(sharerId);
    } else {
      sharerSet.add(sharerId);
    }

    next.set(productId, sharerSet);
    setSelectedShares(next);
  };

  return (
    <>
      {products.map((product: any) => (
        <ThemedView
          key={product.id}
          style={{
            gap: 5,
            borderColor: "#555",
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            marginBottom: 10,
            width: "90%",
          }}
        >
          <ThemedText type="default">
            {product.name} - {product.price}€
          </ThemedText>
          <ThemedView
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {sharers.map((sharer: any, idx: number) => (
              <TouchableOpacity
                key={idx}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 10,
                }}
                onPress={() => toggle(product.id, idx)}
              >
                <ThemedView>
                  <ThemedText type="default" style={{ marginRight: 8 }}>
                    {`${sharer.name} ${
                      selectedShares.get(product.id)?.has(idx) ? "☑" : "☐"
                    }`}
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>
      ))}
    </>
  );
};

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
      <ThemedView style={{ alignItems: "center", marginTop: 30 }}>
        <ThemedText type="title">{receipt.name}</ThemedText>
        <ThemedText type="subtitle">
          {new Date(receipt.timestamp).toLocaleString()}
        </ThemedText>
      </ThemedView>
      <ThemedView
        style={{
          marginTop: 30,
          alignItems: "center",
        }}
      >
        <ProductShareList
          products={receipt.products}
          sharers={receipt.sharers}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({});
