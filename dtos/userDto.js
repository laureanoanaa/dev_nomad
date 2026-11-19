import { USER_ROLES, ROLE_PERMISSIONS } from '../controllers/userController.js';

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
});

/**
 * @param {string} [role]
 * @returns {string}
 */
export function normalizeUserRole(role) {
    if (!role) {
        return USER_ROLES.NOMAD;
    }

    const cleanRole = String(role)
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const mappedRole = ROLE_ALIASES[cleanRole];
    if (!mappedRole) {
        const validRoles = Object.values(USER_ROLES).join(', ');
        throw new Error(`Perfil de usuário inválido ("${role}"). Perfis permitidos: ${validRoles}.`);
    }

    return mappedRole;
}

/**
 * @param {Object} reqOrData
 * @returns {Object}
 */
export function extractPayload(reqOrData) {
    if (!reqOrData || typeof reqOrData !== 'object') {
        throw new Error('Dados da requisição não foram informados.');
    }

    return reqOrData.body && typeof reqOrData.body === 'object'
        ? reqOrData.body
        : reqOrData;
}

export class CreateUserRequestDTO {
    /**
     * @param {Object} data
     * @param {string|null} [forcedRole=null]
     */
    constructor(data = {}, forcedRole = null) {
        const payload = extractPayload(data);
        const rawEmail = payload.email !== undefined && payload.email !== null ? String(payload.email).trim().toLowerCase() : '';
        const rawPassword = payload.password !== undefined && payload.password !== null ? String(payload.password) : '';
        const rawDisplayName = payload.displayName !== undefined && payload.displayName !== null ? String(payload.displayName).trim() : '';
        const rawPhotoURL = payload.photoURL !== undefined && payload.photoURL !== null ? String(payload.photoURL).trim() : '';
        const rawPhoneNumber = payload.phoneNumber !== undefined && payload.phoneNumber !== null ? String(payload.phoneNumber).trim() : '';

        this.email = rawEmail;
        this.password = rawPassword;
        this.displayName = rawDisplayName;
        this.photoURL = rawPhotoURL;
        this.phoneNumber = rawPhoneNumber;
        this.role = normalizeUserRole(forcedRole || payload.role);
    }

    /**
     * @param {Object} reqOrData
     * @param {string|null} [forcedRole=null]
     * @returns {CreateUserRequestDTO}
     */
    static fromRequest(reqOrData, forcedRole = null) {
        return new CreateUserRequestDTO(reqOrData, forcedRole).validate();
    }

    /**
     * @returns {CreateUserRequestDTO}
     */
    validate() {
        if (!this.email) {
            throw new Error('O e-mail é obrigatório.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) {
            throw new Error('Formato de e-mail inválido.');
        }

        if (!this.password) {
            throw new Error('A senha é obrigatória.');
        }

        if (this.password.length < 6) {
            throw new Error('A senha deve possuir no mínimo 6 caracteres.');
        }

        if ((this.role === USER_ROLES.HOST || this.role === USER_ROLES.PLACE) && !this.displayName) {
            const actorLabel = this.role === USER_ROLES.HOST
                ? 'o criador de pontos de trabalho (host)'
                : 'o lugar/estabelecimento (place)';
            throw new Error(`O nome de exibição (displayName) é obrigatório para ${actorLabel}.`);
        }

        if (this.phoneNumber) {
            const cleanPhone = this.phoneNumber.replace(/[^\d+]/g, '');
            if (cleanPhone.length < 8) {
                throw new Error('O número de telefone informado é inválido.');
            }
        }

        return this;
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
        };
    }
}

export class LoginRequestDTO {
    /**
     * @param {Object} data
     */
    constructor(data = {}) {
        const payload = extractPayload(data);
        this.email = payload.email !== undefined && payload.email !== null ? String(payload.email).trim().toLowerCase() : '';
        this.password = payload.password !== undefined && payload.password !== null ? String(payload.password) : '';
    }

    /**
     * @param {Object} reqOrData
     * @returns {LoginRequestDTO}
     */
    static fromRequest(reqOrData) {
        return new LoginRequestDTO(reqOrData).validate();
    }

