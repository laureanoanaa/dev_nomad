import { type } from 'firebase/firestore/pipelines'
import { USER_ROLES, ROLE_PERMISSIONS } from '../controllers/userController'

const ROLE_ALIASES = Object.freeze({
    nomad: USER_ROLES.NOMAD,
    nomade: USER_ROLES.NOMAD,
    dev_nomad: USER_ROLES.NOMAD,
    dev: USER_ROLES.NOMAD,
    host: USER_ROLES.HOST,
    anfitriao: USER_ROLES.HOST,
    workspace_creator: USER_ROLES.HOST,
    ponto_trabalho: USER_ROLES.HOST,
    place: USER_ROLES.PLACE,
    lugar: USER_ROLES.PLACE,
    estabelecimento: USER_ROLES.PLACE,
    local: USER_ROLES.PLACE,
    admin: USER_ROLES.ADMIN,
    administrador: USER_ROLES.ADMIN
})

/**
 * 
 * @param {string} role 
 * @returns {string}
 */

export function normalizeUserRole(role) {
    if (!role) {
        return USER_ROLES.NOMAD
    }

    const cleanRole = String(role)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

    const mappedRole = ROLE_ALIASES[cleanRole]
    if (!mappedRole) {
        const validRoles = Object.values(USER_ROLES).join(', ')
        throw new Error(`Perfil de usuário inválido ("${role}"). Perfis permitidos: ${validRoles}.`)
    }

    return mappedRole
}

/**
 * @param {Object} reqOrData
 * @returns {Object}
 */
function extractPayload(reqOrData) {
    if (!reqOrData || typeof reqOrData !== 'object') {
        throw new Error('Dados da requisção não foram informados')
    }

    return reqOrData.body && typeof reqOrData.body === 'object'
        ? reqOrData.body
        : reqOrData
}

export class CreateUserRequestDTO {
    /**
     * @param {Object} data
     * @param { string|null } [forcedRole = null]
     */

    constructor(data = {}, forcedRole = null) {
        const rawEmail = data.email !== undefined && data.email !== null ? String(data.email).trim().toLowerCase() : '';
        const rawPassword = data.password !== undefined && data.password !== null ? String(data.password) : '';
        const rawDisplayName = data.displayName !== undefined && data.displayName !== null ? String(data.displayName).trim() : '';
        const rawPhotoURL = data.photoURL !== undefined && data.photoURL !== null ? String(data.photoURL).trim() : '';
        const rawPhoneNumber = data.phoneNumber !== undefined && data.phoneNumber !== null ? String(data.phoneNumber).trim() : '';

        this.email = rawEmail;
        this.password = rawPassword;
        this.displayName = rawDisplayName;
        this.photoURL = rawPhotoURL;
        this.phoneNumber = rawPhoneNumber;
        this.role = normalizeUserRole(forcedRole || data.role);
    }

    /**
     * @returns {CreateUserRequestDTO}
     */

    validate() {
        if (!this.email) {
            throw new Error('O e-mail é obrigatório.')
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(this.email)) {
            throw new Error('Formato de e-mail inválido.')
        }

        if (!this.password) {
            throw new Error('A senha é obrigatória.')
        }

        if (this.password.length < 6) {
            throw new Error('A senha deve possuir no mínimo 6 caracteres.')
        }

        if ((this.role === USER_ROLES.HOST || this.role === USER_ROLES.PLACE) && !this.displayName) {
            const actorLabel = this.role === USER_ROLES.HOST
                ? 'o criador de pontos de trabalho (host)'
                : 'o lugar/estabelecimento (place)'
            throw new Error(`O nome de exibição (displayName) é obrigatório para ${actorLabel}.`)
        }

        if (this.phoneNumber) {
            const cleanPhone = this.phoneNumber.replace(/[^\d+]/g, '')
            if (cleanPhone.length < 8) {
                throw new Error('O número de telefone informado é inválido.')
            }
        }

        return this
    }

    /**
     * @returns {Object}
     */
    toPlainObject() {
        return {
            email: this.email,
            password: this.password,
            displayName: this.displayName,
            photoURL: this.photoURL,
            phoneNumber: this.phoneNumber,
            role: this.role,
            disable: false
        }
    }
}