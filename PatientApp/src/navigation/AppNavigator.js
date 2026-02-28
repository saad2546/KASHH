import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Calendar, Stethoscope, FileText, User } from 'lucide-react-native';
import { auth } from '../utils/firebaseConfig';

// Import Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Import Main Screens
import DoctorListScreen from '../screens/DoctorListScreen';
import PatientIntakeScreen from '../screens/PatientIntakeScreen';
import SlotSelectionScreen from '../screens/SlotSelectionScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import VisitStatusScreen from '../screens/VisitStatusScreen';
import PrescriptionListScreen from '../screens/PrescriptionListScreen';
import PrescriptionDetailScreen from '../screens/PrescriptionDetailScreen';

// Import Profile Screens
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationPrefsScreen from '../screens/NotificationPrefsScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import AccountSettingsScreen from '../screens/AccountSettingsScreen';

const Tab = createBottomTabNavigator();
const BookStack = createNativeStackNavigator();
const PrescriptionStack = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function BookStackNavigator() {
  return (
    <BookStack.Navigator screenOptions={{ headerShown: false }}>
      <BookStack.Screen name="DoctorList" component={DoctorListScreen} />
      <BookStack.Screen name="PatientIntake" component={PatientIntakeScreen} />
      <BookStack.Screen name="SlotSelection" component={SlotSelectionScreen} />
      <BookStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
    </BookStack.Navigator>
  );
}

function PrescriptionStackNavigator() {
  return (
    <PrescriptionStack.Navigator screenOptions={{ headerShown: false }}>
      <PrescriptionStack.Screen name="PrescriptionList" component={PrescriptionListScreen} />
      <PrescriptionStack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
    </PrescriptionStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStackNav.Screen name="NotificationPrefs" component={NotificationPrefsScreen} />
      <ProfileStackNav.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <ProfileStackNav.Screen name="AccountSettings" component={AccountSettingsScreen} />
    </ProfileStackNav.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Book') return <Stethoscope color={color} size={size} />;
          if (route.name === 'My Visit') return <Calendar color={color} size={size} />;
          if (route.name === 'Prescriptions') return <FileText color={color} size={size} />;
          if (route.name === 'Profile') return <User color={color} size={size} />;
        },
        tabBarActiveTintColor: '#0F52BA',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { paddingBottom: 5, paddingTop: 5, height: 60 }
      })}
    >
      <Tab.Screen name="Book" component={BookStackNavigator} />
      <Tab.Screen name="My Visit" component={VisitStatusScreen} />
      <Tab.Screen name="Prescriptions" component={PrescriptionStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [initializing, setInit] = useState(true);

  useEffect(() => {
    const subscriber = auth.onAuthStateChanged((userState) => {
      setUser(userState);
      if (initializing) setInit(false);
    });
    return subscriber; // unsubscribe on unmount
  }, [initializing]);

  if (initializing) return null; // Or a Splash Screen

  return (
    <NavigationContainer>
      {user ? (
        <MainTabNavigator />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
          <AuthStack.Screen name="RegisterScreen" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
