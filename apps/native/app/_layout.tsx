import "../globals.css";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { useConvexAuth } from "convex/react";
import { env } from "@microhack/env/native";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { ConvexReactClient } from "convex/react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { HeroUINativeProvider, Spinner, useThemeColor } from "heroui-native";

import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
});

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

function AuthGate() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuth) {
      router.replace("/(auth)");
    } else if (isAuthenticated && inAuth) {
      router.replace("/(app)/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="lg" />
      </View>
    );
  }

  return <Slot />;
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [background, border, surface, foreground, accent, danger] =
    useThemeColor([
      "background",
      "border",
      "surface",
      "foreground",
      "accent",
      "danger",
    ] as const);

  const navTheme: Theme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        background,
        border,
        card: surface,
        notification: danger,
        primary: accent,
        text: foreground,
      },
    }),
    [isDark, background, border, surface, foreground, accent, danger],
  );

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthGate />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const hasMounted = useRef(false);
  const colorScheme = useColorScheme() ?? "light";
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }

  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      <GestureHandlerRootView style={styles.container}>
        <HeroUINativeProvider>
          <RootNavigator />
        </HeroUINativeProvider>
      </GestureHandlerRootView>
    </ConvexBetterAuthProvider>
  );
}
