// Native Firebase SDK for React Native
// Firebase is automatically initialized from GoogleService-Info.plist (iOS) or google-services.json (Android)
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Note: Native Firebase SDK automatically initializes from GoogleService-Info.plist/google-services.json
// No manual initialization needed - Firebase is ready to use

// Export auth instance
export { auth };
export default firebase;
