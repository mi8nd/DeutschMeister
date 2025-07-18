import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser,
    sendPasswordResetEmail,
    confirmPasswordReset,
    verifyPasswordResetCode,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { auth, db } from './firebase.js';

async function ensureUserDocument(user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        await setDoc(userDocRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            createdAt: new Date(),
            photoURL: user.photoURL,
            progress: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0 },
            timestamps: {},
            quizScores: {}
        });
    }
    return { success: true };
}

async function handleSignUp(name, email, password) {
    let user = null;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await ensureUserDocument(user);
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

async function handleGoogleSignIn() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await ensureUserDocument(result.user);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Google Sign-In failed:", error);
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

async function handleDeleteAccount(password) {
    const user = auth.currentUser;
    if (!user) {
        return { success: false, error: "No user is logged in." };
    }
    try {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        const userDocRef = doc(db, "users", user.uid);
        await deleteDoc(userDocRef);
        await deleteUser(user);
        
        return { success: true };
    } catch (error) {
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: "Incorrect password. Account not deleted." };
        }
        return { success: false, error: "An error occurred during account deletion." };
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

async function handleChangePassword(currentPassword, newPassword) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('No user is currently logged in.');
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        return { success: true };
    } catch (error) {
        if (error.code === 'auth/wrong-password') {
            return { success: false, error: 'Incorrect current password. Please try again.' };
        }
        return { success: false, error: 'Failed to change password. Please try again.' };
    }
}

export {
    handleSignUp, handleLogin, handleLogout, handleLogoutAndReset,
    handleDeleteAccount, handlePasswordReset, handleVerifyPasswordResetCode,
    handleConfirmPasswordReset, handleChangePassword, handleGoogleSignIn
};
