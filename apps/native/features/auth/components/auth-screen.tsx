import { Card, Tabs } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

export function AuthScreen() {
  const [activeTab, setActiveTab] = useState("login");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const subtitle =
    activeTab === "login"
      ? "Welcome back! Sign in to continue."
      : "Create an account to get started.";

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-start px-6 py-16"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-8">
          {/* Logo and Title Section */}
          <View className="items-center gap-4">
            <View
              className={`size-20 rounded-3xl items-center justify-center ${
                isDark ? "bg-accent/20" : "bg-accent/10"
              }`}
            >
              <Ionicons
                name="flash"
                size={40}
                color={isDark ? "hsl(264.1, 100%, 55.1%)" : "hsl(253.83, 100%, 62.04%)"}
              />
            </View>
            <View className="items-center gap-2">
              <Text className="text-4xl font-bold text-foreground tracking-tight">
                microhack
              </Text>
              <Text className="text-base text-muted text-center max-w-[280px]">
                {subtitle}
              </Text>
            </View>
          </View>

          {/* Auth Card */}
          <Card variant="secondary" className="overflow-hidden">
            <Card.Header className="pb-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                variant="primary"
                className="w-full"
              >
                <Tabs.List className="w-full">
                  <Tabs.Indicator />
                  <Tabs.Trigger value="login" className="flex-1">
                    <Ionicons
                      name="log-in-outline"
                      size={18}
                      className="mr-2"
                    />
                    <Tabs.Label>Login</Tabs.Label>
                  </Tabs.Trigger>
                  <Tabs.Trigger value="signup" className="flex-1">
                    <Ionicons
                      name="person-add-outline"
                      size={18}
                      className="mr-2"
                    />
                    <Tabs.Label>Sign Up</Tabs.Label>
                  </Tabs.Trigger>
                </Tabs.List>
              </Tabs>
            </Card.Header>

            <Card.Body className="gap-2">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <Tabs.Content value="login">
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    className="pt-2"
                  >
                    <LoginForm />
                  </Animated.View>
                </Tabs.Content>

                <Tabs.Content value="signup">
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    className="pt-2"
                  >
                    <SignupForm />
                  </Animated.View>
                </Tabs.Content>
              </Tabs>
            </Card.Body>
          </Card>

          {/* Footer */}
          <View className="items-center">
            <Text className="text-sm text-muted text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
