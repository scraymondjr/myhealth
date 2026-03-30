import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GoalFormScreen } from '../../components/GoalFormScreen';
import { useHealthStore } from '../../store';
import { Colors } from '../../constants/colors';

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const goal = useHealthStore((s) => s.goals.find((g) => g.id === id));

  if (!goal) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Goal not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Goal' }} />
      <GoalFormScreen goal={goal} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 16, color: Colors.textSecondary },
});
