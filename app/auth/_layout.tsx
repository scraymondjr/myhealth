import { Stack } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: '700', color: Colors.text },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: 'Create Account' }} />
    </Stack>
  );
}
