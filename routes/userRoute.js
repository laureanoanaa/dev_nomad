import userController, { USER_ROLES } from '../controllers/userController.js';
import {
    CreateUserRequestDTO,
    LoginRequestDTO,
    UpdateUserRequestDTO,
    UserParamDTO,
    UserFilterQueryDTO,
    UserResponseDTO,
    HttpResponseDTO
} from '../dtos/userDto.js';

export const USER_ROUTE_PATHS = Object.freeze({
    AUTH_REGISTER: '/auth/register',
    AUTH_REGISTER_NOMAD: '/auth/register/nomad',
    AUTH_REGISTER_HOST: '/auth/register/host',
    AUTH_REGISTER_PLACE: '/auth/register/place',
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',

    USERS_BASE: '/users',
    USERS_REGISTER: '/users/register',
    USERS_REGISTER_NOMAD: '/users/register/nomad',
    USERS_REGISTER_HOST: '/users/register/host',
    USERS_REGISTER_PLACE: '/users/register/place',
    USERS_LOGIN: '/users/login',
    USERS_LOGOUT: '/users/logout',
    USERS_ME: '/users/me',
    USERS_NOMADS: '/users/nomads',
    USERS_HOSTS: '/users/hosts',
    USERS_PLACES: '/users/places',
    USER_BY_ID: '/users/:uid',
    USER_DISABLE: '/users/:uid/disable',
    USER_PERMISSIONS: '/users/:uid/permissions',
    USER_AUTHORIZE_WORKSPACE: '/users/:uid/authorize-workspace'
});

export class UserRoute {
    /**
     * @param {Object} controller
     */
    constructor(controller = userController) {
        this.userController = controller;
        this.routes = [];
        this._initializeRoutes();
    }

    /**

     * @private
     */
    _initializeRoutes() {
        this.addRoute('POST', USER_ROUTE_PATHS.AUTH_REGISTER, (req, res) =>
            this.handleRegister(req, res)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.AUTH_REGISTER_NOMAD, (req, res) =>
            this.handleRegister(req, res, USER_ROLES.NOMAD)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.AUTH_REGISTER_HOST, (req, res) =>
            this.handleRegister(req, res, USER_ROLES.HOST)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.AUTH_REGISTER_PLACE, (req, res) =>
            this.handleRegister(req, res, USER_ROLES.PLACE)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.AUTH_LOGIN, (req, res) =>
            this.handleLogin(req, res)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.AUTH_LOGOUT, (req, res) =>
            this.userController.logout(req, res)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.AUTH_ME, (req, res) =>
            this.userController.getCurrentUser(req, res)
        );

        this.addRoute('POST', USER_ROUTE_PATHS.USERS_BASE, (req, res) =>
            this.handleRegister(req, res)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USERS_REGISTER, (req, res) =>
            this.handleRegister(req, res)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USERS_REGISTER_NOMAD, (req, res) =>
            this.handleRegister(req, res, USER_ROLES.NOMAD)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USERS_REGISTER_HOST, (req, res) =>
            this.handleRegister(req, res, USER_ROLES.HOST)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USERS_REGISTER_PLACE, (req, res) =>
            this.handleRegister(req, res, USER_ROLES.PLACE)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USERS_LOGIN, (req, res) =>
            this.handleLogin(req, res)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USERS_LOGOUT, (req, res) =>
            this.userController.logout(req, res)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USERS_ME, (req, res) =>
            this.userController.getCurrentUser(req, res)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USERS_NOMADS, (req, res) =>
            this.handleGetAll(req, res, USER_ROLES.NOMAD)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USERS_HOSTS, (req, res) =>
            this.handleGetAll(req, res, USER_ROLES.HOST)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USERS_PLACES, (req, res) =>
            this.handleGetAll(req, res, USER_ROLES.PLACE)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USERS_BASE, (req, res) =>
            this.handleGetAll(req, res)
        );

        this.addRoute('GET', USER_ROUTE_PATHS.USER_PERMISSIONS, (req, res) =>
            this.handleGetPermissions(req, res)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USER_AUTHORIZE_WORKSPACE, (req, res) =>
            this.handleAuthorizeWorkspace(req, res)
        );
        this.addRoute('POST', USER_ROUTE_PATHS.USER_AUTHORIZE_WORKSPACE, (req, res) =>
            this.handleAuthorizeWorkspace(req, res)
        );
        this.addRoute('PATCH', USER_ROUTE_PATHS.USER_DISABLE, (req, res) =>
            this.handleDisable(req, res)
        );
        this.addRoute('PUT', USER_ROUTE_PATHS.USER_DISABLE, (req, res) =>
            this.handleDisable(req, res)
        );
        this.addRoute('GET', USER_ROUTE_PATHS.USER_BY_ID, (req, res) =>
            this.handleGetById(req, res)
        );
        this.addRoute('PUT', USER_ROUTE_PATHS.USER_BY_ID, (req, res) =>
            this.handleUpdate(req, res)
        );
        this.addRoute('PATCH', USER_ROUTE_PATHS.USER_BY_ID, (req, res) =>
            this.handleUpdate(req, res)
        );
        this.addRoute('DELETE', USER_ROUTE_PATHS.USER_BY_ID, (req, res) =>
            this.handleDelete(req, res)
        );
    }

