import React from "react";
import { Icon, MD3Colors } from "react-native-paper";
import { createMaterialBottomTabNavigator } from "react-native-paper/react-navigation";
import HomeScreen from "./index";
import ReceiptScreen from "./receipt";
const Tab = createMaterialBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="index"
        options={{
          title: "Jaa Kulut",
          tabBarIcon: () => (
            <Icon source="percent" color={MD3Colors.neutral70} size={20} />
          ),
        }}
        component={HomeScreen}
      />
      <Tab.Screen
        name="receipt"
        options={{
          title: "Kuitti",
          tabBarIcon: () => (
            <Icon
              source="receipt-text-edit"
              color={MD3Colors.neutral70}
              size={20}
            />
          ),
        }}
        component={ReceiptScreen}
      />
    </Tab.Navigator>
  );
}
