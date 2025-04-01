import React, { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Switch,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Linking
} from 'react-native';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, Ionicons, FontAwesome5, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { MotiView } from 'moti';
import { toast } from 'sonner-native';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode, theme, toggleTheme } = useTheme();  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    bio: "AI Research Enthusiast"
  });
  
  // Editable values state
  const [fullName, setFullName] = useState(profileData.fullName);
  const [email, setEmail] = useState(profileData.email);
  const [bio, setBio] = useState(profileData.bio);
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  // Profile image
  const [profileImage, setProfileImage] = useState("https://api.a0.dev/assets/image?text=minimal%20profile%20avatar%20professional&aspect=1:1&seed=123");
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Handle profile image selection
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission required to access media library');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0].uri) {
      setProfileImage(result.assets[0].uri);
      toast.success('Profile picture updated');
    }
  };  // Handle saving profile changes
  const handleSaveProfile = () => {
    setProfileData({
      fullName,
      email,
      bio
    });
    
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };  // Navigate to Change Password Screen
  const navigateToChangePassword = () => {
    navigation.navigate('ChangePasswordScreen');
  };
  
  // Handle logout
  const handleLogout = () => {
    navigation.navigate('LogoutScreen');
  };
  
  // Animated header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  
  // Handle edit profile animation
  const handleEditProfilePress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsEditing(true);
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { 
          backgroundColor: theme.card,
          opacity: headerOpacity,
          shadowOpacity: headerOpacity,
          borderBottomColor: theme.border 
        }
      ]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.headerRight} />
      </Animated.View>
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={[styles.profileSection, { backgroundColor: theme.card }]}
        >
          <View style={styles.profileImageSection}>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={handleImagePick}
            >
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
              <View style={styles.editImageButton}>
                <MaterialIcons name="photo-camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full Name"
                placeholderTextColor={theme.secondaryText}
              />
              <TextInput
                style={[styles.editInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={theme.secondaryText}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.editInput, { color: theme.text, backgroundColor: theme.inputBackground, minHeight: 80 }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor={theme.secondaryText}
                multiline
                textAlignVertical="top"
              />
              
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={[styles.editButton, styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    // Reset to original values
                    setFullName(profileData.fullName);
                    setEmail(profileData.email);
                    setPhoneNumber(profileData.phoneNumber);
                    setBio(profileData.bio);
                    setIsEditing(false);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleSaveProfile}
                >
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>{profileData.fullName}</Text>
              <Text style={[styles.userEmail, { color: theme.secondaryText }]}>{profileData.email}</Text>
              <Text style={[styles.userBio, { color: theme.secondaryText }]}>{profileData.bio}</Text>
              
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity 
                  style={styles.editProfileButton}
                  onPress={handleEditProfilePress}
                >
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.editProfileGradient}
                  >
                    <MaterialIcons name="edit" size={20} color="#fff" />
                    <Text style={styles.editProfileText}>Edit Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </MotiView>        {/* Settings Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          style={[styles.settingsSection, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={22} 
                color={theme.accent} 
              />
              <Text style={[styles.settingText, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <ThemeToggle />
          </View>          <TouchableOpacity 
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('ChangePasswordScreen')}
          >
            <View style={styles.settingInfo}>
              <MaterialIcons 
                name="lock" 
                size={22} 
                color={theme.accent} 
              />
              <Text style={[styles.settingText, { color: theme.text }]}>Change Password</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={theme.secondaryText} />
          </TouchableOpacity>

          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <MaterialIcons 
                name="notifications" 
                size={22} 
                color={theme.accent} 
              />
              <Text style={[styles.settingText, { color: theme.text }]}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#DEE2E6', true: theme.accent }}
              thumbColor={'#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialIcons 
                name="notifications-active" 
                size={22} 
                color={theme.accent} 
              />
              <Text style={[styles.settingText, { color: theme.text }]}>In-app Notifications</Text>
            </View>
            <Switch
              value={inAppNotifications}
              onValueChange={setInAppNotifications}
              trackColor={{ false: '#DEE2E6', true: theme.accent }}
              thumbColor={'#FFFFFF'}
            />
          </View>
        </MotiView>
        
        {/* Support Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 300 }}
          style={[styles.supportSection, { backgroundColor: theme.card }]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Support</Text>
          
          <TouchableOpacity 
            style={[styles.supportRow, { borderBottomColor: theme.border }]}
            onPress={() => toast.info('Help Center feature coming soon')}
          >
            <View style={styles.supportIconContainer}>
              <MaterialIcons name="help-outline" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.supportText, { color: theme.text }]}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={22} color={theme.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.supportRow, { borderBottomColor: theme.border }]}
            onPress={() => toast.info('Privacy Policy will open in browser')}
          >
            <View style={styles.supportIconContainer}>
              <MaterialIcons name="security" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.supportText, { color: theme.text }]}>Privacy Policy</Text>
            <MaterialIcons name="chevron-right" size={22} color={theme.secondaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.supportRow}
            onPress={() => toast.info('Terms of Service will open in browser')}
          >
            <View style={styles.supportIconContainer}>
              <MaterialIcons name="description" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.supportText, { color: theme.text }]}>Terms of Service</Text>
            <MaterialIcons name="chevron-right" size={22} color={theme.secondaryText} />
          </TouchableOpacity>
        </MotiView>
        
        {/* Version Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={styles.versionContainer}
        >
          <View style={styles.versionContent}>
            <MaterialCommunityIcons name="flask-outline" size={18} color={theme.secondaryText} />
            <Text style={[styles.versionText, { color: theme.secondaryText }]}>
              Royal Research • Version 1.0.0
            </Text>
          </View>
        </MotiView>
        
        {/* Logout Button */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 500 }}
          style={styles.logoutContainer}
        >
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#e74c3c" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    zIndex: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    borderRadius: 24,
    margin: 16,
    marginTop: 70,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageSection: {
    marginTop: -60,
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  editImageButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#6c63ff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  userBio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  editProfileButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  editContainer: {
    width: '100%',
  },
  editInput: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    marginRight: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 12,
  },
  saveButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    margin: 16,
    marginTop: 0,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingsSection: {
    margin: 16,
    marginTop: 0,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 15,
    marginLeft: 16,
  },
  supportSection: {
    margin: 16,
    marginTop: 0,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  supportText: {
    fontSize: 15,
    flex: 1,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  versionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    marginLeft: 6,
  },
  logoutContainer: {
    margin: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});