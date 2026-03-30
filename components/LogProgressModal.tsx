import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Goal } from '../types';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  goal: Goal;
  currentAmount: number;
  onClose: () => void;
  onSubmit: (amount: number, notes: string) => void;
}

export function LogProgressModal({ visible, goal, currentAmount, onClose, onSubmit }: Props) {
  const [amountText, setAmountText] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit() {
    const parsed = parseFloat(amountText);
    if (isNaN(parsed) || parsed <= 0) return;
    onSubmit(parsed, notes);
    setAmountText('');
    setNotes('');
  }

  function handleClose() {
    setAmountText('');
    setNotes('');
    onClose();
  }

  const remaining = Math.max(0, goal.targetAmount - currentAmount);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.sheet}
            >
              <View style={styles.handle} />

              <Text style={styles.title}>Log Progress</Text>
              <Text style={styles.subtitle}>
                {goal.name} · {currentAmount} / {goal.targetAmount} {goal.unit}
              </Text>
              {remaining > 0 && (
                <Text style={styles.hint}>{remaining} {goal.unit} remaining to complete</Text>
              )}

              <Text style={styles.label}>Amount ({goal.unit})</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder={`e.g. ${Math.round(remaining / 2) || 10}`}
                  placeholderTextColor={Colors.textDisabled}
                  autoFocus
                />
                {remaining > 0 && (
                  <TouchableOpacity
                    style={styles.quickFill}
                    onPress={() => setAmountText(String(remaining))}
                  >
                    <Text style={styles.quickFillText}>+{remaining} (finish)</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did it go?"
                placeholderTextColor={Colors.textDisabled}
                multiline
                numberOfLines={2}
              />

              <View style={styles.buttons}>
                <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={handleClose}>
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSubmit, !amountText && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={!amountText}
                >
                  <Text style={styles.btnSubmitText}>Save</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  hint: {
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  notesInput: {
    height: 64,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  quickFill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  quickFillText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  btnCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  btnSubmit: {
    backgroundColor: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnSubmitText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
