import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { extractProducts } from "@/utils/parseTokens";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { MultiSelect } from "react-native-element-dropdown";
import MlkitOcr from "react-native-mlkit-ocr";
import { Button, MD3Colors, TextInput } from "react-native-paper";
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
  const route = useRoute();

  // TODO: Save and fetch sharers to/from storage
  const SHARERS_KEY = "@sharers";
  const defaultSharers = [
    { name: "J", value: "0" },
    { name: "L", value: "1" },
    { name: "K", value: "2" },
  ];
  const [sharers, setSharers] = useState<any[]>(defaultSharers);

  // Load sharers from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SHARERS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length) {
            setSharers(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load sharers from storage:", err);
      }
    })();
  }, []);

  // Persist sharers to storage whenever they change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(SHARERS_KEY, JSON.stringify(sharers));
      } catch (err) {
        console.error("Failed to save sharers to storage:", err);
      }
    })();
  }, [sharers]);

  const [selectedSharers, setSelectedSharers] = useState<string[]>([]);
  const [addSharer, setAddSharer] = useState<boolean>(false);
  const [sharerName, setSharerName] = useState<string>("");

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
        setSelectedSharers(
          receivedReceipt.sharers.map((item: any) => item.value.toString())
        );
      }
    }
  }, [route.params]);

  interface SelectedProps {
    selectedSharers: string[];
    setSelectedSharers: React.Dispatch<React.SetStateAction<string[]>>;
  }

  //FIXME: Fix the component closing every select?
  const MultiSelectComponent = ({
    selectedSharers,
    setSelectedSharers,
  }: SelectedProps) => {
    const renderItem = (item: { value: any; name: string }) => {
      return (
        <ThemedView style={styles.item} key={item.value}>
          <ThemedText
            style={
              selectedSharers.includes(item.value)
                ? styles.selectedTextStyle
                : styles.placeholderStyle
            }
          >
            {item.name}
          </ThemedText>
          <AntDesign
            style={styles.icon}
            color="red"
            name="delete"
            size={20}
            onPress={() => {
              setSharers((prev: any[]) => {
                let temp = [...prev];
                const index = temp.findIndex((i) => i.name === item.name);
                if (index > -1) {
                  temp.splice(index, 1);
                  // Also remove from selectedSharers if present
                  setSelectedSharers((prevSelected: string[]) =>
                    prevSelected.filter((value) => value !== item.value)
                  );
                  return temp;
                }
                // Ensure we always return an array (no-op if not found)
                return prev;
              });
            }}
          />
        </ThemedView>
      );
    };

    return (
      <ThemedView style={[styles.container, { marginBottom: 20 }]}>
        <MultiSelect
          style={styles.dropdown}
          iconStyle={styles.iconStyle}
          data={sharers}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          labelField="label"
          valueField="value"
          placeholder="Valitse jakajat"
          value={selectedSharers}
          search
          activeColor="green"
          searchPlaceholder="Etsi..."
          onChange={(item) => {
            setSelectedSharers(item);
          }}
          onConfirmSelectItem={(item) => {
            setSelectedSharers(item);
          }}
          renderLeftIcon={() => (
            <AntDesign style={styles.icon} name="check-circle" size={20} />
          )}
          renderItem={renderItem}
          renderSelectedItem={(item, unSelect) => (
            <TouchableOpacity
              onPress={() => unSelect && unSelect(item)}
              key={item.value}
            >
              <ThemedView style={styles.selectedStyle}>
                <ThemedText style={styles.textSelectedStyle}>
                  {item.name}
                </ThemedText>
                <AntDesign color="red" name="delete" size={17} />
              </ThemedView>
            </TouchableOpacity>
          )}
        />
      </ThemedView>
    );
  };

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

  //TODO: Hook the save to a button and load receipts at app start
  const saveReceipt = async () => {
    try {
      let pickedSharers = [];
      if (selectedSharers.length) {
        pickedSharers = sharers.filter((i) =>
          selectedSharers.includes(i.value)
        );
      }
      // Create a receipt object that includes current data, total, images, and a timestamp
      const tempReceipt = {
        name: receiptName,
        sharers: pickedSharers,
        products,
        productTotal,
        images,
        timestamp: receipt ? receipt.timestamp : Date.now(),
      };

      // Store each receipt under its own unique key
      // If receipt already exists, it will be overwritten
      // Key format: @receipt_<timestamp>
      const receiptKey = `@receipt_${tempReceipt.timestamp}`;
      // Check if receipt in storage
      // TODO:
      await AsyncStorage.setItem(receiptKey, JSON.stringify(tempReceipt)).then(
        () => {
          navigation.navigate("index", { receipt: tempReceipt });
          removeData();
        }
      );
    } catch (error) {
      console.error("Error saving receipt:", error);
    }
  };

  // Handle text input changes for both name and price fields
  const onChangeText = (index: number, field: string) => (text: string) => {
    const newData = [...products];
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
          setProductTotal(
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
          style={styles.input}
          mode="outlined"
          value={item.name}
          onChangeText={onChangeText(index, "name")}
        ></TextInput>
        <TextInput
          style={[styles.input, styles.priceInput]}
          mode="outlined"
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
    ),
    [images]
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
              containerStyle={{ gap: 5, marginTop: 10 }}
              onPress={onPressPagination}
            />
          </ThemedView>
        ) : null}
      </ThemedView>
      <ThemedView style={styles.container}>
        {products.length ? (
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
          <ThemedView style={{ marginBottom: 20, alignItems: "center" }}>
            <ThemedText type="title" style={{ marginBottom: 5 }}>
              Receipt share
            </ThemedText>
            <ThemedText style={[styles.subtitle, { margin: 10 }]}>
              Valitse kuva kuitista
            </ThemedText>
            <Button
              icon="image"
              mode="contained"
              style={{ marginBottom: 20 }}
              onPress={() => {
                pickImage(true);
              }}
            >
              Valitse
            </Button>
            <ThemedText style={styles.subtitle}>
              Tai syötä tuotteet itse alle
            </ThemedText>
          </ThemedView>
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
          <ThemedText style={{ fontSize: 18, width: "60%", left: -18 }}>
            Nimi
          </ThemedText>
          <ThemedText style={{ fontSize: 18, width: "20%", left: -18 }}>
            Hinta
          </ThemedText>
        </ThemedView>
        <FlatList
          style={{ width: "100%" }}
          data={products}
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
              Kuitti on vielä tyhjä
            </ThemedText>
          )}
          ListFooterComponent={() => (
            <>
              <Button
                icon="cart-plus"
                mode="contained"
                style={{ marginBottom: 20 }}
                onPress={() =>
                  setProducts([...products, { name: "", price: null }])
                }
              >
                Lisää tuote
              </Button>
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
                      <MultiSelectComponent
                        selectedSharers={selectedSharers}
                        setSelectedSharers={setSelectedSharers}
                      ></MultiSelectComponent>
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
                                    name: tempSharer,
                                    value: String(sharers.length),
                                  },
                                ];
                              }
                              return prev;
                            });
                            setSelectedSharers((prev) => [
                              ...prev,
                              String(sharers.length),
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
    paddingTop: 20,
  },
  image: {
    width: 300,
    height: 300,
    alignSelf: "center",
  },
  input: {
    width: "65%",
    borderRadius: 5,
    borderColor: "#555",
    fontSize: 14,
    height: 40,
  },
  priceInput: {
    width: "20%",
  },

  subtitle: {
    color: "#888",
    fontSize: 12,
  },
  dropdown: {
    width: "60%",
    borderRadius: 5,
    borderColor: "#555",
    padding: 12,
    borderWidth: 1,
    backgroundColor: "#adadadff",
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
