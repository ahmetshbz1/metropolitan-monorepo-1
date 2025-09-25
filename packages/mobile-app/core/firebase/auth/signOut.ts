import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export async function firebaseSignOut() {
  try {
    await signOut(auth);
    console.log("Firebase sign out successful");
    return { success: true };
  } catch (error) {
    console.error("Firebase sign out error:", error);
    return { success: false, error };
  }
}