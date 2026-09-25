import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KamaloIcon } from '@/components/kamalo-icon';
import { useColors } from '@/hooks/useColors';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

const ROLE_OPTIONS: Array<{ role: UserRole; label: string }> = [
  { role: 'customer', label: 'Customer' },
  { role: 'super_admin', label: 'Super Admin' },
  { role: 'admin', label: 'Admin' },
  { role: 'editor', label: 'Editor' },
  { role: 'human_reviewer', label: 'Reviewer' },
];

export function AuthModal({ visible, onClose, initialMode = 'signin' }: AuthModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Sign In fields
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up fields
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<UserRole>('customer');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = () => {
    setErrorMsg('');
    const result = signIn(signInUsername, signInPassword);
    if (result.success) {
      showToast({
        title: 'Signed In Successfully',
        message: `Welcome back, @${signInUsername.trim()}!`,
        type: 'success',
      });
      onClose();
      setSignInUsername('');
      setSignInPassword('');
    } else {
      setErrorMsg(result.error || 'Failed to sign in.');
    }
  };

  const handleSignUp = () => {
    setErrorMsg('');
    const result = signUp(
      signUpUsername,
      signUpPassword,
      signUpName,
      signUpEmail,
      signUpRole
    );
    if (result.success) {
      showToast({
        title: 'Account Created',
        message: `Welcome, ${signUpName.trim()} (${signUpRole.replace('_', ' ')})!`,
        type: 'success',
      });
      onClose();
      setSignUpUsername('');
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPassword('');
    } else {
      setErrorMsg(result.error || 'Failed to create account.');
    }
  };

  const fillQuickLogin = (u: string, p: string) => {
    setSignInUsername(u);
    setSignInPassword(p);
    setErrorMsg('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>KAMALO ACCESS</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.secondary }]}
            >
              <KamaloIcon name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Segmented Switcher */}
          <View style={[styles.tabBar, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Pressable
              onPress={() => {
                setMode('signin');
                setErrorMsg('');
              }}
              style={[
                styles.tabBtn,
                mode === 'signin' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: mode === 'signin' ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              style={[
                styles.tabBtn,
                mode === 'signup' && [styles.tabBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: mode === 'signup' ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]}>
              <KamaloIcon name="alert-circle" size={15} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {mode === 'signin' ? (
              /* Sign In Form */
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Username</Text>
                  <TextInput
                    value={signInUsername}
                    onChangeText={setSignInUsername}
                    placeholder="e.g. yash or customer"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                  <View style={[styles.passwordWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
                      value={signInPassword}
                      onChangeText={setSignInPassword}
                      placeholder="Enter password"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showSignInPassword}
                      autoCapitalize="none"
                      style={[styles.passwordInput, { color: colors.foreground }]}
                    />
                    <Pressable
                      onPress={() => setShowSignInPassword(!showSignInPassword)}
                      hitSlop={8}
                    >
                      <KamaloIcon
                        name={showSignInPassword ? 'eye-off' : 'eye'}
                        size={17}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleSignIn}
                  style={[styles.primaryBtn, { backgroundColor: colors.foreground }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                    Sign In
                  </Text>
                </Pressable>

                {/* Quick Test Accounts Bar */}
                <View style={[styles.quickAccountsBox, { borderColor: colors.border }]}>
                  <Text style={[styles.quickAccountsLabel, { color: colors.mutedForeground }]}>
                    QUICK TEST PRESETS (TAP TO FILL)
                  </Text>
                  <View style={styles.presetChipsWrap}>
                    <Pressable
                      onPress={() => fillQuickLogin('yash', 'kamalo123')}
                      style={[styles.presetChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    >
                      <Text style={[styles.presetChipText, { color: colors.foreground }]}>
                        Yash (Super Admin)
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => fillQuickLogin('admin', 'admin123')}
                      style={[styles.presetChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    >
                      <Text style={[styles.presetChipText, { color: colors.foreground }]}>
                        Admin
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => fillQuickLogin('editor', 'editor123')}
                      style={[styles.presetChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    >
                      <Text style={[styles.presetChipText, { color: colors.foreground }]}>
                        Editor
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => fillQuickLogin('reviewer', 'reviewer123')}
                      style={[styles.presetChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    >
                      <Text style={[styles.presetChipText, { color: colors.foreground }]}>
                        Reviewer
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => fillQuickLogin('customer', 'user123')}
                      style={[styles.presetChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    >
                      <Text style={[styles.presetChipText, { color: colors.foreground }]}>
                        Customer Demo
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              /* Sign Up Form */
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Unique Username</Text>
                  <TextInput
                    value={signUpUsername}
                    onChangeText={setSignUpUsername}
                    placeholder="e.g. john_doe"
                    placeholderTextColor={colors.mutedForeground}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
                  <TextInput
                    value={signUpName}
                    onChangeText={setSignUpName}
                    placeholder="e.g. John Doe"
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Email (Optional)</Text>
                  <TextInput
                    value={signUpEmail}
                    onChangeText={setSignUpEmail}
                    placeholder="john@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
                  <View style={[styles.passwordWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <TextInput
                      value={signUpPassword}
                      onChangeText={setSignUpPassword}
                      placeholder="At least 4 characters"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry={!showSignUpPassword}
                      autoCapitalize="none"
                      style={[styles.passwordInput, { color: colors.foreground }]}
                    />
                    <Pressable
                      onPress={() => setShowSignUpPassword(!showSignUpPassword)}
                      hitSlop={8}
                    >
                      <KamaloIcon
                        name={showSignUpPassword ? 'eye-off' : 'eye'}
                        size={17}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Role Assignment Info */}
                <View style={[styles.field, { backgroundColor: colors.secondary, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <KamaloIcon name="user" size={14} color={colors.foreground} />
                    <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>Account Role: Customer</Text>
                  </View>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4, fontFamily: 'Inter_400Regular' }}>
                    New registrations are created as Customer accounts. Team staff members (Admins, Reviewers, Editors) are provisioned directly by the Super Admin in the Operations Control Room.
                  </Text>
                </View>

                <Pressable
                  onPress={handleSignUp}
                  style={[styles.primaryBtn, { backgroundColor: colors.foreground }]}
                >
                  <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                    Create Account
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    elevation: 1,
  },
  tabBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    flex: 1,
  },
  form: {
    gap: 12,
    paddingBottom: 10,
  },
  field: {
    gap: 6,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  input: {
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  passwordWrap: {
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  quickAccountsBox: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginTop: 8,
    gap: 8,
  },
  quickAccountsLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 1,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  presetChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  roleChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  roleChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});
