import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/auth';
import { useHealthStore } from '../../store';
import { pushAll } from '../../store/sync';
import { Colors } from '../../constants/colors';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const { goals, progressEntries } = useHealthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const err = await signUp(email.trim(), password);
    if (err) {
      setError(err);
      return;
    }

    // Supabase may require email verification. Show success message.
    setSuccess(true);
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>Account created!</Text>
        <Text style={styles.successBody}>
          Check your email for a confirmation link, then sign in to start syncing your data.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/auth/login')}>
          <Text style={styles.primaryBtnText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subheading}>
          Your goals and progress will sync across all your devices.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPassword}
              returnKeyType="next"
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              placeholderTextColor={Colors.textDisabled}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={20} color={Colors.white} />
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={Colors.primary} />
          <Text style={styles.backLinkText}>Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 12,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 13, color: Colors.danger },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
  },
  eyeBtn: { padding: 4 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  backLinkText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.background,
    gap: 16,
  },
  successIcon: { marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  successBody: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
