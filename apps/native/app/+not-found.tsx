import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

import { Button, Card } from "heroui-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center p-4">
        <Card>
          <Card.Body className="items-center">
            <Text className="text-5xl mb-4">?</Text>
            <Card.Title className="text-center mb-2">Page Not Found</Card.Title>
            <Card.Description className="text-center mb-6">
              Sorry, the page you're looking for doesn't exist.
            </Card.Description>
            <Link href="/" asChild>
              <Button variant="primary">Go to Home</Button>
            </Link>
          </Card.Body>
        </Card>
      </View>
    </>
  );
}