    /**
     * @returns {LoginRequestDTO}
     */
    validate() {
        if (!this.email) {
            throw new Error('O e-mail é obrigatório.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.email)) {
            throw new Error('Formato de e-mail inválido.');
        }

        if (!this.password) {
            throw new Error('A senha é obrigatória.');
        }

        if (this.password.length < 6) {
            throw new Error('A senha deve possuir no mínimo 6 caracteres.');
        }

        return this;
    }

    /**
     * @returns {Object}
     */
    toPlainObject() {
        return {
            email: this.email,
            password: this.password
        };
    }
}

export class UserParamDTO {
    /**
     * @param {Object|string} reqOrUid
     * @param {string} [errorMessage='O identificador (UID) do usuário é obrigatório.']
     */
    constructor(reqOrUid, errorMessage = 'O identificador (UID) do usuário é obrigatório.') {
        const rawUid = typeof reqOrUid === 'string'
            ? reqOrUid
            : (reqOrUid?.params?.uid || reqOrUid?.params?.id || reqOrUid?.uid || reqOrUid?.id || reqOrUid?.body?.uid || reqOrUid?.query?.uid || '');

        this.uid = String(rawUid || '').trim();
        this.errorMessage = errorMessage;
    }

    /**
     * @param {Object|string} reqOrUid
     * @param {string} [errorMessage]
     * @returns {UserParamDTO}
     */
    static fromRequest(reqOrUid, errorMessage) {
        return new UserParamDTO(reqOrUid, errorMessage).validate();
    }

    /**
     * @returns {UserParamDTO}
     */
    validate() {
        if (!this.uid) {
            throw new Error(this.errorMessage);
        }
        return this;
    }
}

export class UserFilterQueryDTO {
    /**
     * @param {Object} [reqOrQuery={}]
     * @param {string|null} [forcedRole=null]
     */
    constructor(reqOrQuery = {}, forcedRole = null) {
        const query = reqOrQuery && typeof reqOrQuery === 'object' && reqOrQuery.query && typeof reqOrQuery.query === 'object'
            ? reqOrQuery.query
            : (reqOrQuery && typeof reqOrQuery === 'object' ? reqOrQuery : {});

        const rawRole = forcedRole || (query.role !== undefined && query.role !== null && String(query.role).trim() !== '' ? query.role : null);
        this.role = rawRole ? normalizeUserRole(rawRole) : null;
        this.onlyActive = !(query.onlyActive === false || query.onlyActive === 'false' || query.onlyActive === '0');
    }

    /**
     * @param {Object} [reqOrQuery={}]
     * @param {string|null} [forcedRole=null]
     * @returns {UserFilterQueryDTO}
     */
    static fromRequest(reqOrQuery = {}, forcedRole = null) {
        return new UserFilterQueryDTO(reqOrQuery, forcedRole).validate();
    }

    /**
     * @returns {UserFilterQueryDTO}
     */
    validate() {
        if (this.role) {
            this.role = normalizeUserRole(this.role);
        }
        return this;
    }

    /**
     * @returns {Object}
     */
    toQueryObject() {
        return {
            ...(this.role ? { role: this.role } : {}),
            onlyActive: this.onlyActive
        };
    }
}

export class UpdateUserRequestDTO {
    /**
     * @param {Object} reqOrData
     * @param {string|null} [explicitUid=null]
     */
    constructor(reqOrData = {}, explicitUid = null) {
        const payload = extractPayload(reqOrData);
        const rawUid = explicitUid
            || reqOrData?.params?.uid
            || reqOrData?.params?.id
            || reqOrData?.uid
            || reqOrData?.id
            || payload?.uid
            || '';

        this.uid = String(rawUid || '').trim();
        this.displayName = payload.displayName !== undefined ? String(payload.displayName).trim() : undefined;
        this.photoURL = payload.photoURL !== undefined ? String(payload.photoURL).trim() : undefined;
        this.phoneNumber = payload.phoneNumber !== undefined ? String(payload.phoneNumber).trim() : undefined;
        this.role = payload.role !== undefined ? normalizeUserRole(payload.role) : undefined;
    }

