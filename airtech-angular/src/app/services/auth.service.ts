import { Injectable, signal, inject } from '@angular/core';
import {
    Auth, user, User, signOut, GoogleAuthProvider, signInWithPopup,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile
} from '@angular/fire/auth';
import { Database, ref, get, set } from '@angular/fire/database';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: string;
    phone?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private db = inject(Database);
    private router = inject(Router);

    // Angular Fire provides user as an observable, convert to signal
    private firebaseUser = toSignal(user(this.auth));

    // Public signals for the application
    currentUser = signal<UserProfile | null>(null);
    isLoading = signal<boolean>(true);
    isAdmin = signal<boolean>(false);

    constructor() {
        // Watch for auth changes and fetch profile/roles
        this.auth.onAuthStateChanged(async (fbUser) => {
            if (fbUser) {
                await this.syncProfile(fbUser);
            } else {
                this.currentUser.set(null);
                this.isAdmin.set(false);
            }
            this.isLoading.set(false);
        });
    }

    private async syncProfile(fbUser: User) {
        try {
            const userRef = ref(this.db, `users/${fbUser.uid}`);
            const snapshot = await get(userRef);

            let role = 'user';
            let phone = '';
            if (snapshot.exists()) {
                const data = snapshot.val();
                role = data.role || 'user';
                phone = data.phone || '';
            }

            this.currentUser.set({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                role: role,
                phone: phone
            });

            const isSystemAdmin = fbUser.email?.toLowerCase().trim() === 'roadyakib@gmail.com';
            const hasAdminRole = role?.toUpperCase() === 'ADMIN';
            const adminStatus = isSystemAdmin || hasAdminRole;

            this.isAdmin.set(adminStatus);
            console.log(`AuthService: Sync complete. Role: ${role}, Admin: ${adminStatus}`);
        } catch (error) {
            console.error("Error syncing profile:", error);
            this.currentUser.set({
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName,
                photoURL: fbUser.photoURL,
                role: 'user'
            });
        }
    }

    async login(email: string, password: string) {
        return signInWithEmailAndPassword(this.auth, email, password);
    }

    async register(data: any) {
        const userCredential = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
        const user = userCredential.user;

        // Update Profile
        await updateProfile(user, { displayName: data.name });

        // Sync to Database
        await set(ref(this.db, `users/${user.uid}`), {
            uid: user.uid,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: "USER",
            createdAt: new Date().toISOString(),
        });

        return userCredential;
    }

    async logout() {
        await signOut(this.auth);
        this.router.navigate(['/auth/login']);
    }

    async loginWithGoogle() {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(this.auth, provider);
    }
}
