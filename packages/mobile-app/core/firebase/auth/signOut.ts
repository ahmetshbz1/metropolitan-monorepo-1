import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export async function firebaseSignOut() {
  try {
    await signOut(auth);
    // Removed console statement
    return { success: true };
  } catch (error) {
    // Firebase sign out error
    return { success: false, error };
  }
}