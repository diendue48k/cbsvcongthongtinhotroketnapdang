import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface UserProfile {
  uid: string;
  email: string;
  role: 'student' | 'admin';
  isSuperAdmin?: boolean;
  studentId?: string;
  cccd?: string;
  phone?: string;
  fullName?: string;
  createdAt: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            console.log('User profile found in AuthContext');
            const data = userDoc.data() as UserProfile;
            const userEmail = firebaseUser.email?.toLowerCase();
            
            let isAdmin = false;
            let isSuperAdmin = false;
            if (userEmail) {
              const adminEmailsRef = collection(db, 'admin_emails');
              const q = query(adminEmailsRef, where('email', '==', userEmail));
              const querySnapshot = await getDocs(q);
              
              let adminRole = 'student';
              if (!querySnapshot.empty) {
                adminRole = querySnapshot.docs[0].data().role || 'admin';
              }

              isSuperAdmin = adminRole === 'super_admin' || 
                userEmail === 'levinhdienthptbenhai@gmail.com' ||
                userEmail === 'levinhdienqt123@gmail.com' ||
                userEmail === 'levinhdien9bthcschuvanan@gmail.com' ||
                userEmail === 'levinhdien48kdue@gmail.com';
                
              isAdmin = !querySnapshot.empty || isSuperAdmin;
            }

            data.isSuperAdmin = isSuperAdmin;

            if (isAdmin && data.role !== 'admin') {
              data.role = 'admin';
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            }

            // If profile is missing fullName or studentId, try to fetch from application
            if (!data.fullName || !data.studentId) {
              const q = query(collection(db, 'applications'), where('userId', '==', firebaseUser.uid));
              const querySnapshot = await getDocs(q);
              if (!querySnapshot.empty) {
                const appData = querySnapshot.docs[0].data();
                const updates: any = {};
                if (!data.fullName && appData.basicInfo?.fullName) {
                  updates.fullName = appData.basicInfo.fullName.toUpperCase();
                  data.fullName = updates.fullName;
                }
                if (!data.studentId && appData.basicInfo?.studentId) {
                  updates.studentId = appData.basicInfo.studentId;
                  data.studentId = updates.studentId;
                }
                if (Object.keys(updates).length > 0) {
                  await setDoc(userDocRef, updates, { merge: true });
                }
              }
            }

            setProfile(data);
          } else {
            console.log('User profile NOT found in AuthContext, creating default...');
            // Create default profile if not exists
            const userEmail = firebaseUser.email?.toLowerCase() || '';
            let isAdmin = false;
            let isSuperAdmin = false;
            if (userEmail) {
              const adminEmailsRef = collection(db, 'admin_emails');
              const q = query(adminEmailsRef, where('email', '==', userEmail));
              const querySnapshot = await getDocs(q);
              
              let adminRole = 'student';
              if (!querySnapshot.empty) {
                adminRole = querySnapshot.docs[0].data().role || 'admin';
              }

              isSuperAdmin = adminRole === 'super_admin' || 
                userEmail === 'levinhdienthptbenhai@gmail.com' ||
                userEmail === 'levinhdienqt123@gmail.com' ||
                userEmail === 'levinhdien9bthcschuvanan@gmail.com' ||
                userEmail === 'levinhdien48kdue@gmail.com';
                
              isAdmin = !querySnapshot.empty || isSuperAdmin;
            }

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdmin ? 'admin' : 'student',
              isSuperAdmin,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        } catch (error) {
          setLoading(false);
          if (error instanceof Error && error.message.includes('offline')) {
            console.error('Client is offline. Cannot fetch user profile.');
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: 'student',
              createdAt: new Date().toISOString()
            });
          } else {
            try {
              handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            } catch (e) {
              // Ignore thrown error
            }
          }
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
