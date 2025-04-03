import React, { useState, useRef, useEffect } from 'react';
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
  Linking,
  ActivityIndicator,
  Alert,
  RefreshControl
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
import { supabase } from '../utils/supabase';
import { 
  fetchUserProfileWithCache, 
  fetchUserEmailWithCache, 
  updateUserProfile, 
  clearProfileCache,
  logoutAndClearCache,
  ProfileData
} from '../utils/profileService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isDarkMode, theme, toggleTheme } = useTheme();  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    email: '',
    bio: '',
    avatarUrl: null
  });
  
  // Editable values state
  const [username, setUsername] = useState(profileData.username);
  const [bio, setBio] = useState(profileData.bio);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  // Profile image
  const [profileImage, setProfileImage] = useState("https://api.a0.dev/assets/image?text=minimal%20profile%20avatar%20professional&aspect=1:1&seed=123");
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Add state for email loading
  const [emailLoading, setEmailLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Add refreshing state
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    fetchUserProfile();
    fetchUserEmail();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Use cached profile data
      const profile = await fetchUserProfileWithCache();
      
      if (!profile) {
        console.log('No profile found');
        return;
      }

      // Extract user ID from profile data
      setUserId(profile.id || null);

      // Update local state with profile data
      setProfileData(profile);
      setUsername(profile.username);
      setBio(profile.bio);
      
      // Set profile image if available
      if (profile.avatarUrl) {
        setProfileImage(profile.avatarUrl);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
      toast.error('Failed to load profile information');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEmail = async () => {
    try {
      setEmailLoading(true);
      
      // Use cached email
      const email = await fetchUserEmailWithCache();
      setUserEmail(email);
    } catch (error: any) {
      console.error('Error fetching email:', error.message);
      toast.error('Failed to load email');
    } finally {
      setEmailLoading(false);
    }
  };

  const pickImage = async () => {
    try {
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
        uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      toast.error('Failed to pick image');
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!userId) {
      toast.error('No user session found');
      return;
    }

    setLoading(true);
    try {
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL using the profile service
      const success = await updateUserProfile({
        avatarUrl: publicUrl
      });

      if (!success) {
        throw new Error('Failed to update profile with new avatar');
      }

      // Update local state
      setProfileData(prev => ({
        ...prev,
        avatarUrl: publicUrl
      }));
      
      setProfileImage(publicUrl);
      
      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      toast.error('No user session found');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    setLoading(true);
    try {
      // Update profile using the profile service
      const success = await updateUserProfile({
        username,
        bio
      });

      if (!success) {
        throw new Error('Failed to update profile');
      }

      // Update local state
      setProfileData(prev => ({
        ...prev,
        username,
        bio
      }));
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to Change Password Screen
  const navigateToChangePassword = () => {
    navigation.navigate('ChangePasswordScreen');
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      // Use the profileService to handle logout and cache clearing
      const success = await logoutAndClearCache();
      
      if (!success) {
        throw new Error('Failed to sign out');
      }
      
      toast.success('Signed out successfully');
      
      // Navigate to sign in screen
      navigation.navigate('SignInScreen' as never);
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
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

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      // Clear profile cache to force fresh data
      if (userId) {
        await clearProfileCache(userId);
      }
      
      // Fetch fresh profile data and email
      await Promise.all([
        fetchUserProfile(),
        fetchUserEmail()
      ]);
      
      toast.success('Profile refreshed');
    } catch (error) {
      console.error('Error refreshing profile:', error);
      toast.error('Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  if (emailLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6c63ff']}
            tintColor={isDarkMode ? '#6c63ff' : '#3f51b5'}
          />
        }
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
              onPress={pickImage}
              disabled={loading}
            >
              {loading ? (
                <View style={[styles.profileImage, { backgroundColor: theme.inputBackground }]}>
                  <ActivityIndicator size="large" color={theme.accent} />
                </View>
              ) : (
                <>
                  <Image
                    source={{ 
                      uri: profileData.avatarUrl || 
                           "https://api.a0.dev/assets/image?text=minimal%20profile%20avatar%20professional&aspect=1:1&seed=123"
                    }}
                    style={styles.profileImage}
                  />
                  <View style={styles.editImageButton}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={[styles.editInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={theme.secondaryText}
                autoCapitalize="none"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <TextInput
                style={[styles.editInput, { color: theme.text, backgroundColor: theme.inputBackground }]}
                value={profileData.email}
                editable={false}
                placeholder="Email"
                placeholderTextColor={theme.secondaryText}
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
                    setUsername(profileData.username);
                    setBio(profileData.bio);
                    setError('');
                    setIsEditing(false);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.saveButtonGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.text }]}>
                {profileData.username || 'No username set'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.secondaryText }]}>
                {profileData.email || 'No email available'}
              </Text>
              <Text style={[styles.userBio, { color: theme.secondaryText }]}>
                {profileData.bio || 'No bio added yet'}
              </Text>
              
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
          
          {/* Developer Mode Button - Hidden by default */}
          <TouchableOpacity 
            style={[styles.supportRow, { marginTop: 20, borderTopWidth: 1, borderTopColor: theme.border }]}
            onPress={() => navigation.navigate('DevPasswordScreen')}
          >
            <View style={styles.supportIconContainer}>
              <MaterialIcons name="code" size={22} color={theme.accent} />
            </View>
            <Text style={[styles.supportText, { color: theme.text }]}>Dev Page</Text>
            <MaterialIcons 
              name="chevron-right" 
              size={22} 
              color={theme.secondaryText} 
            />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emailLoader: {
    marginVertical: 8,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4
  },
});