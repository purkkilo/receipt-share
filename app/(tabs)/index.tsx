import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractProducts } from "@/utils/parseTokens";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MlkitOcr from "react-native-mlkit-ocr";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
  useSharedValue,
} from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { SafeAreaView } from "react-native-safe-area-context";
const width = Dimensions.get("window").width - 19;

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

export default function HomeScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [data, setData] = useState<any>([]);
  const [productTotal, setproductTotal] = useState<number>(0);
  const [showImage, setShowImage] = useState<boolean>(false);
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

  const onPressPagination = (index: number) => {
    carouselRef.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  const pickImage = async (reset: boolean) => {
    if (reset) {
      setData([]);
      setproductTotal(0);
      setImages([]);
    }
    let image = "";
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      //allowsEditing: true,
      //allowsMultipleSelection: true,
      quality: 1,
    })
      .then((result) => {
        image = result?.assets?.[0]?.uri || "";
        readProducts(image || "");
      })
      .finally(() => {
        setImages((prev) => [...prev, image]);
        carouselRef.current?.next();
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
      let total = products.reduce((sum, p) => {
        return sum + (p.price ?? 0);
      }, 0);
      // Add to existing total if there are already products
      if (productTotal > 0) {
        total += productTotal;
      }

      setproductTotal(total);
      setData((prev: []) => [...(prev || []), ...products]);
    }
  };

  // FIXME: input is not letting input commas or points
  // TODO: ADD ability to remove individual products
  const onChangeText = (index: number, field: string) => (text: string) => {
    const newData = [...data];
    console.log(text);
    try {
      if (!newData[index]) {
        console.warn(`Data at index ${index} is undefined`);
        return;
      }
      if (field === "price") {
        if (text.slice(-1) === ",") {
          // If input ends with a comma, store the raw string for now.
          newData[index][field] = text;
        } else {
          // Normalize input: remove thousands separators and unify decimal separator
          const normalized = text
            .replace(/\./g, "") // Remove all periods (assume as thousands separator)
            .replace(/,/g, "."); // Replace comma with period (as decimal separator)
          const parsed = parseFloat(normalized);
          newData[index][field] = isNaN(parsed) ? null : parsed;
          // Recalculate total price
          setproductTotal(
            newData.reduce(
              (sum, p) => sum + (typeof p.price === "number" ? p.price : 0),
              0
            )
          );
        }
      } else {
        // Just set the text for name field
        newData[index][field] = text;
      }
      setData(newData);
    } catch (error) {
      console.log("Error updating text", error);
    }
  };

  function removeData(): void {
    setData([]);
    setproductTotal(0);
    setImages([]);
  }

  // FIXME: This is not working properly
  const removeAtIndex = (index: number) => {
    setData((prev: any) => {
      const newData = [...(prev || [])];
      newData.splice(index, 1);
      setproductTotal(
        newData.reduce((sum, p) => {
          return sum + (p.price ?? 0);
        }, 0)
      );
      return newData;
    });
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
          onChangeText={onChangeText(index, "name")}
        ></TextInput>
        <TextInput
          style={[styles.input, styles.priceInput]}
          placeholder="Hinta"
          keyboardType="decimal-pad"
          inputMode="decimal"
          value={item.price ? item.price.toString().replace(".", ",") : ""}
          onChangeText={(text) => {
            // Allow only numbers, commas, and periods
            const filtered = text.replace(/[^0-9.,]/g, "");
            onChangeText(index, "price")(filtered);
          }}
        ></TextInput>
        <TouchableOpacity
          onPress={() => removeAtIndex(index)}
          style={{ padding: 10 }}
        >
          <MaterialIcons
            name="delete"
            size={24}
            color={"rgba(138, 28, 28, 1)"}
          />
        </TouchableOpacity>
      </ThemedView>
    ),
    []
  );

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <ThemedView style={styles.titleContainer}>
        {showImage && images.length ? (
          <ThemedView>
            <Carousel
              ref={carouselRef}
              width={width}
              height={width}
              data={images}
              onProgressChange={progress}
              renderItem={({ index }) => (
                <ThemedView
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    justifyContent: "center",
                    borderColor: "#888",
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  <ThemedText
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      zIndex: 1,
                      fontSize: 16,
                      fontWeight: "bold",
                    }}
                  >
                    {index + 1} / {images.length}
                  </ThemedText>
                  <Image
                    source={{ uri: images[index] }}
                    style={styles.image}
                    contentFit="contain"
                  />
                </ThemedView>
              )}
            />

            <Pagination.Basic
              progress={progress}
              data={images}
              dotStyle={{
                backgroundColor: "#fff",
                borderRadius: 50,
              }}
              activeDotStyle={{
                backgroundColor: "#888",
              }}
              containerStyle={{ gap: 5, marginTop: 10 }}
              onPress={onPressPagination}
            />
          </ThemedView>
        ) : null}
      </ThemedView>
      <ThemedView style={styles.container}>
        {images.length ? (
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
            <ThemedButton
              color={"#4a8f53ff"}
              text="Lue uusi"
              onPress={() => {
                pickImage(false);
              }}
            />
            <ThemedButton
              color={"#888"}
              text={showImage ? "Piilota kuva(t)" : "Näytä kuva(t)"}
              onPress={() => {
                setShowImage(!showImage);
              }}
            />
            <ThemedButton
              color={"rgba(138, 28, 28, 1)"}
              text="Nollaa"
              onPress={removeData}
            />
          </ThemedView>
        ) : (
          <ThemedButton
            color={"#4a8f53ff"}
            text="Valitse kuva kuitista"
            style={{ marginBottom: 20 }}
            onPress={() => {
              pickImage(true);
            }}
          />
        )}
        <ThemedText style={{ fontSize: 20, fontWeight: "bold", margin: 10 }}>
          Kuitti
        </ThemedText>
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "center",
            // Center the texts so that they are
            // aligned in the middle of their columns
            alignItems: "center",
            width: "100%",
            paddingBottom: 5,
            borderBottomWidth: 1,
            borderBottomColor: "#888",
          }}
        >
          <ThemedText style={{ fontSize: 18, width: "60%", left: -17 }}>
            Nimi
          </ThemedText>
          <ThemedText style={{ fontSize: 18, width: "20%", left: -25 }}>
            Hinta
          </ThemedText>
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
            <ThemedText style={{ alignSelf: "center", marginBottom: 20 }}>
              Tuotteita ei luettu vielä
            </ThemedText>
          )}
          ListFooterComponent={() => (
            <>
              <ThemedButton
                color={"#4a8f53ff"}
                text="Lisää tuote"
                style={{ marginBottom: 20 }}
                onPress={() => setData([...data, { name: "", price: null }])}
              />

              <ThemedView style={{ alignItems: "center", marginTop: 20 }}>
                <ThemedText>Laskettu kuitista: {productTotal}€</ThemedText>
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
    paddingTop: 20,
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: "center",
  },
  input: {
    color: "white",
    backgroundColor: "#333333ff",
    borderWidth: 1,
    padding: 5,
    width: "65%",
    borderRadius: 5,
    borderColor: "#555",
    fontSize: 14,
    height: 40,
  },
  priceInput: {
    width: "20%",
  },
});
