import { Ionicons } from "@expo/vector-icons";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  useThemeColor,
} from "heroui-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { withUniwind } from "uniwind";

import { useAuth } from "../hooks/use-auth";
import { loginSchema } from "../schemas";

const StyledIonicons = withUniwind(Ionicons);

export function LoginForm() {
  const { signIn } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const accentForeground = useThemeColor("accent-foreground");

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await signIn(value);
      } catch (error) {
        return error instanceof Error ? error.message : "Failed to sign in";
      }
    },
  });

  return (
    <View className="gap-4">
      <form.Field name="email">
        {(field) => (
          <TextField
            isRequired
            isInvalid={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            }
          >
            <Label>Email</Label>
            <Input
              value={field.state.value}
              onChangeText={field.handleChange}
              onBlur={field.handleBlur}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {field.state.meta.isTouched &&
              field.state.meta.errors.length > 0 &&
              field.state.meta.errors.map((error) => (
                <FieldError key={error?.message}>{error?.message}</FieldError>
              ))}
          </TextField>
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <TextField
            isRequired
            isInvalid={
              field.state.meta.isTouched && field.state.meta.errors.length > 0
            }
          >
            <Label>Password</Label>
            <View className="w-full flex-row items-center">
              <Input
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                placeholder="Enter your password"
                secureTextEntry={!isPasswordVisible}
                className="flex-1 pr-10"
              />
              <Pressable
                className="absolute right-3"
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              >
                <StyledIonicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  className="text-muted"
                />
              </Pressable>
            </View>
            {field.state.meta.isTouched &&
              field.state.meta.errors.length > 0 &&
              field.state.meta.errors.map((error) => (
                <FieldError key={error?.message}>{error?.message}</FieldError>
              ))}
          </TextField>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting] as const}
      >
        {([canSubmit, isSubmitting]) => (
          <Button
            variant="primary"
            onPress={() => form.handleSubmit()}
            isDisabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <Spinner size="sm" color={accentForeground} />
            ) : (
              "Sign In"
            )}
          </Button>
        )}
      </form.Subscribe>
    </View>
  );
}