    /**
     * @param {string} method
     * @param {string} path
     * @param {Function} handler
     * @param {Function[]} [middlewares]
     * @returns {UserRoute}
     */
    addRoute(method, path, handler, middlewares = []) {
        const normalizedMethod = String(method).trim().toUpperCase();
        const normalizedPath = this._normalizePath(path);
        const { regex, paramNames } = this._compilePathPattern(normalizedPath);

        this.routes.push({
            method: normalizedMethod,
            path: normalizedPath,
            regex,
            paramNames,
            middlewares,
            handler
        });

        return this;
    }

    /**
     * @param {Object} expressRouterOrApp
     * @param {string} [basePath='']
     * @returns {Object}
     */
    registerRoutes(expressRouterOrApp, basePath = '') {
        if (!expressRouterOrApp) {
            throw new Error('Uma instância de Router ou App (ex: Express) é obrigatória para registrar as rotas.');
        }

        const prefix = basePath ? this._normalizePath(basePath) : '';

        for (const route of this.routes) {
            const methodKey = route.method.toLowerCase();
            const fullPath = prefix === '/' || !prefix
                ? route.path
                : `${prefix}${route.path === '/' ? '' : route.path}`;

            if (typeof expressRouterOrApp[methodKey] === 'function') {
                expressRouterOrApp[methodKey](fullPath, ...route.middlewares, route.handler);
            }
        }

        return expressRouterOrApp;
    }

