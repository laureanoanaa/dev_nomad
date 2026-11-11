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

    validateEmail(email) {
        if (email || typeof email !== 'string') {
            throw new ('O e-mail precisa estar em forma de texto.')
        }

        const normalizeEmail = email.trim().toLowerCase()
        const emailRejex = /^[^\s@]+@[^\s@]+\.[\s@]+$/;

        if (!emailRejex.test(normalizeEmail)) {
            throw new Error('Formato do e-mail inválido.')
        }

        return normalizeEmail
    }

    /**
     * @param {string} password
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            throw new Error('A senha é obrigatória.');
        }

        if (password.length < 6) {
            throw new Error('A senha deve possuir no mínimo 6 caracteres.');
        }
    }

    /**
    * @param {Object} userData
     * @param {string} role
     */
    validateProfileRequirements(userData, role) {
        const displayName = userData.displayName ? String(userData.displayName).trim() : '';

        if ((role === USER_ROLES.HOST || role === USER_ROLES.PLACE) && !displayName) {
            const actorLabel = role === USER_ROLES.HOST
                ? 'o criador de pontos de trabalho (host)'
                : 'o lugar/estabelecimento (place)';
            throw new Error(`O nome de exibição (displayName) é obrigatório para ${actorLabel}.`);
        }

        if (userData.phoneNumber) {
            const cleanPhone = String(userData.phoneNumber).replace(/[^\d+]/g, '');
            if (cleanPhone.length < 8) {
                throw new Error('O número de telefone informado é inválido.');
            }
        }
    }

    /**
     * @param {Object} user
     */
    ensureActiveUser(user) {
        if (!user) {
            throw new Error('Usuário não encontrado.');
        }
        if (user.disable) {
            throw new Error('Esta conta de usuário está desativada e não pode realizar operações.');
        }
    }

    /**
     * @param {Object|string} userOrRole
     * @returns {Object}
     */
    getPermissions(userOrRole) {
        const role = typeof userOrRole === 'string'
            ? this.normalizeRole(userOrRole)
            : this.normalizeRole(userOrRole?.role);

        return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[USER_ROLES.NOMAD];
    }

    /**
     * @param {Object} user
     * @param {string} permissionKey
     * @returns {boolean}
     */
    hasPermission(user, permissionKey) {
        if (!user || user.disable) {
            return false;
        }
        const permissions = this.getPermissions(user);
        return Boolean(permissions[permissionKey]);
    }
    /**
     * @param {Object} reqOrData
     * @param {Object} [res]
     * @returns {Promise<Object>}
     */
    async register(reqOrData, res = null) {
        try {
            const payload = this._extractBody(reqOrData);
            const email = this.validateEmail(payload.email);
            this.validatePassword(payload.password);

            const role = this.normalizeRole(payload.role);
            this.validateProfileRequirements(payload, role);

            const existingUser = await this.userRepository.getByEmail(email);
            if (existingUser) {
                throw new Error('Já existe um usuário cadastrado com este e-mail.');
            }

            const newUser = await this.userRepository.createAccount({
                ...payload,
                email,
                displayName: payload.displayName ? String(payload.displayName).trim() : '',
                role,
                disable: false
            });

            const result = this._formatUserResponse(newUser);
            return this._sendResponse(res, 201, {
                message: 'Usuário registrado com sucesso.',
                data: result
            });
        } catch (error) {
            return this._handleControllerError('register', error, res, 400);
        }
    }

    /**
     * @param {Object} reqOrData
     * @param {Object} [res]
     */
    async registerNomad(reqOrData, res = null) {
        const payload = this._extractBody(reqOrData);
        return this.register({ ...payload, role: USER_ROLES.NOMAD }, res);
    }

    /**
     * @param {Object} reqOrData
     * @param {Object} [res]
     */
    async registerWorkspaceHost(reqOrData, res = null) {
        const payload = this._extractBody(reqOrData);
        return this.register({ ...payload, role: USER_ROLES.HOST }, res);
    }

    /**
     * @param {Object} reqOrData
     * @param {Object} [res]
     */
    async registerPlace(reqOrData, res = null) {
        const payload = this._extractBody(reqOrData);
        return this.register({ ...payload, role: USER_ROLES.PLACE }, res);
    }

    /**
     * @param {Object} reqOrData
     * @param {Object} [res]
     */
    async login(reqOrData, res = null) {
        try {
            const payload = this._extractBody(reqOrData);
            const email = this.validateEmail(payload.email);
            this.validatePassword(payload.password);

            const user = await this.userRepository.authenticate(email, payload.password);

            if (user.disable) {
                await this.userRepository.signOut();
                throw new Error('Conta desativada. Entre em contato com o suporte.');
            }

            const result = this._formatUserResponse(user);
            return this._sendResponse(res, 200, {
                message: 'Autenticação realizada com sucesso.',
                data: result
            });
        } catch (error) {
            return this._handleControllerError('login', error, res, 401);
        }
    }

    /**
     * @param {Object} [req]
     * @param {Object} [res]
     */
    async logout(req = null, res = null) {
        try {
            await this.userRepository.signOut();
            return this._sendResponse(res, 200, {
                message: 'Sessão encerrada com sucesso.'
            });
        } catch (error) {
            return this._handleControllerError('logout', error, res, 500);
        }
    }

    /**
     * @param {Object} [req]
     * @param {Object} [res]
     */
    async getCurrentUser(req = null, res = null) {
        try {
            const user = await this.userRepository.getCurrentUser();
            if (!user) {
                return this._sendResponse(res, 404, {
                    message: 'Nenhum usuário autenticado no momento.',
                    data: null
                });
            }

            this.ensureActiveUser(user);
            return this._sendResponse(res, 200, {
                data: this._formatUserResponse(user)
            });
        } catch (error) {
            return this._handleControllerError('getCurrentUser', error, res, 400);
        }
    }

    /**
     * @param {Object|string} reqOrUid
     * @param {Object} [res]
     */
    async getById(reqOrUid, res = null) {
        try {
            const uid = typeof reqOrUid === 'string'
                ? reqOrUid
                : reqOrUid?.params?.uid || reqOrUid?.params?.id || reqOrUid?.uid;

            if (!uid) {
                throw new Error('O identificador (UID) do usuário é obrigatório.');
            }

            const user = await this.userRepository.getById(uid);
            if (!user) {
                return this._sendResponse(res, 404, {
                    message: 'Usuário não encontrado.',
                    data: null
                });
            }

            return this._sendResponse(res, 200, {
                data: this._formatUserResponse(user)
            });
        } catch (error) {
            return this._handleControllerError('getById', error, res, 400);
        }
    }

    /**
     * @param {Object} [reqOrFilters]
     * @param {Object} [res]
     */
    async getAll(reqOrFilters = {}, res = null) {
        try {
            const filters = reqOrFilters?.query || reqOrFilters || {};
            const allUsers = await this.userRepository.getAll();

            let filtered = allUsers;

            if (filters.role) {
                const targetRole = this.normalizeRole(filters.role);
                filtered = filtered.filter((u) => this.normalizeRole(u.role) === targetRole);
            }

            if (filters.onlyActive !== false && filters.onlyActive !== 'false') {
                filtered = filtered.filter((u) => !u.disable);
            }

            return this._sendResponse(res, 200, {
                count: filtered.length,
                data: filtered.map((u) => this._formatUserResponse(u))
            });
        } catch (error) {
            return this._handleControllerError('getAll', error, res, 500);
        }
    }

    /**
     * @param {Object} [req]
     * @param {Object} [res]
     */
    async getNomads(req = null, res = null) {
        return this.getAll({ role: USER_ROLES.NOMAD, onlyActive: true }, res);
    }

    /**
     * @param {Object} [req]
     * @param {Object} [res]
     */
    async getWorkspaceHosts(req = null, res = null) {
        return this.getAll({ role: USER_ROLES.HOST, onlyActive: true }, res);
    }

    /**
     * @param {Object} [req]
     * @param {Object} [res]
     */
    async getPlaces(req = null, res = null) {
        return this.getAll({ role: USER_ROLES.PLACE, onlyActive: true }, res);
    }

    /**
     * @param {Object|string} reqOrUid
     * @param {Object} [resOrData]
     */
    async update(reqOrUid, resOrData = null) {
        const isExpress = Boolean(resOrData && typeof resOrData.status === 'function');
        const res = isExpress ? resOrData : null;

        try {
            const uid = typeof reqOrUid === 'string'
                ? reqOrUid
                : reqOrUid?.params?.uid || reqOrUid?.params?.id || reqOrUid?.uid;

            const updatePayload = typeof reqOrUid === 'string'
                ? (resOrData || {})
                : this._extractBody(reqOrUid);

            if (!uid) {
                throw new Error('O identificador (UID) do usuário é obrigatório para atualização.');
            }

            const currentUser = await this.userRepository.getById(uid);
            this.ensureActiveUser(currentUser);

            const sanitizedUpdate = {};

            if (updatePayload.displayName !== undefined) {
                sanitizedUpdate.displayName = String(updatePayload.displayName).trim();
            }

            if (updatePayload.photoURL !== undefined) {
                sanitizedUpdate.photoURL = String(updatePayload.photoURL).trim();
            }

            if (updatePayload.phoneNumber !== undefined) {
                sanitizedUpdate.phoneNumber = String(updatePayload.phoneNumber).trim();
            }

            const targetRole = updatePayload.role
                ? this.normalizeRole(updatePayload.role)
                : this.normalizeRole(currentUser.role);

            if (updatePayload.role !== undefined) {
                sanitizedUpdate.role = targetRole;
            }

            this.validateProfileRequirements(
                {
                    displayName: sanitizedUpdate.displayName ?? currentUser.displayName,
                    phoneNumber: sanitizedUpdate.phoneNumber ?? currentUser.phoneNumber
                },
                targetRole
            );

            const updatedUser = await this.userRepository.update(uid, sanitizedUpdate);
            return this._sendResponse(res, 200, {
                message: 'Usuário atualizado com sucesso.',
                data: this._formatUserResponse(updatedUser)
            });
        } catch (error) {
            return this._handleControllerError('update', error, res, 400);
        }
    }

    /**
     * @param {string} uid
     * @returns {Promise<Object>}
     */
    async authorizeWorkspaceSetup(uid) {
        if (!uid) {
            throw new Error('UID do usuário é obrigatório para validar permissão de ponto de trabalho.');
        }

        const user = await this.userRepository.getById(uid);
        this.ensureActiveUser(user);

        if (!this.hasPermission(user, 'canCreateWorkspaces')) {
            throw new Error(
                `Acesso negado: o perfil "${user.role}" não tem permissão para montar pontos de trabalho. ` +
                `Apenas perfis "${USER_ROLES.HOST}", "${USER_ROLES.PLACE}" ou "${USER_ROLES.ADMIN}" podem realizar esta ação.`
            );
        }

        return this._formatUserResponse(user);
    }

    /**
     * @param {Object|string} reqOrUid
     * @param {Object} [res]
     */
    async disable(reqOrUid, res = null) {
        try {
            const uid = typeof reqOrUid === 'string'
                ? reqOrUid
                : reqOrUid?.params?.uid || reqOrUid?.params?.id || reqOrUid?.uid;

            if (!uid) {
                throw new Error('O identificador (UID) do usuário é obrigatório para desativação.');
            }

            const existingUser = await this.userRepository.getById(uid);
            if (!existingUser) {
                throw new Error('Usuário não encontrado.');
            }

            const disabledUser = await this.userRepository.disable(uid);
            return this._sendResponse(res, 200, {
                message: 'Usuário desativado com sucesso.',
                data: this._formatUserResponse(disabledUser)
            });
        } catch (error) {
            return this._handleControllerError('disable', error, res, 400);
        }
    }

    /**
     * @param {Object|string} reqOrUid
     * @param {Object} [res]
     */
    async delete(reqOrUid, res = null) {
        try {
            const uid = typeof reqOrUid === 'string'
                ? reqOrUid
                : reqOrUid?.params?.uid || reqOrUid?.params?.id || reqOrUid?.uid;

            if (!uid) {
                throw new Error('O identificador (UID) do usuário é obrigatório para exclusão.');
            }

            const existingUser = await this.userRepository.getById(uid);
            if (!existingUser) {
                throw new Error('Usuário não encontrado.');
            }

            await this.userRepository.delete(uid);
            return this._sendResponse(res, 200, {
                message: 'Usuário removido com sucesso.',
                deleted: true
            });
        } catch (error) {
            return this._handleControllerError('delete', error, res, 400);
        }
    }

    /**
     * @param {Object} reqOrData
     * @returns {Object}
     * @private
     */
    _extractBody(reqOrData) {
        if (!reqOrData || typeof reqOrData !== 'object') {
            throw new Error('Dados da requisição não informados.');
        }
        return reqOrData.body && typeof reqOrData.body === 'object'
            ? reqOrData.body
            : reqOrData;
    }

    /**
     * @param {Object} user
     * @returns {Object}
     * @private
     */
    _formatUserResponse(user) {
        if (!user) return null;

        const role = this.normalizeRole(user.role);
        const { password, ...safeUser } = user;

        return {
            ...safeUser,
            role,
            permissions: this.getPermissions(role)
        };
    }

    /**
     * @param {Object|null} res
     * @param {number} statusCode
     * @param {Object} payload
     * @returns {Object}
     * @private
     */
    _sendResponse(res, statusCode, payload) {
        const responseBody = {
            success: statusCode >= 200 && statusCode < 300,
            ...payload
        };

        if (res && typeof res.status === 'function') {
            return res.status(statusCode).json(responseBody);
        }

        return responseBody;
    }

    /**
     * @param {string} action
     * @param {Error} error
     * @param {Object|null} res
     * @param {number} defaultStatus
     * @private
     */
    _handleControllerError(action, error, res = null, defaultStatus = 400) {
        console.error(`[UserController - ${action}] Message: ${error.message}`);

        if (res && typeof res.status === 'function') {
            return res.status(defaultStatus).json({
                success: false,
                error: error.message
            });
        }

        throw error;
    }
}

export default new UserController();
