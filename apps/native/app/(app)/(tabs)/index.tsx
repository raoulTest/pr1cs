import { api } from "@microhack/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ScrollView, Text, View } from "react-native";

import { Button, Card, Spinner } from "heroui-native";

import { useAuth } from "@/features/auth/hooks/use-auth";

export default function HomeScreen() {
  const { isAuthenticated, signOut } = useAuth();
  const user = useQuery(api.auth.getCurrentUser, isAuthenticated ? {} : "skip");

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerClassName="p-5 gap-4"
      contentInsetAdjustmentBehavior="automatic"
    >
      <Card>
        <Card.Body className="gap-3">
          <Card.Title>
            Welcome, <Text className="font-bold">{user.name}</Text>
          </Card.Title>
          <Card.Description>{user.email}</Card.Description>
          <Button variant="danger" onPress={signOut}>
            Sign Out
          </Button>
        </Card.Body>
      </Card>
    </ScrollView>
  );
}
