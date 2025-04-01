import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Switch,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  ActivityIndicator,
  ImageBackground,
  Pressable,
  TouchableWithoutFeedback
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

// Blur doesn't work well on Android, so we'll create a custom blur-like effect
const BlurView = ({ intensity = 10, children, style }) => {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { isDarkMode, theme, toggleTheme } = useTheme();
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpPasswordHidden, setSignUpPasswordHidden] = useState(true);
  const [confirmPasswordHidden, setConfirmPasswordHidden] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isValidSignUp = () => {
    return (
      fullName.trim().length > 0 &&
      signUpEmail.includes('@') &&
      signUpPassword.length >= 6 &&
      signUpPassword === confirmPassword
    );
  };

  const handleSignUp = async () => {
    if (!isValidSignUp()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSigningUp(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Close modal and reset form
      setShowSignUpModal(false);
      setFullName('');
      setSignUpEmail('');
      setSignUpPassword('');
      setConfirmPassword('');
      
      // Show success message
      toast.success('Account created successfully! Welcome to Royal Research');
      
      // Navigate to Home screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };
  
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animation for glowing effect
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSkipLogin = () => {
    navigation.navigate('Home');
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toast.success('Skipped login successfully', {
      duration: 2000,
    });
  };

  const handleLogin = () => {
    if (!email || !password) {
      toast.error('Please enter both email and password', {
        duration: 3000,
      });
      return;
    }
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Animation for button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Placeholder for future authentication logic
      toast.info('Login feature will be implemented soon', {
        duration: 2000,
      });
    });
  };

  // Handle forgot password
  const [forgotPasswordModalVisible, setForgotPasswordModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsResetting(true);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Password reset link sent to your email');
      setForgotPasswordModalVisible(false);
      setResetEmail('');
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const togglePasswordVisibility = () => {
    setSecureTextEntry(prev => !prev);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Background stars for futuristic effect
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 150; i++) {
      const size = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.7 + 0.3;
      const animationDuration = Math.random() * 5000 + 2000;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      
      stars.push(
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            backgroundColor: '#fff',
            borderRadius: size / 2,
            left: `${left}%`,
            top: `${top}%`,
            opacity: Animated.multiply(
              glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [opacity - 0.2, opacity + 0.2],
              }),
              opacity
            ),
          }}
        />
      );
    }
    return stars;
  };

  // Floating particles animation
  const renderFloatingParticles = () => {
    const particles = [];
    for (let i = 0; i < 10; i++) {
      const size = Math.random() * 5 + 3;
      const duration = Math.random() * 30000 + 10000;
      const delay = Math.random() * 5000;
      const startY = Math.random() * Dimensions.get('window').height;
      const startX = Math.random() * Dimensions.get('window').width;
      
      const moveX = useRef(new Animated.Value(0)).current;
      const moveY = useRef(new Animated.Value(0)).current;
      const scaleParticle = useRef(new Animated.Value(1)).current;
      const opacityParticle = useRef(new Animated.Value(0)).current;
      
      useEffect(() => {
        // Start animation after delay
        setTimeout(() => {
          Animated.parallel([
            Animated.loop(
              Animated.timing(moveX, {
                toValue: 100,
                duration: duration,
                useNativeDriver: true,
              })
            ),
            Animated.loop(
              Animated.timing(moveY, {
                toValue: 100,
                duration: duration * 1.2,
                useNativeDriver: true,
              })
            ),
            Animated.loop(
              Animated.sequence([
                Animated.timing(scaleParticle, {
                  toValue: 1.5,
                  duration: duration / 4,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleParticle, {
                  toValue: 0.8,
                  duration: duration / 4,
                  useNativeDriver: true,
                }),
              ])
            ),
            Animated.timing(opacityParticle, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]).start();
        }, delay);
      }, []);
      
      particles.push(
        <Animated.View
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: 'rgba(108, 99, 255, 0.2)',
            borderWidth: 1,
            borderColor: 'rgba(108, 99, 255, 0.5)',
            left: startX,
            top: startY,
            opacity: opacityParticle,
            transform: [
              { translateX: moveX.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 200],
                })
              },
              { translateY: moveY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 150],
                })
              },
              { scale: scaleParticle }
            ],
          }}
        />
      );
    }
    return particles;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Animated Background */}
      <LinearGradient
        colors={['#050816', '#08102b', '#0c1445']}
        style={styles.background}
      >
        {renderStars()}
        {renderFloatingParticles()}
        
        {/* Animated glow circles */}
        <Animated.View 
          style={[
            styles.glowCircle1, 
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.1, 0.3],
              }),
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.glowCircle2, 
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.4],
              }),
            }
          ]} 
        />
      </LinearGradient>
      
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <BlurView style={styles.formWrapper}>
          <Animated.View 
            style={[
              styles.formContainer, 
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 300 }}
            >
              <Text style={styles.title}>Welcome</Text>
              <Text style={styles.subtitle}>
                Sign in to continue
              </Text>
            </MotiView>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused
              ]}>
                <Feather name="mail" size={20} color="#6c63ff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused
              ]}>
                <Feather name="lock" size={20} color="#6c63ff" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureTextEntry}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={togglePasswordVisibility}
                >
                  <Animated.View
                    style={{
                      transform: [
                        { scale: secureTextEntry ? 1 : 1.1 }
                      ]
                    }}
                  >
                    <Ionicons 
                      name={secureTextEntry ? 'eye-off' : 'eye'}
                      size={22} 
                      color="rgba(255, 255, 255, 0.8)" 
                    />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>
            
            <Animated.View
              style={{
                transform: [{
                  scale: scaleAnim
                }],
                opacity: fadeAnim,
                width: '100%'
              }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogin}
                style={styles.buttonWrapper}
              >
                <MotiView
                  style={styles.buttonGlow}
                  from={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 1, scale: 1.05 }}
                  transition={{
                    type: 'timing',
                    duration: 1500,
                    loop: true,
                  }}
                />
                <LinearGradient
                  colors={['#6c63ff', '#8E2DE2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => {
                setForgotPasswordModalVisible(true);
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Modified Forgot Password Modal */}
            <Modal
              visible={forgotPasswordModalVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setForgotPasswordModalVisible(false)}
              statusBarTranslucent={Platform.OS === 'android'}
            >
              <TouchableWithoutFeedback onPress={() => setForgotPasswordModalVisible(false)}>
                <View style={styles.modalContainer}>
                  <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                    <BlurView style={[
                      styles.modalContent,
                      Platform.OS === 'android' && styles.androidModalContent
                    ]}>
                      <View style={styles.modalHeader}>
                        <MaterialIcons name="lock-reset" size={24} color="#6c63ff" />
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        <TouchableOpacity 
                          onPress={() => setForgotPasswordModalVisible(false)}
                          style={styles.closeButton}
                          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        >
                          <MaterialIcons name="close" size={24} color="rgba(255, 255, 255, 0.8)" />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.modalDescription}>
                        Enter your email address and we'll send you a link to reset your password.
                      </Text>

                      <View style={styles.modalInputContainer}>
                        <View style={[
                          styles.inputWrapper,
                          Platform.OS === 'android' && styles.androidInput
                        ]}>
                          <Feather name="mail" size={20} color="#6c63ff" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.resetButton,
                          !resetEmail && styles.resetButtonDisabled,
                          Platform.OS === 'android' && styles.androidButton
                        ]}
                        onPress={handleForgotPassword}
                        disabled={!resetEmail || isResetting}
                      >
                        <LinearGradient
                          colors={['#6c63ff', '#8E2DE2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.resetButtonGradient}
                        >
                          {isResetting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.resetButtonText}>Send Reset Link</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </BlurView>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>

            <View style={styles.alternateActionsContainer}>
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleSkipLogin}
              >
                <Text style={styles.skipText}>
                  Skip Login
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={styles.signUpButton}
                onPress={() => {
                  setShowSignUpModal(true);
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text style={styles.signUpText}>
                  Sign Up
                </Text>
              </TouchableOpacity>

              {/* Sign Up Modal */}
              <Modal
                visible={showSignUpModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSignUpModal(false)}
                statusBarTranslucent={Platform.OS === 'android'}
              >
                <TouchableWithoutFeedback onPress={() => setShowSignUpModal(false)}>
                  <View style={styles.modalContainer}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                      <BlurView style={[
                        styles.signUpModalContent,
                        Platform.OS === 'android' && styles.androidModalContent
                      ]}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.modalTitle}>Create Account</Text>
                          <TouchableOpacity 
                            onPress={() => setShowSignUpModal(false)}
                            style={styles.closeButton}
                            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          >
                            <MaterialIcons name="close" size={24} color="rgba(255, 255, 255, 0.8)" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Full Name</Text>
                          <View style={[
                            styles.inputWrapper,
                            Platform.OS === 'android' && styles.androidInput
                          ]}>
                            <FontAwesome5 name="user" size={18} color="#6c63ff" style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="Enter your full name"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              value={fullName}
                              onChangeText={setFullName}
                            />
                          </View>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Email</Text>
                          <View style={[
                            styles.inputWrapper,
                            Platform.OS === 'android' && styles.androidInput
                          ]}>
                            <Feather name="mail" size={20} color="#6c63ff" style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="Enter your email"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              value={signUpEmail}
                              onChangeText={setSignUpEmail}
                              keyboardType="email-address"
                              autoCapitalize="none"
                            />
                          </View>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Create Password</Text>
                          <View style={[
                            styles.inputWrapper,
                            Platform.OS === 'android' && styles.androidInput
                          ]}>
                            <Feather name="lock" size={20} color="#6c63ff" style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="Create a password"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              value={signUpPassword}
                              onChangeText={setSignUpPassword}
                              secureTextEntry={signUpPasswordHidden}
                            />
                            <TouchableOpacity 
                              style={styles.eyeIcon} 
                              onPress={() => setSignUpPasswordHidden(!signUpPasswordHidden)}
                              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            >
                              <Ionicons 
                                name={signUpPasswordHidden ? 'eye-off' : 'eye'}
                                size={22} 
                                color="rgba(255, 255, 255, 0.8)" 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.inputContainer}>
                          <Text style={styles.label}>Confirm Password</Text>
                          <View style={[
                            styles.inputWrapper,
                            Platform.OS === 'android' && styles.androidInput
                          ]}>
                            <Feather name="lock" size={20} color="#6c63ff" style={styles.inputIcon} />
                            <TextInput
                              style={styles.input}
                              placeholder="Confirm your password"
                              placeholderTextColor="rgba(255, 255, 255, 0.4)"
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry={confirmPasswordHidden}
                            />
                            <TouchableOpacity 
                              style={styles.eyeIcon} 
                              onPress={() => setConfirmPasswordHidden(!confirmPasswordHidden)}
                              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            >
                              <Ionicons 
                                name={confirmPasswordHidden ? 'eye-off' : 'eye'}
                                size={22} 
                                color="rgba(255, 255, 255, 0.8)" 
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.signUpModalButton,
                            !isValidSignUp() && styles.disabledButton,
                            Platform.OS === 'android' && styles.androidButton
                          ]}
                          onPress={handleSignUp}
                          disabled={!isValidSignUp() || isSigningUp}
                        >
                          <LinearGradient
                            colors={isValidSignUp() ? ['#6c63ff', '#8E2DE2'] : ['rgba(108, 99, 255, 0.3)', 'rgba(142, 45, 226, 0.3)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.signUpModalGradient}
                          >
                            {isSigningUp ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <MaterialIcons name="person-add" size={20} color="#fff" style={styles.signUpIcon} />
                                <Text style={styles.signUpModalButtonText}>Create Account</Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </BlurView>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
          </Animated.View>
        </BlurView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');
const cardWidth = width > 500 ? 400 : width * 0.85;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  glowCircle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: '#6c63ff',
    top: -width * 0.5,
    left: -width * 0.25,
    opacity: 0.15,
  },
  glowCircle2: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    borderRadius: width,
    backgroundColor: '#8E2DE2',
    bottom: -width * 0.3,
    right: -width * 0.2,
    opacity: 0.15,
  },
  keyboardAvoidView: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  formWrapper: {
    width: cardWidth,
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderWidth: 1,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  formContainer: {
    width: '100%',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(108, 99, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: '#6c63ff',
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: 'white',
  },
  eyeIcon: {
    padding: 8,
  },
  buttonWrapper: {
    marginTop: 16,
    height: 54,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: -10,
    right: -10,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.3)',
    zIndex: -1,
  },
  button: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  forgotPasswordButton: {
    marginTop: 16,
    marginBottom: 16,
    padding: 8,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c63ff',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderWidth: 1,
  },
  signUpModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    borderWidth: 1,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  resetButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignSelf: 'center',
    padding: 10,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  alternateActionsContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  signUpButton: {
    padding: 10,
  },
  signUpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c63ff',
  },
  signUpIcon: {
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  signUpModalButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
  },
  signUpModalGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});