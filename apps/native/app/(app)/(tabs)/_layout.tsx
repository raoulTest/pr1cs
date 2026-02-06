import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useThemeColor } from "heroui-native";

export default function TabsLayout() {
  const [foreground, surface] = useThemeColor([
    "foreground",
    "surface",
  ] as const);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: foreground,
        tabBarStyle: {
          backgroundColor: surface,
        },
        headerStyle: {
          backgroundColor: surface,
        },
        headerTitleStyle: {
          color: foreground,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
