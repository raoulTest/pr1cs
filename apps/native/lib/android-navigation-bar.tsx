import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";

const ANDROID_NAV_BACKGROUND = {
  light: "#f7f7f8",
  dark: "#0c0d10",
} as const;

export async function setAndroidNavigationBar(theme: "light" | "dark") {
  if (Platform.OS !== "android") return;
  await NavigationBar.setButtonStyleAsync(theme === "dark" ? "light" : "dark");
  await NavigationBar.setBackgroundColorAsync(ANDROID_NAV_BACKGROUND[theme]);
}
