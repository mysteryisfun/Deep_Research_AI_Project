<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
=======
import React, { useState } from 'react';
>>>>>>> Stashed changes
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
<<<<<<< Updated upstream
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

type RootStackParamList = {
  Login: undefined;
  ResetPassword: { email?: string; token?: string };
  Home: undefined;
=======
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import * as Haptics from 'expo-haptics';

type RootStackParamList = {
  Login: undefined;
  ResetPassword: { token: string };
>>>>>>> Stashed changes
};

type ResetPasswordScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;

<<<<<<< Updated upstream
export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute();
  const { email: routeEmail, token: routeToken } = route.params as { email?: string; token?: string };
  
  const [email, setEmail] = useState(routeEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [confirmSecureTextEntry, setConfirmSecureTextEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [token, setToken] = useState(routeToken || '');

  // Check if we're in reset mode (with token) or request mode
  useEffect(() => {
    if (token) {
      setIsResetMode(true);
    }
  }, [token]);

  // Handle password reset request
  const handleResetRequest = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Check if the email exists in the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        setErrorMessage('Email not found. Please check your email or sign up.');
        setIsVerifying(false);
        return;
      }

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'researchapp://reset-password',
      });

      if (error) throw error;

      setSuccessMessage(`A password reset link has been sent to ${email}. Please check your email.`);
    } catch (error: any) {
      console.error('Password reset request error:', error);
      setErrorMessage(error.message || 'Could not send reset password link');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter both new password and confirmation');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Update the password_updated_at timestamp in the users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          password_updated_at: new Date().toISOString() 
        })
        .eq('email', email.toLowerCase().trim());

      if (dbError) {
        console.error('Database update error:', dbError);
        // Continue anyway as the password was updated in auth
      }

      setSuccessMessage('Your password has been successfully updated');
      
      // Navigate to login after a short delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (error: any) {
      console.error('Password update error:', error);
      setErrorMessage(error.message || 'Could not update password');
    } finally {
      setIsLoading(false);
=======
const ResetPasswordScreen = () => {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleResetPassword = async () => {
    try {
      setError('');
      
      // Validate password requirements
      if (!validatePassword(newPassword)) {
        setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
        return;
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Trigger success haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Show success message and navigate to login
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. Please login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to reset password. Please try again.');
      
      // Trigger error haptic feedback
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
>>>>>>> Stashed changes
    }
  };

  return (
<<<<<<< Updated upstream
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          disabled={isLoading || isVerifying}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.title}>
          {isResetMode ? 'Reset Your Password' : 'Forgot Password'}
        </Text>
        
        {!isResetMode ? (
          <>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, errorMessage ? styles.inputError : null]}
                placeholder="hello@company.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isVerifying}
              />
            </View>
            
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.button, isVerifying && styles.disabledButton]}
              onPress={handleResetRequest}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Please enter your new password below.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={[styles.passwordInputWrapper, errorMessage ? styles.inputError : null]}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter new password"
                  placeholderTextColor="#666"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setErrorMessage('');
                  }}
                  secureTextEntry={secureTextEntry}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                  disabled={isLoading}
                >
                  <Feather name={secureTextEntry ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm New Password</Text>
              <View style={[styles.passwordInputWrapper, errorMessage ? styles.inputError : null]}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Confirm new password"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrorMessage('');
                  }}
                  secureTextEntry={confirmSecureTextEntry}
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setConfirmSecureTextEntry(!confirmSecureTextEntry)}
                  disabled={isLoading}
                >
                  <Feather name={confirmSecureTextEntry ? 'eye-off' : 'eye'} size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
            
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
            
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.disabledButton]}
              onPress={handlePasswordUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
=======
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.subtitle}>
          Please enter your new password below
        </Text>

        {/* New Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password must contain:</Text>
          <View style={styles.requirementItem}>
            <Ionicons
              name={newPassword.length >= 8 ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={newPassword.length >= 8 ? '#4caf50' : '#ff4444'}
            />
            <Text style={styles.requirementText}>At least 8 characters</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons
              name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={/[A-Z]/.test(newPassword) ? '#4caf50' : '#ff4444'}
            />
            <Text style={styles.requirementText}>One uppercase letter</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons
              name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={/[a-z]/.test(newPassword) ? '#4caf50' : '#ff4444'}
            />
            <Text style={styles.requirementText}>One lowercase letter</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons
              name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={/[0-9]/.test(newPassword) ? '#4caf50' : '#ff4444'}
            />
            <Text style={styles.requirementText}>One number</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons
              name={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '#4caf50' : '#ff4444'}
            />
            <Text style={styles.requirementText}>One special character</Text>
          </View>
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
>>>>>>> Stashed changes

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
<<<<<<< Updated upstream
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 20,
=======
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  backButton: {
    marginRight: 16,
>>>>>>> Stashed changes
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
<<<<<<< Updated upstream
    marginBottom: 10,
=======
  },
  form: {
    flex: 1,
    padding: 20,
>>>>>>> Stashed changes
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
<<<<<<< Updated upstream
    marginBottom: 30,
=======
    marginBottom: 24,
>>>>>>> Stashed changes
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
<<<<<<< Updated upstream
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  passwordInputWrapper: {
=======
  passwordContainer: {
>>>>>>> Stashed changes
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 8,
<<<<<<< Updated upstream
    paddingRight: 12,
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
=======
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  requirementsContainer: {
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  requirementText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#fff',
>>>>>>> Stashed changes
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
<<<<<<< Updated upstream
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 10,
  },
  successText: {
    color: '#4caf50',
    fontSize: 14,
    marginBottom: 10,
  },
}); 
=======
});

export default ResetPasswordScreen; 
>>>>>>> Stashed changes