    /**
     * @param {Object} req
     * @param {Object} [res]
     * @param {string|null} [forcedRole=null]
     */
    async handleRegister(req, res = null, forcedRole = null) {
        try {
            const registerDto = CreateUserRequestDTO.fromRequest(req, forcedRole);
            return await this.userController.register(registerDto.toPlainObject(), res);
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object} req
     * @param {Object} [res]
     */
    async handleLogin(req, res = null) {
        try {
            const loginDto = LoginRequestDTO.fromRequest(req);
            return await this.userController.login(loginDto.toPlainObject(), res);
        } catch (error) {
            return this._sendRouteResponse(res, 401, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object} [req]
     * @param {Object} [res]
     * @param {string|null} [forcedRole=null]
     */
    async handleGetAll(req = {}, res = null, forcedRole = null) {
        try {
            const filterDto = UserFilterQueryDTO.fromRequest(req, forcedRole);
            return await this.userController.getAll({ query: filterDto.toQueryObject() }, res);
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object|string} req
     * @param {Object} [res]
     */
    async handleGetById(req, res = null) {
        try {
            const paramDto = UserParamDTO.fromRequest(req);
            return await this.userController.getById(paramDto.uid, res);
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object|string} req
     * @param {Object} [res]
     */
    async handleUpdate(req, res = null) {
        try {
            const updateDto = UpdateUserRequestDTO.fromRequest(req);
            return await this.userController.update(
                {
                    params: { uid: updateDto.uid },
                    body: updateDto.toUpdatePayload()
                },
                res
            );
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object|string} req
     * @param {Object} [res]
     */
    async handleDisable(req, res = null) {
        try {
            const paramDto = UserParamDTO.fromRequest(
                req,
                'O identificador (UID) do usuário é obrigatório para desativação.'
            );
            return await this.userController.disable(paramDto.uid, res);
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object|string} req
     * @param {Object} [res]
     */
    async handleDelete(req, res = null) {
        try {
            const paramDto = UserParamDTO.fromRequest(
                req,
                'O identificador (UID) do usuário é obrigatório para exclusão.'
            );
            return await this.userController.delete(paramDto.uid, res);
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object} req
     * @param {Object} [res]
     */
    async handleGetPermissions(req, res = null) {
        try {
            const { uid } = UserParamDTO.fromRequest(req);
            const userResponse = await this.userController.getById(uid);
            const user = userResponse?.data ? UserResponseDTO.fromEntity(userResponse.data) : null;

            if (!user) {
                return this._sendRouteResponse(
                    res,
                    404,
                    new HttpResponseDTO({
                        success: false,
                        message: 'Usuário não encontrado.',
                        data: null
                    })
                );
            }

            return this._sendRouteResponse(
                res,
                200,
                HttpResponseDTO.success({
                    uid: user.uid,
                    role: user.role,
                    permissions: user.permissions
                })
            );
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error));
        }
    }

    /**
     * @param {Object} req
     * @param {Object} [res]
     */
    async handleAuthorizeWorkspace(req, res = null) {
        try {
            const { uid } = UserParamDTO.fromRequest(
                req,
                'UID do usuário é obrigatório para validar permissão de ponto de trabalho.'
            );

            const authorizedUser = await this.userController.authorizeWorkspaceSetup(uid);
            const userDto = UserResponseDTO.fromEntity(authorizedUser);

            return this._sendRouteResponse(
                res,
                200,
                HttpResponseDTO.success(
                    userDto,
                    'Usuário autorizado a criar e gerenciar pontos de trabalho.'
                )
            );
        } catch (error) {
            const isForbidden = error.message && error.message.includes('Acesso negado');
            return this._sendRouteResponse(
                res,
                isForbidden ? 403 : 400,
                HttpResponseDTO.fail(error)
            );
        }
    }

    /**
     * @param {string} permissionKey
     * @returns {Function}
     */
    requirePermission(permissionKey) {
        return async (req, res, next) => {
            try {
                const rawUid = req?.user?.uid || req?.headers?.['x-user-uid'] || req?.params?.uid || req?.body?.uid;
                if (!rawUid) {
                    return this._sendRouteResponse(
                        res,
                        401,
                        HttpResponseDTO.fail('Usuário não autenticado ou UID não informado.')
                    );
                }

                const { uid } = UserParamDTO.fromRequest(rawUid);
                const userResponse = await this.userController.getById(uid);
                const user = userResponse?.data ? UserResponseDTO.fromEntity(userResponse.data) : null;

                if (!user) {
                    return this._sendRouteResponse(
                        res,
                        404,
                        HttpResponseDTO.fail('Usuário não encontrado.')
                    );
                }

                if (!this.userController.hasPermission(user, permissionKey)) {
                    return this._sendRouteResponse(
                        res,
                        403,
                        HttpResponseDTO.fail(`Acesso negado: permissão "${permissionKey}" necessária.`)
                    );
                }

                req.currentUser = user;
                if (typeof next === 'function') {
                    return next();
                }
                return user;
            } catch (error) {
                return this._sendRouteResponse(res, 403, HttpResponseDTO.fail(error));
            }
        };
    }

    /**
     * @returns {Function}
     */
    requireWorkspacePermission() {
        return async (req, res, next) => {
            try {
                const rawUid = req?.user?.uid || req?.headers?.['x-user-uid'] || req?.params?.uid || req?.body?.uid;
                const { uid } = UserParamDTO.fromRequest(
                    rawUid,
                    'UID do usuário é obrigatório para validar permissão de ponto de trabalho.'
                );
                const authorizedUser = await this.userController.authorizeWorkspaceSetup(uid);
                req.currentUser = UserResponseDTO.fromEntity(authorizedUser);

                if (typeof next === 'function') {
                    return next();
                }
                return req.currentUser;
            } catch (error) {
                const isForbidden = error.message && error.message.includes('Acesso negado');
                return this._sendRouteResponse(
                    res,
                    isForbidden ? 403 : 401,
                    HttpResponseDTO.fail(error)
                );
            }
        };
    }

    /**
     * @param {string} method
     * @param {string} rawPath
     * @param {Object} [reqOrData={}]
     * @param {Object|null} [res=null]
     * @returns {Promise<Object>}
     */
    async dispatch(method, rawPath, reqOrData = {}, res = null) {
        const normalizedMethod = String(method || 'GET').trim().toUpperCase();
        const { pathname, query } = this._parseUrl(rawPath);

        for (const route of this.routes) {
            if (route.method !== normalizedMethod) {
                continue;
            }

            const match = route.regex.exec(pathname);
            if (!match) {
                continue;
            }

            const params = {};
            route.paramNames.forEach((name, index) => {
                params[name] = decodeURIComponent(match[index + 1]);
            });

            const req = this._buildRequestObject(reqOrData, params, query);

            for (const middleware of route.middlewares) {
                let nextCalled = false;
                const middlewareResult = await middleware(req, res, () => {
                    nextCalled = true;
                });
                if (!nextCalled && middlewareResult !== undefined) {
                    return middlewareResult;
                }
            }

            return await route.handler(req, res);
        }

        return this._sendRouteResponse(
            res,
            404,
            HttpResponseDTO.fail(`Rota não encontrada: [${normalizedMethod}] ${pathname}`)
        );
    }

    /**
     * @returns {Array<{method: string, path: string}>}
     */
    getRegisteredRoutes() {
        return this.routes.map(({ method, path }) => ({ method, path }));
    }

    /**
     * @param {string} path
     * @returns {string}
     * @private
     */
    _normalizePath(path) {
        if (!path || typeof path !== 'string') {
            return '/';
        }
        const trimmed = path.trim();
        const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
        if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
            return withLeadingSlash.slice(0, -1);
        }
        return withLeadingSlash;
    }

    /**
     * @param {string} rawUrl
     * @returns {{pathname: string, query: Object}}
     * @private
     */
    _parseUrl(rawUrl) {
        const [pathPart, queryPart] = String(rawUrl || '/').split('?');
        const pathname = this._normalizePath(pathPart);
        const query = {};

        if (queryPart) {
            const searchParams = new URLSearchParams(queryPart);
            for (const [key, value] of searchParams.entries()) {
                query[key] = value;
            }
        }

        return { pathname, query };
    }

    /**
     * @param {string} normalizedPath
     * @returns {{regex: RegExp, paramNames: string[]}}
     * @private
     */
    _compilePathPattern(normalizedPath) {
        const paramNames = [];
        const regexPattern = normalizedPath
            .split('/')
            .map((segment) => {
                if (segment.startsWith(':')) {
                    paramNames.push(segment.slice(1));
                    return '([^/]+)';
                }
                return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            })
            .join('/');

        return {
            regex: new RegExp(`^${regexPattern}$`),
            paramNames
        };
    }

    /**
     * @param {Object} reqOrData
     * @param {Object} params
     * @param {Object} query
     * @returns {Object}
     * @private
     */
    _buildRequestObject(reqOrData, params, query) {
        if (reqOrData && (reqOrData.body || reqOrData.params || reqOrData.query || reqOrData.headers)) {
            return {
                ...reqOrData,
                params: { ...(reqOrData.params || {}), ...params },
                query: { ...(reqOrData.query || {}), ...query },
                body: reqOrData.body || {}
            };
        }

        return {
            params,
            query,
            body: reqOrData && typeof reqOrData === 'object' ? reqOrData : {},
            headers: {}
        };
    }

    /**
     * @param {Object|null} res
     * @param {number} statusCode
     * @param {Object} payload
     * @returns {Object}
     * @private
     */
    _sendRouteResponse(res, statusCode, payload) {
        const body = payload instanceof HttpResponseDTO ? { ...payload } : payload;

        if (res && typeof res.status === 'function') {
            return res.status(statusCode).json(body);
        }
        if (res && typeof res.writeHead === 'function' && typeof res.end === 'function') {
            res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(body));
            return body;
        }

        return body;
    }
}

export const userRoute = new UserRoute();
export default userRoute;