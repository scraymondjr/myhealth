import { Stack } from 'expo-router';
import { GoalFormScreen } from '../../components/GoalFormScreen';

export default function NewGoalScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'New Goal' }} />
      <GoalFormScreen />
    </>
  );
}
