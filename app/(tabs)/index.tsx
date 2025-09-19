import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractProducts } from "@/utils/parseTokens";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Button, FlatList, StyleSheet, TextInput } from "react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [totalToValidate, setTotalToValidate] = useState<number | null>(null);
  const pickImage = async () => {
    setData(null);
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      //allowsEditing: true,
      //aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const imageResult = await MlkitOcr.detectFromUri(result.assets[0].uri);
      imageResult.sort(
        (a, b) =>
          a.bounding.top - b.bounding.top || a.bounding.left - b.bounding.left
      );
      const products = extractProducts(imageResult);

      const tIndex = products.findIndex((p) =>
        p.name.toUpperCase().includes("YHTEENSÄ")
      );

      if (tIndex >= 0) {
        setTotal(products[tIndex].price);
        products.splice(tIndex, 1);
      }

      setTotalToValidate(
        products.reduce((sum, p) => {
          if (p.price) {
            return sum + p.price;
          }
          return sum;
        }, 0)
      );

      setData(products);
    }
  };

  const onChangeText = (index: number, field: string) => (text: string) => {
    const newData = [...data];
    if (field === "price") {
      const parsed = parseFloat(text.replace(",", "."));
      newData[index][field] = isNaN(parsed) ? null : parsed;
      setTotalToValidate(
        newData.reduce((sum, p) => {
          if (p.price) {
            return sum + p.price;
          }
          return sum;
        }, 0)
      );
    } else {
      newData[index][field] = text;
    }
    setData(newData);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedView style={styles.container}>
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="contain"
          />
        )}
        <Button title="Pick an image from camera roll" onPress={pickImage} />
        <FlatList
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <ThemedView style={styles.stepContainer}>
              <ThemedText>
                {item.name} - {item.price}€
              </ThemedText>
              <TextInput
                style={styles.input}
                onChangeText={onChangeText(item.index, "name")}
                value={item.name || ""}
              />

              <TextInput
                style={styles.input}
                onChangeText={onChangeText(item.index, "price")}
                value={item.price || "0"}
              />
            </ThemedView>
          )}
          ListHeaderComponent={() => (
            <ThemedView style={styles.titleContainer}>
              <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
                Kuitin tuotteet
              </ThemedText>
            </ThemedView>
          )}
          ListEmptyComponent={() => (
            <ThemedText>Tuotteita ei luettu vielä</ThemedText>
          )}
          ListFooterComponent={() => (
            <ThemedView style={{ marginTop: 5 }}>
              <ThemedText>Yhteensä: {total ? total : 0}€</ThemedText>
              <ThemedText>
                Laskettu: {totalToValidate ? totalToValidate : 0}€
              </ThemedText>
            </ThemedView>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 16,
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
