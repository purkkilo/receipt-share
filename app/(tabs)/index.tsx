import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractProducts } from "@/utils/parseTokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  Button,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [data, setData] = useState<any>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [totalToValidate, setTotalToValidate] = useState<number>(0);
  const [showImage, setShowImage] = useState<boolean>(false);

  const pickImage = async (reset: boolean) => {
    if (reset) setData([]);
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      //allowsEditing: true,
      //aspect: [4, 3],
      quality: 1,
    }).then((result) => {
      setImage(result?.assets?.[0]?.uri || null);
      readProducts(result?.assets?.[0]?.uri || "");
      setShowImage(true);
    });
  };

  const readProducts = async (imageUri: string) => {
    if (!imageUri) {
      return;
    }
    const imageResult = await MlkitOcr.detectFromUri(imageUri);
    const products = extractProducts(imageResult);

    products.forEach((element) => {
      console.log(element.name, element.price);
    });

    if (products.length) {
      // Find index of the product with name containing "YHTEENSÄ"
      const tIndex = products.findIndex((p) =>
        p.name.toUpperCase().includes("YHTEENSÄ")
      );
      // If found, set total and remove that product from the list
      if (tIndex >= 0) {
        setTotal(products[tIndex].price);
        products.splice(tIndex, 1);
      }

      let total = products.reduce((sum, p) => {
        return sum + p.price;
      }, 0);
      if (totalToValidate > 0) {
        total += totalToValidate;
      }

      setTotalToValidate(total);
      setData((prev: []) => [...(prev || []), ...products]);
      console.log(products[0]);
    }
  };

  // FIXME: input is not letting input commas or points
  // TODO: ADD ability to remove individual products
  const onChangeText = (index: number, field: string) => (text: string) => {
    const newData = [...data];
    if (field === "price") {
      const parsed = parseFloat(text.replace(",", "."));
      newData[index][field] = isNaN(parsed) ? null : parsed;
      setTotalToValidate(
        newData.reduce((sum, p) => {
          return sum + p.price;
        }, 0)
      );
    } else {
      newData[index][field] = text;
    }
    setData(newData);
  };

  function removeData(): void {
    setImage(null);
    setData([]);
    setTotal(null);
    setTotalToValidate(0);
  }

  // FIXME: This is not working properly
  const removeAtIndex = (index: number) => {
    const newData = [...data];
    const removed = newData.splice(index, 1);
    console.log("removed", removed);
    setData(newData);
    setTotalToValidate(
      newData.reduce((sum, p) => {
        return sum + p.price;
      }, 0)
    );
  };

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: { name: string; price: number | null };
      index: number;
    }) => (
      <ThemedView style={styles.stepContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tuotteen nimi"
          value={item.name}
          onChangeText={onChangeText(data.indexOf(item), "name")}
        ></TextInput>
        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="Hinta"
          keyboardType="numeric"
          value={item.price ? item.price.toString().replace(".", ",") : ""}
          onChangeText={onChangeText(data.indexOf(item), "price")}
        ></TextInput>
        <TouchableOpacity
          onPress={() => removeAtIndex(index)}
          style={{ padding: 10 }}
        >
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>
      </ThemedView>
    ),
    []
  );

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedView style={styles.container}>
        {showImage && image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="contain"
          />
        ) : (
          <ThemedText>
            {showImage ? "Kuittia ei valittuna" : "Kuva piilotettu"}
          </ThemedText>
        )}

        {image ? (
          <ThemedView
            style={{
              marginBottom: 10,
              paddingRight: 20,
              paddingLeft: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Button
              title="Lue lisää"
              onPress={() => {
                pickImage(false);
              }}
            />
            <Button
              title={showImage ? "Piilota kuva" : "Näytä kuva"}
              onPress={() => {
                setShowImage(!showImage);
              }}
            />
            <Button title="Pyyhi tiedot" color="red" onPress={removeData} />
          </ThemedView>
        ) : (
          <ThemedView style={{ marginBottom: 20 }}>
            <Button
              title="Valitse kuva kuitista"
              onPress={() => {
                pickImage(true);
              }}
            />
          </ThemedView>
        )}
        <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
          Kuitti
        </ThemedText>
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "88%",
          }}
        >
          <ThemedText style={{ fontSize: 18 }}>Nimi</ThemedText>
          <ThemedText style={{ fontSize: 18 }}>Hinta</ThemedText>
        </ThemedView>
        <FlatList
          style={{ width: "100%" }}
          data={data}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          windowSize={21}
          ListEmptyComponent={() => (
            <ThemedText>Tuotteita ei luettu vielä</ThemedText>
          )}
          ListFooterComponent={() => (
            <>
              <Button
                title="Lisää tuote"
                color="green"
                onPress={() => setData([...data, { name: "", price: null }])}
              />
              <ThemedView style={{ alignItems: "center", marginTop: 20 }}>
                <ThemedText>Laskettu kuitista: {totalToValidate}€</ThemedText>
              </ThemedView>
            </>
          )}
          contentContainerStyle={{ padding: 20 }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
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
    width: "95%",
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 16,
  },
  input: {
    color: "white",
    backgroundColor: "#333",
    borderWidth: 1,
    padding: 10,
    width: "50%",
  },
  priceInput: {
    width: "30%",
  },
});
