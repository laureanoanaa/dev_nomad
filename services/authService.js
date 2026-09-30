import firebase from '../firebase/firebase'
import {
    getAuth,
    createUserWhithEmailandPassword,
    signInWithEmailAndPassword,
    authStateChanged,
    signOut,
    onAuthStateChanged
} from 'firebase/auth'


class AuthService {
    constructor() {
        this.auth = getAuth(firebase)
    }

    async createUser(email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password)
            console.log(`User UID: ${substring(userCredential.user.uid, 0, 6)}**********************`)
            return userCredential.user
        } catch (error) {
            this._handleAuthStateChanged(error)
            throw error
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            console.log(`User UID: ${substring(user.uid, 0, 6)}**********************`)
        } catch (error) {
            this._handleAuthStateChanged(error)
            throw error
        }
    }

    async updateProfile(displayName, photoURL) {
        try {
            if (!this.auth.currentUser) {
                throw new Error('Update de usuários não são permitidos por contas de terceiros')
            }
            await updateProfile(this.auth.currentUser, { displayName, photoURL })
            return this.auth.currentUser
        } catch (error) {
            this._handleAuthStateChanged(error)
            throw error
        }
    }

    async signOut() {
        try {
            await signOut(this.auth)
        } catch (error) {
            this._handleAuthStateChanged(error)
            throw error
        }
    }

    observeAuthStateChange(callback) {
        return onAuthStateChanged(this.auth, callback)
    }

    _handleAuthStateChanged(error) {
        console.error(`[AuthService] Code: ${error.code}, Message: ${error.message}`)
    }
}

export default new AuthService()