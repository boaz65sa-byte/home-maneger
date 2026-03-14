import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, googleProvider, ADMIN_EMAIL } from '../firebase';
import { defaultCategories, defaultMembers, defaultSettings, defaultBudgets, generateSampleData } from '../store';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);

  // Real-time data
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [members, setMembers] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [settings, setSettings] = useState(defaultSettings);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newUser = {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            familyId: null,
            role: firebaseUser.email === ADMIN_EMAIL ? 'admin' : 'member',
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newUser);
          setUserDoc(newUser);
        } else {
          setUserDoc(userSnap.data());
        }
      } else {
        setUserDoc(null);
        setFamily(null);
        setTransactions([]);
        setCategories([]);
        setMembers([]);
        setBudgets([]);
        setSettings(defaultSettings);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Family & real-time data listeners
  useEffect(() => {
    if (!userDoc?.familyId) return;
    const familyId = userDoc.familyId;

    // Family doc
    const familyUnsub = onSnapshot(doc(db, 'families', familyId), (snap) => {
      if (snap.exists()) {
        setFamily({ id: snap.id, ...snap.data() });
        setSettings(snap.data().settings || defaultSettings);
      }
    });

    // Transactions
    const txUnsub = onSnapshot(
      query(collection(db, 'families', familyId, 'transactions'), orderBy('date', 'desc')),
      (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Categories
    const catUnsub = onSnapshot(
      collection(db, 'families', familyId, 'categories'),
      (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Members
    const memUnsub = onSnapshot(
      collection(db, 'families', familyId, 'members'),
      (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Budgets
    const budUnsub = onSnapshot(
      collection(db, 'families', familyId, 'budgets'),
      (snap) => setBudgets(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      familyUnsub();
      txUnsub();
      catUnsub();
      memUnsub();
      budUnsub();
    };
  }, [userDoc?.familyId]);

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
  }

  // Create a new family
  async function createFamily(familyName) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const familyRef = await addDoc(collection(db, 'families'), {
      name: familyName,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      inviteCode,
      settings: { ...defaultSettings, familyName },
    });

    const familyId = familyRef.id;

    // Seed default data
    const batch = [];
    for (const cat of defaultCategories) {
      batch.push(addDoc(collection(db, 'families', familyId, 'categories'), cat));
    }
    for (const mem of defaultMembers) {
      batch.push(addDoc(collection(db, 'families', familyId, 'members'), mem));
    }
    for (const bud of defaultBudgets) {
      batch.push(addDoc(collection(db, 'families', familyId, 'budgets'), bud));
    }
    const sampleTx = generateSampleData();
    for (const tx of sampleTx) {
      batch.push(addDoc(collection(db, 'families', familyId, 'transactions'), tx));
    }
    await Promise.all(batch);

    // Link user to family
    await updateDoc(doc(db, 'users', user.uid), { familyId, role: 'parent' });
    setUserDoc(prev => ({ ...prev, familyId, role: 'parent' }));
    return inviteCode;
  }

  // Join existing family by invite code
  async function joinFamily(inviteCode) {
    const { getDocs, query: q, where } = await import('firebase/firestore');
    const snap = await getDocs(q(collection(db, 'families'), where('inviteCode', '==', inviteCode.toUpperCase())));
    if (snap.empty) throw new Error('קוד הזמנה לא תקין');
    const familyId = snap.docs[0].id;
    await updateDoc(doc(db, 'users', user.uid), { familyId, role: 'member' });
    setUserDoc(prev => ({ ...prev, familyId, role: 'member' }));
  }

  // Data operations
  async function addTransaction(tx) {
    await addDoc(collection(db, 'families', userDoc.familyId, 'transactions'), tx);
  }

  async function updateTransaction(id, tx) {
    await updateDoc(doc(db, 'families', userDoc.familyId, 'transactions', id), tx);
  }

  async function deleteTransaction(id) {
    await deleteDoc(doc(db, 'families', userDoc.familyId, 'transactions', id));
  }

  async function addCategory(cat) {
    await addDoc(collection(db, 'families', userDoc.familyId, 'categories'), cat);
  }

  async function updateCategory(id, cat) {
    await updateDoc(doc(db, 'families', userDoc.familyId, 'categories', id), cat);
  }

  async function deleteCategory(id) {
    await deleteDoc(doc(db, 'families', userDoc.familyId, 'categories', id));
  }

  async function addMember(mem) {
    await addDoc(collection(db, 'families', userDoc.familyId, 'members'), mem);
  }

  async function updateMember(id, mem) {
    await updateDoc(doc(db, 'families', userDoc.familyId, 'members', id), mem);
  }

  async function deleteMember(id) {
    await deleteDoc(doc(db, 'families', userDoc.familyId, 'members', id));
  }

  async function addBudget(bud) {
    await addDoc(collection(db, 'families', userDoc.familyId, 'budgets'), bud);
  }

  async function updateBudget(id, bud) {
    await updateDoc(doc(db, 'families', userDoc.familyId, 'budgets', id), bud);
  }

  async function deleteBudget(id) {
    await deleteDoc(doc(db, 'families', userDoc.familyId, 'budgets', id));
  }

  async function updateSettings(newSettings) {
    await updateDoc(doc(db, 'families', userDoc.familyId), { settings: newSettings });
  }

  async function resetFamilyData() {
    const { getDocs } = await import('firebase/firestore');
    const familyId = userDoc.familyId;
    const cols = ['transactions', 'categories', 'members', 'budgets'];

    // Delete all existing docs
    for (const col of cols) {
      const snap = await getDocs(collection(db, 'families', familyId, col));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    }

    // Reseed with defaults
    const batch = [];
    for (const cat of defaultCategories) {
      batch.push(addDoc(collection(db, 'families', familyId, 'categories'), cat));
    }
    for (const mem of defaultMembers) {
      batch.push(addDoc(collection(db, 'families', familyId, 'members'), mem));
    }
    for (const bud of defaultBudgets) {
      batch.push(addDoc(collection(db, 'families', familyId, 'budgets'), bud));
    }
    const sampleTx = generateSampleData();
    for (const tx of sampleTx) {
      batch.push(addDoc(collection(db, 'families', familyId, 'transactions'), tx));
    }
    await Promise.all(batch);
  }

  const value = {
    user,
    userDoc,
    family,
    isAdmin,
    loading,
    loginWithGoogle,
    logout,
    createFamily,
    joinFamily,
    // data
    transactions,
    categories,
    members,
    budgets,
    settings,
    // operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addMember,
    updateMember,
    deleteMember,
    addBudget,
    updateBudget,
    deleteBudget,
    updateSettings,
    resetFamilyData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
