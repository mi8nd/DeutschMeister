import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser,
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode,
    updatePassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';

async function handleSignUp(name, email, password) {
    let user = null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        await updateProfile(user, { displayName: name });
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, {
            uid: user.uid,
            displayName: name,
            email: user.email,
            createdAt: new Date(),
            photoURL: null,
            progress: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
            timestamps: {},
            quizScores: {}
        });
        return { success: true, user };
    } catch (error) {
        if (user) {
            try { await deleteUser(user); } catch (deleteError) { console.error("Rollback failed:", deleteError); }
        }
        return { success: false, error: error.message };
    }
}

async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleLogoutAndReset() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                progress: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
                timestamps: {},
                quizScores: {}
            });
        }
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleDeleteAccount() {
    try {
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            await deleteDoc(userDocRef);
            await deleteUser(user);
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handlePasswordReset(email) {
    try {
        const actionCodeSettings = { url: 'https://deutschmeister.netlify.app/' };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return { success: true };
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            return { success: true };
        }
        return { success: false, error: error.message };
    }
}

async function handleVerifyPasswordResetCode(code) {
    try {
        const email = await verifyPasswordResetCode(auth, code);
        return { success: true, email: email };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleConfirmPasswordReset(code, newPassword) {
    try {
        await confirmPasswordReset(auth, code, newPassword);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleChangePassword(newPassword) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user is currently logged in.');
        await updatePassword(user, newPassword);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export {
    handleSignUp, handleLogin, handleLogout, handleLogoutAndReset,
    handleDeleteAccount, handlePasswordReset, handleVerifyPasswordResetCode,
    handleConfirmPasswordReset, handleChangePassword
};
