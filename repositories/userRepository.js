import authService from '../services/authService'
import firestoreService from '../services/firestoreService'

export class UserRepository {
    /**
     * @param {Object} auth
     * @param {Object} firestore
     */

    constructor(auth = authService, firestore = firestoreService) {
        this.authService = auth
        this.firestoreService = firestore
    }

    /**
     * @param {User|Object} userData
     * @returns {Promise<User>}
     */

    async createUserAccount(userData) {
        try {
            if (!userData.email || !userData.password) {
                throw new Error("Email e senha são obrigatórios.")
            }
            const authUser = await this.authService.createUser(userData.email, userData.password)

            if (userData.displayName || userData.photoURL) {
                try {
                    await this.authService.updateProfile(
                        userData.displayName || '',
                        userData.photoURL || ''
                    )
                } catch (errorProfile) {
                    console.warn(`[Repositório de Usuário] Erro de Update: ${errorProfile}`)
                }
            }
            const userEntity = new User({
                ...userData,
                uid: authUser.uid,
                emailVerified: authUser.email || false,
                password: null
            })
            const saveUser = await this.firestoreService.createUser(userEntity)
            return saveUser
        } catch (error) {
            this._handlerError('createAccount', error)
            throw error;
        }
    }

    /**
     * @param {string} email
     * @param {string} password
     * @returns {Promise<User>}
     */

    async authenticate(email, password) {
        try {
            const authUser = await this.authService.signIn(email, password)
            let user = await firestoreService.getUserById(authUser.uid)

            if (!user) {
                user = new User({
                    uid: authUser.uid,
                    email: authUser.email,
                    displayName: authUser.displayName || '',
                    photoURL: authUser.photoURL || '',
                    emailVerified: authUser || false
                })
            }
            return user
        } catch (error) {
            this._handlerError('authenticate', error)
            throw error
        }
    }

    /**
     * 
     * @param {string} uid 
     * @returns {Promise<User>} 
     */

    async disable(uid) {
        try {
            return await this.firestoreService.updateUser(uid, { disable: true })
        } catch (error) {
            this._handlerError('disable', error)
            throw error
        }
    }

    _handlerError(action, error) {
        console.error(`[UserRepository] - ${action} Code: ${error.code || 'UNKOWN'}, ${error.message}.`)
    }
}

export default new UserRepository()