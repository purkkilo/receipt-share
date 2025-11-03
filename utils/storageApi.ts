import AsyncStorage from "@react-native-async-storage/async-storage";

export const SHARERS_KEY = "@sharers";

export const saveSharersToStorage = async (sharers: any[]) => {
  try {
    const jsonValue = JSON.stringify(sharers);
    await AsyncStorage.setItem(SHARERS_KEY, jsonValue);
  } catch (e) {
    console.error("Error saving sharers to storage:", e);
  }
};

export const loadSharersFromStorage = async (): Promise<any[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SHARERS_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Error loading sharers from storage:", e);
    return [];
  }
};

export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error("Error clearing storage:", e);
  }
};

export const getAllReceiptsFromStorage = async (): Promise<any[]> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const receiptKeys = allKeys.filter((key) => key.startsWith("@receipt_"));
    const receiptsRaw = await AsyncStorage.multiGet(receiptKeys);
    const receipts = receiptsRaw
      .map(([_, value]) => (value ? JSON.parse(value) : null))
      .filter((receipt) => receipt !== null);
    return receipts;
  } catch (error) {
    console.error("Error loading receipts from storage:", error);
    return [];
  }
};

export const deleteReceiptFromStorage = async (receipt: any) => {
  try {
    await AsyncStorage.removeItem("@receipt_" + receipt.timestamp);
  } catch (error) {
    console.error("Error deleting receipt from storage:", error);
  }
};

export const saveReceiptToStorage = async (receipt: any) => {
  try {
    const jsonValue = JSON.stringify(receipt);
    await AsyncStorage.setItem("@receipt_" + receipt.timestamp, jsonValue);
  } catch (e) {
    console.error("Error saving receipt to storage:", e);
  }
};