    /**
     * @param {Object} reqOrData
     * @param {string|null} [explicitUid=null]
     * @returns {UpdateUserRequestDTO}
     */
    static fromRequest(reqOrData, explicitUid = null) {
        return new UpdateUserRequestDTO(reqOrData, explicitUid).validate();
    }

    /**
     * @returns {UpdateUserRequestDTO}
     */
    validate() {
        if (!this.uid) {
            throw new Error('O identificador (UID) do usuário é obrigatório para atualização.');
        }

        if (this.phoneNumber) {
            const cleanPhone = this.phoneNumber.replace(/[^\d+]/g, '');
            if (cleanPhone.length < 8) {
                throw new Error('O número de telefone informado é inválido.');
            }
        }

        if (this.role !== undefined) {
            this.role = normalizeUserRole(this.role);
        }

        return this;
    }

    /**
     * @returns {Object}
     */
    toUpdatePayload() {
        const update = {};
        if (this.displayName !== undefined) update.displayName = this.displayName;
        if (this.photoURL !== undefined) update.photoURL = this.photoURL;
        if (this.phoneNumber !== undefined) update.phoneNumber = this.phoneNumber;
        if (this.role !== undefined) update.role = this.role;
        return update;
    }

    /**
     * @returns {Object}
     */
    toPlainObject() {
        return this.toUpdatePayload();
    }
}

export class UserResponseDTO {
    /**
     * @param {Object} user
     */
    constructor(user = {}) {
        const role = normalizeUserRole(user.role);
        this.uid = user.uid || null;
        this.email = user.email || '';
        this.displayName = user.displayName || '';
        this.photoURL = user.photoURL || '';
        this.phoneNumber = user.phoneNumber || '';
        this.emailVerified = Boolean(user.emailVerified ?? user.verifiedEmail ?? false);
        this.role = role;
        this.disable = Boolean(user.disable ?? user.disabled ?? false);
        this.permissions = user.permissions || ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[USER_ROLES.NOMAD];
        this.createdAt = user.createdAt || null;
        this.updatedAt = user.updatedAt || null;
    }

    /**
     * @param {Object|null} entity
     * @returns {UserResponseDTO|null}
     */
    static fromEntity(entity) {
        if (!entity || typeof entity !== 'object') {
            return null;
        }
        return new UserResponseDTO(entity);
    }

    /**
     * @returns {Object}
     */
    toJSON() {
        return {
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            phoneNumber: this.phoneNumber,
            emailVerified: this.emailVerified,
            role: this.role,
            disable: this.disable,
            permissions: this.permissions,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

export class HttpResponseDTO {
    /**
     * @param {Object} [options={}]
     * @param {boolean} [options.success=true]
     * @param {string} [options.message]
     * @param {*} [options.data]
     * @param {string} [options.error]
     */
    constructor({ success = true, message = undefined, data = undefined, error = undefined } = {}) {
        this.success = Boolean(success);
        if (message !== undefined) {
            this.message = message;
        }
        if (data !== undefined) {
            this.data = data;
        }
        if (error !== undefined) {
            this.error = error;
        }
    }

    /**
     * @param {*} [data=null]
     * @param {string} [message]
     * @returns {HttpResponseDTO}
     */
    static success(data = null, message = undefined) {
        return new HttpResponseDTO({
            success: true,
            ...(message !== undefined ? { message } : {}),
            data
        });
    }

    /**
     * @param {Error|string} errorOrMessage
     * @param {*} [data]
     * @returns {HttpResponseDTO}
     */
    static fail(errorOrMessage, data = undefined) {
        const message = errorOrMessage instanceof Error
            ? errorOrMessage.message
            : String(errorOrMessage || 'Erro ao processar a requisição.');

        return new HttpResponseDTO({
            success: false,
            error: message,
            message,
            ...(data !== undefined ? { data } : {})
        });
    }

    /**
     * @returns {Object}
     */
    toJSON() {
        return { ...this };
    }
}