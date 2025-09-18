import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Button } from "react-native";
import MlkitOcr from "react-native-mlkit-ocr";

export default function HomeScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);

  // Find the closest text from array based on top position
  const getClosest = (element: any, arr: any[]) => {
    let closest = arr[0];
    let closestDiff = Math.abs(element.bounding.top - closest.bounding.top);
    for (let i = 1; i < arr.length; i++) {
      let diff = Math.abs(element.bounding.top - arr[i].bounding.top);
      if (diff < closestDiff) {
        closest = arr[i];
        closestDiff = diff;
      }
    }
    return closest.text;
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      //allowsEditing: true,
      //aspect: [4, 3],
      quality: 1,
    });

    setOcrResult(null);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      const imageResult = await MlkitOcr.detectFromFile(result.assets[0].uri);
      console.log("Recognized text:", imageResult);
      imageResult.sort(
        (a, b) =>
          a.bounding.top - b.bounding.top || a.bounding.left - b.bounding.left
      );

      // Read the receipt, find each product and its price
      // And append them to an array
      let receipt: string[] = [];
      for (let block of imageResult) {
        for (let line of block.lines) {
          console.log("Line text:", line.text);
        }
        // Find lines that contain a price
        let priceLine = block.lines.find((line) =>
          line.text.match(/\d+[\.,]\d{2}/)
        );
        if (priceLine) {
          // Find the closest line to the price line that doesn't contain a price
          //console.log(block.lines);
          let productLine = getClosest(priceLine, imageResult);
          receipt.push(`${productLine}: ${priceLine.text}`);
        }
      }
      setOcrResult(receipt.join("\n"));

      /*
      const imageResult = await TextRecognition.recognize(result.assets[0].uri);

      console.log("Recognized text:", imageResult.text);

      for (let block of imageResult.blocks) {
        console.log("Block text:", block.text);
        console.log("Block frame:", block.frame);

        for (let line of block.lines) {
          console.log("Line text:", line.text);
          console.log("Line frame:", line.frame);
        }
      }
        */
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.container}>
        <Button title="Pick an image from camera roll" onPress={pickImage} />
        {image && <Image source={{ uri: image }} style={styles.image} />}
      </ThemedView>
      <ThemedView style={{ padding: 16 }}>
        <ThemedText>{ocrResult ? ocrResult : "No OCR result yet."}</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
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
  },
  image: {
    width: 200,
    height: 200,
  },
});
