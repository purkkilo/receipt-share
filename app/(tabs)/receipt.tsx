import FloatPaperInput from "@/components/float-input";
import { MultiSharerSelect } from "@/components/multi-select";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractProducts } from "@/utils/parseTokens";
import {
  loadSharersFromStorage,
  saveReceiptToStorage,
  saveSharersToStorage,
} from "@/utils/storageApi";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MlkitOcr, { MKLBlock } from "react-native-mlkit-ocr";
import { Button, IconButton, MD3Colors, TextInput } from "react-native-paper";
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
const width = Dimensions.get("window").width - 80;

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

export default function ReceiptScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [products, setProducts] = useState<any>([]);
  const [receipt, setReceipt] = useState<any>(null);
  const [receiptName, setReceiptName] = useState<string>("");
  const [productTotal, setProductTotal] = useState<number>(0);
  const [showImage, setShowImage] = useState<boolean>(false);
  const carouselRef = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const navigation = useNavigation<any>();
  const [sharers, setSharers] = useState<any[]>([]);
  const route = useRoute();

  // Load sharers from storage on mount
  useEffect(() => {
    (async () => {
      try {
        await loadSharersFromStorage().then((loadedSharers) => {
          setSharers(loadedSharers);
        });
      } catch (err) {
        console.error("Failed to load sharers from storage:", err);
      }
    })();
  }, []);

  // Persist sharers to storage whenever they change
  useEffect(() => {
    (async () => {
      try {
        await saveSharersToStorage(sharers);
      } catch (err) {
        console.error("Failed to save sharers to storage:", err);
      }
    })();
  }, [sharers]);

  const [selectedSharers, setSelectedSharers] = useState<string[]>([]);
  const [addSharer, setAddSharer] = useState<boolean>(false);
  const [sharerName, setSharerName] = useState<string>("");
  const [addProduct, setAddProduct] = useState<boolean>(false);
  const [productName, setProductName] = useState<string>("");
  const [productPrice, setProductPrice] = useState<number | null>(0);

  let tempName: string = "";
  let tempSharer: string = "";

  useEffect(() => {
    if (route.params) {
      const { receipt: receivedReceipt } = route.params as { receipt: any };
      setReceipt(receivedReceipt);
      setProducts(receivedReceipt.products);
      setProductTotal(receivedReceipt.productTotal);
      setImages(receivedReceipt.images);
      setReceiptName(receivedReceipt.name);
      if (receivedReceipt.sharers) {
        setSelectedSharers(receivedReceipt.sharers.map((s: any) => s.id));
        // or without String(...) if your sharer ids are numbers everywhere
      } else {
        setSelectedSharers([]);
      }
    }
  }, [route.params]);

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
      setProducts([]);
      setProductTotal(0);
      setImages([]);
    }
    let image = "";
    let canceled = false;
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      //allowsMultipleSelection: true,
      quality: 1,
    })
      .then((result) => {
        canceled = result.canceled;
        image = result?.assets?.[0]?.uri || "";
        if (image !== "" || canceled) {
          readProducts(image);
        }
      })
      .finally(() => {
        if (image !== "" || canceled) {
          setImages((prev) => [...prev, image]);
          carouselRef.current?.next();
        }
      });
  };

  const readProducts = async (imageUri: string) => {
    if (!imageUri) {
      return;
    }
    const imageResult = await MlkitOcr.detectFromUri(imageUri);
    imageResult.forEach((e: MKLBlock) => {
      // Remove false price detections (4, 19 -> 4,19)
      e.text = e.text.replace(", ", ",").trim();
    });

    const products = extractProducts(imageResult);

    if (products.length) {
      let total = products.reduce((sum, p) => {
        return sum + (p.price ?? 0);
      }, 0);
      // Add to existing total if there are already products
      if (productTotal > 0) {
        total += productTotal;
      }

      setProductTotal(total);
      setProducts((prev: any) => [...(prev || []), ...products]);
    }
  };

  const saveReceipt = async () => {
    try {
      const pickedSharers = sharers.filter((i) =>
        selectedSharers.includes(i.id)
      );

      // Create a receipt object that includes current data, total, images, and a timestamp
      const tempReceipt = {
        name: receiptName,
        sharers: pickedSharers,
        products,
        productTotal,
        images,
        timestamp: receipt ? receipt.timestamp : Date.now(),
      };
      // Key format: @receipt_<timestamp>
      await saveReceiptToStorage(tempReceipt).then(() => {
        navigation.navigate("index", { receipt: tempReceipt });
        removeData();
      });
    } catch (error) {
      console.error("Error saving receipt:", error);
    }
  };

  // Handle text input changes for both name and price fields
  const onChangeText = (
    index: number,
    field: string,
    text: string | number | null
  ) => {
    const newData = [...products];
    try {
      if (!newData[index]) {
        console.warn(`Data at index ${index} is undefined`);
        return;
      }

      // Recalculate total price
      if (field === "price") {
        let n = text;
        // Ensure we parse only when text is a string; if it's already a number, use it directly.
        if (text === "" || text === null || text === undefined) {
          n = 0;
        } else if (typeof text === "number") {
          n = text;
        } else {
          n = parseFloat(text);
        }
        newData[index][field] = n;
        setProductTotal(newData.reduce((sum, p) => sum + p.price, 0));
      } else {
        newData[index][field] = text;
      }
      setProducts(newData);
    } catch (error) {
      console.log("Error updating text", error);
    }
  };

  function removeData(): void {
    setProducts([]);
    setReceipt(null);
    setProductTotal(0);
    setImages([]);
    setReceiptName("");
    setSelectedSharers([]);
    setSharerName("");
    setAddSharer(false);
  }

  const removeAtIndex = (index: number) => {
    setProducts((prev: any) => {
      const newData = [...(prev || [])];
      newData.splice(index, 1);
      setProductTotal(
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
          label={"Nimi"}
          style={styles.input}
          mode="outlined"
          value={item.name}
          onChangeText={(text) => onChangeText(index, "name", text)}
        ></TextInput>
        <FloatPaperInput
          value={item.price ? item.price : 0}
          onChange={(number) => onChangeText(index, "price", number)}
          label="Hinta"
          allowNegative={true}
          style={[styles.input, styles.priceInput]}
        ></FloatPaperInput>
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
    [products, onChangeText, removeAtIndex]
  );

  const imageItem = useCallback(
    ({ index }: { index: number }) => (
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
            fontSize: 12,
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
    ),
    [images]
  );

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      {!products.length ? (
        <ThemedText type="title" style={{ marginBottom: 40, marginTop: 20 }}>
          Receipt share
        </ThemedText>
      ) : null}

      <ThemedView style={styles.titleContainer}>
        {showImage && images.length ? (
          <ThemedView>
            <Carousel
              ref={carouselRef}
              width={width}
              height={width}
              data={images}
              onProgressChange={progress}
              renderItem={imageItem}
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
              containerStyle={{ gap: 5, marginVertical: 5 }}
              onPress={onPressPagination}
            />
          </ThemedView>
        ) : null}
      </ThemedView>
      <ThemedView style={{ alignItems: "center" }}>
        {addProduct ? (
          <>
            <ThemedView
              style={{
                flexDirection: "row",
                paddingHorizontal: 30,
                paddingVertical: 10,
                gap: 10,
                alignItems: "center",
                justifyContent: "center",
                width: 220,
                height: 60,
              }}
            >
              <TextInput
                style={styles.input}
                mode="outlined"
                label="Tuote"
                value={productName}
                onChangeText={(text) => setProductName(text)}
              />
              <FloatPaperInput
                value={productPrice}
                onChange={(n) => setProductPrice(n)}
                label="Hinta"
                allowNegative={true}
                style={styles.input}
              />
              <IconButton
                icon="cart-plus"
                mode="outlined"
                onPress={() => {
                  setProducts([
                    ...products,
                    {
                      id:
                        products.length +
                        Math.random().toString(36).substring(2, 9),
                      name: productName,
                      price: productPrice,
                      sharers: [],
                    },
                  ]);
                  let add = productPrice ? productPrice : 0;
                  setProductTotal((prev: number) => prev + add);
                  // reset controlled inputs
                  setProductName("");
                  setProductPrice(0);
                }}
              />
              <Button
                mode="contained"
                onPress={() => setAddProduct(!addProduct)}
              >
                Piilota
              </Button>
            </ThemedView>
          </>
        ) : (
          <Button
            style={{ marginHorizontal: products.length ? 10 : 40 }}
            icon="cart-plus"
            mode="contained"
            onPress={() => setAddProduct(!addProduct)}
          >
            Lisää tuote
          </Button>
        )}
      </ThemedView>
      <ThemedView style={styles.container}>
        {products.length ? (
          <ThemedView
            style={{
              marginTop: 40,
              paddingHorizontal: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
            }}
          >
            <Button
              compact
              mode="contained"
              icon="receipt-text-plus-outline"
              onPress={() => {
                pickImage(false);
              }}
            >
              Lue uusi
            </Button>
            {images.length ? (
              <Button
                compact
                mode="contained"
                icon={showImage ? "image-minus" : "image-check"}
                onPress={() => {
                  setShowImage(!showImage);
                }}
              >
                {showImage ? "Piilota kuva(t)" : "Näytä kuva(t)"}
              </Button>
            ) : null}
            <Button
              compact
              icon="restart"
              mode="contained-tonal"
              textColor={MD3Colors.error60}
              onPress={removeData}
            >
              Nollaa
            </Button>
          </ThemedView>
        ) : (
          <ThemedView
            style={{ marginBottom: 20, marginTop: 10, alignItems: "center" }}
          >
            <ThemedText style={styles.subtitle}>Lisää tuotteet itse</ThemedText>

            <Button
              icon="image"
              mode="contained"
              style={{ marginVertical: 10 }}
              onPress={() => {
                pickImage(true);
              }}
            >
              Valitse
            </Button>
            <ThemedText style={[styles.subtitle]}>
              Tai valitse kuva kuitista
            </ThemedText>
          </ThemedView>
        )}

        <ThemedText
          style={{
            fontSize: 20,
            fontWeight: "bold",
            paddingTop: 10,
            paddingBottom: 5,
          }}
        >
          Kuitti
        </ThemedText>

        <FlatList
          style={{
            width: "100%",
            minHeight: addProduct && showImage ? 165 : 210,
            marginBottom: 0,
          }}
          data={products}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          getItemLayout={(_, index) => ({
            length: 60,
            offset: 60 * index,
            index,
          })}
          maxToRenderPerBatch={12}
          initialNumToRender={12}
          windowSize={12}
          ListEmptyComponent={() => (
            <ThemedText style={{ alignSelf: "center", marginBottom: 20 }}>
              Kuitti on vielä tyhjä
            </ThemedText>
          )}
          ListFooterComponent={() => (
            <>
              {products.length ? (
                <ThemedView style={{ alignItems: "center" }}>
                  <ThemedText style={{ marginBottom: 20 }}>
                    Yhteensä: {productTotal.toFixed(2)}€
                  </ThemedText>
                  <ThemedView
                    style={{
                      justifyContent: "center",
                      // Center the texts so that they are
                      // aligned in the middle of their columns
                      alignItems: "center",
                      width: "100%",
                      paddingTop: 20,
                      borderTopWidth: 1,
                      borderTopColor: "#888",
                    }}
                  >
                    <TextInput
                      style={styles.input}
                      mode="outlined"
                      label="Kuitin nimi"
                      defaultValue={receiptName}
                      onChangeText={(text) => (tempName = text)}
                      onEndEditing={() => {
                        setReceiptName(tempName);
                      }}
                    ></TextInput>
                    <ThemedText style={{ marginTop: 10 }}>
                      Kuitin jakajat
                    </ThemedText>
                    {sharers.length ? (
                      <MultiSharerSelect
                        sharers={sharers} // [{id, name}, ...]
                        selectedSharers={selectedSharers}
                        setSelectedSharers={setSelectedSharers}
                      />
                    ) : null}
                    {addSharer ? (
                      <ThemedView
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          marginBottom: 10,
                          width: "100%",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <TextInput
                          style={[{ width: "40%" }]}
                          mode="outlined"
                          placeholder="Uusi jakaja"
                          onChangeText={(text) => (tempSharer = text)}
                        ></TextInput>
                        <Button
                          style={[{ width: "25%" }]}
                          mode="contained-tonal"
                          icon="account-plus"
                          onPress={() => {
                            setSharers((prev: any[]) => {
                              if (
                                !prev.some(
                                  (item: any) => item.name === sharerName
                                )
                              ) {
                                return [
                                  ...prev,
                                  {
                                    id: sharers.length.toString(),
                                    name: tempSharer,
                                  },
                                ];
                              }
                              return prev;
                            });
                            setSelectedSharers((prev) => [
                              ...prev,
                              sharers.length.toString(),
                            ]);
                            setSharerName("");
                            tempSharer = "";
                          }}
                        >
                          Lisää
                        </Button>
                      </ThemedView>
                    ) : null}
                    <Button
                      mode="contained-tonal"
                      icon="account-plus"
                      style={{ marginBottom: 20 }}
                      onPress={() => {
                        setAddSharer(!addSharer);
                      }}
                    >
                      {addSharer ? "Piilota" : "Lisää jakajia"}
                    </Button>
                    <ThemedView
                      style={{
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0)",
                        borderBottomColor: "#888",
                        width: "100%",
                        marginBottom: 20,
                      }}
                    ></ThemedView>
                    <Button
                      mode="contained"
                      icon="content-save"
                      style={{ marginBottom: 20 }}
                      onPress={saveReceipt}
                    >
                      Tallenna kuitti
                    </Button>
                  </ThemedView>
                </ThemedView>
              ) : null}
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
    width: "100%",
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: "center",
  },
  input: {
    width: "60%",
    borderRadius: 5,
    borderColor: "#555",
    fontSize: 14,
    height: 40,
  },
  priceInput: {
    width: "25%",
  },

  subtitle: {
    color: "#888",
    fontSize: 12,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    backgroundColor: "#3a5538ff",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
    backgroundColor: "#323232",
    borderColor: "grey",
    borderWidth: 1,
  },
  icon: {
    marginRight: 5,
  },
  item: {
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedStyle: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    borderColor: "#555",
    borderWidth: 1,

    marginTop: 8,
    marginRight: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,

    elevation: 2,
  },
  textSelectedStyle: {
    marginRight: 5,
    fontSize: 16,
  },
});
