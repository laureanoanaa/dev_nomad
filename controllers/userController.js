import userRepository from "../repositories/userRepository"

export const USER_ROLE = Object.freeze({
    NOMAD: 'nomad',
    HOST: 'host',
    PLACE: 'place',
    ADMIN: 'admin'
})

const ROLE_ALIASES = Object.freeze({
    nomad: USER_ROLE.NOMAD,
    nomade: USER_ROLE.NOMAD,
    dev_nomad: USER_ROLE.NOMAD,
    dev: USER_ROLE.NOMAD,
    host: USER_ROLE.HOST,
    anfitriao: USER_ROLE.HOST,
    workspace_creator: USER_ROLE.HOST,
    ponto_trabalho: USER_ROLE.HOST,
    place: USER_ROLE.PLACE,
    lugar: USER_ROLE.PLACE,
    estabelecimento: USER_ROLE.PLACE,
    local: USER_ROLE.PLACE,
    admin: USER_ROLE.ADMIN,
    administrador: USER_ROLE.ADMIN,
})

export const ROLE_PERMISSIONS = Object.freeze({
    [USER_ROLE.NOMAD]: {
        canUseWorkspace: true,
        canUseCheckIn: true,
        canReviewPlaces: true,
        canCreateWorkPlaces: false,
        canManageWorkPlaces: false,
        canRegisterPlaces: false,
        canManageUsers: false
    },
    [USER_ROLE.HOST]: {
        canUseWorkspace: true,
        canUseCheckIn: true,
        canReviewPlaces: true,
        canCreateWorkPlaces: true,
        canManageWorkPlaces: true,
        canRegisterPlaces: true,
        canManageUsers: false
    },
    [USER_ROLE.PLACE]: {
        canUseWorkspace: false,
        canUseCheckIn: false,
        canReviewPlaces: false,
        canCreateWorkPlaces: true,
        canManageWorkPlaces: true,
        canRegisterPlaces: true,
        canManageUsers: false
    },
    [USER_ROLE.ADMIN]: {
        canUseWorkspace: true,
        canUseCheckIn: true,
        canReviewPlaces: true,
        canCreateWorkPlaces: true,
        canManageWorkPlaces: true,
        canRegisterPlaces: true,
        canManageUsers: true
    }
})

export class UserController {
    /**
     * @param {Object} repository
     */
    constructor(repository = userRepository) {
        this.userRepository = repository
    }

    /**
     * @param {string} [role]
     * @returns {string}
     */

    normalizeRole(role) {
        if (!role) {
            return USER_ROLE.NOMAD
        }

        const cleanRole = String(role)
            .trim()
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u36f]/g, '')

        const mappedRole = ROLE_ALIASES[cleanRole]

        if (!mappedRole) {
            const validRoles = Object.values(USER_ROLE).join(',')
            throw new Error(`Perfil de Usuário Inválido(${role}).
            Perfis permitidos: ${validRoles}. `)
        }
        return mappedRole
    }

    /**
     * @param {string} email
     * @returns {string}
     */

    validateEmail(email){
        if (email || typeof != 'string'){
            throw new ('O e-mail precisa estar em forma de texto.')
        }

        const normalizeEmail = email.trim().toLowerCase()
        const emailRejex = /^[^\s@]+@[^\s@]+\.[\s@]+$/;
        
        if(!emailRejex.test(normalizeEmail)){
            throw new Error('Formato do e-mail inválido.')
        }

        return normalizeEmail
    }
}