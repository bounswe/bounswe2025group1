import React, { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/Config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';


export default function RegisterScreen() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
    first_name: '', last_name: '', location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError(t('auth.register.errors.fillRequired'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.errors.passwordMismatch'));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(t('auth.register.errors.invalidEmail'));
      return false;
    }
    if (formData.password.length < 8) {
      setError(t('auth.register.errors.passwordTooShort'));
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        location: formData.location || 'Istanbul',
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError(t('auth.register.errors.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.emoji}>🌱</Text>
              <Text style={styles.title}>{t('auth.register.title')}</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.form}>
              {/* Your input fields */}
              {[
                { placeholder: t('auth.register.firstName'), icon: 'person-outline', key: 'first_name', cap: 'words' },
                { placeholder: t('auth.register.lastName'), icon: 'person-outline', key: 'last_name', cap: 'words' },
                { placeholder: t('auth.register.username'), icon: 'at-outline', key: 'username', cap: 'none' },
                { placeholder: t('auth.register.email'), icon: 'mail-outline', key: 'email', cap: 'none', type: 'email-address' },
                { placeholder: t('auth.register.location'), icon: 'location-outline', key: 'location', cap: 'words' },
              ].map(field => (
                <View key={field.key} style={styles.inputContainer}>
                  <Ionicons name={field.icon} size={20} color={COLORS.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    value={formData[field.key]}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    autoCapitalize={field.cap}
                    keyboardType={field.type || 'default'}
                  />
                </View>
              ))}

              {/* Password */}
              {['password', 'confirmPassword'].map(key => (
                <View key={key} style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={key === 'password' ? t('auth.register.password') : t('auth.register.confirmPassword')}
                    value={formData[key]}
                    onChangeText={(text) => setFormData({ ...formData, [key]: text })}
                    secureTextEntry
                    autoCapitalize="none"
                    textContentType="oneTimeCode"
                    autoComplete="off"
                    importantForAutofill="no"
                  />
                </View>
              ))}

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.buttonText}>{t('auth.register.signUp')}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('auth.register.haveAccount')}</Text>
                <TouchableOpacity onPress={() => router.push('/auth/login')}>
                  <Text style={styles.loginLink}>{t('auth.register.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 16 },
  button: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: COLORS.text, fontSize: 14 },
  loginLink: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold' },
  errorText: { color: COLORS.error, textAlign: 'center', marginBottom: 16 },
});