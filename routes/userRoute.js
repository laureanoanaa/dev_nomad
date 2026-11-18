import userController, { USER_ROLES, UserController } from '../controllers/userController'
import {
    CreateUserRequestDTO,
    LoginRequestDTO,
    UpdateUserRequestDTO,
    UserParamDTO,
    UserFilterQueryDTO,
    UserResponseDTO,
    HttpResponseDTO
} from '../dtos/userDto'

export const USER_ROUTE_PATH = Object.freeze({
    AUTH_REGISTER: '/auth/register',
    AUTH_REGISTER_NOMAD: '/auth/register/nomad',
    AUTH_REGISTER_HOST: '/auth/register/host',
    AUTH_REGISTER_PLACE: '/auth/place',
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',

    USER_BASE: '/users',
    USER_REGISTER_NOMAD: '/users/register/nomad',
    USER_REGISTER_HOST: '/users/register/host',
    USER_REGISTER_PLACE: '/users/register/place',
    USER_LOGIN: '/users/login',
    USER_LOGOUT: '/users/logout',
    USER_ME: '/users/me',
    USER_NOMAD: '/users/nomad',
    USER_HOST: '/users/host',
    USER_PLACES: '/users/places',
    USER_BY_ID: '/users/:uid',
    USER_DISABLE: '/users/:uid/disable',
    USER_PERMISSIONS: '/users/:id/permissions',
    USER_AUTHORIZE_WORKPLACE: '/users/:uid/authorize-workspace',
})

export class UserRoute {
    /**
     * @param {Object} controller
     */

    constructor(controller = userController) {
        this.userController = controller
        this.routes = []
        this._inititializeRoutes()
    }

    /**
     * @private 
     */

    _inititializeRoutes() {
        this.addRoute('POST', USER_ROUTE_PATH.AUTH_REGISTER, (req, res) =>
            this.handlerRegister(req, res)
        )

        this.addRoute('GET', USER_ROUTE_PATH.AUTH_ME, (req, res) =>
            this.userController.getCurrentUser(req, res)
        )

        this.addRoute('PATCH', USER_ROUTE_PATH.USER_DISABLE, (req, res) =>
            this.handlerDisable(req, res)
        )
    }

    /**
     * @param {Object} req
     * @param {Object} res
     * @param {string | null} [forcedRole=null]
     */

    async handlerRegister(req, res = null, forcedRole = null) {
        try {
            const registroDto = CreateUserRequestDTO.fromRequest(req, forcedRole)
            return await this.userController.register(registroDto.toPlainObject(), res)
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error))
        }
    }

    /**
     * @param {Object | string} req
     * @param {Object} [res] 
     */

    async handlerDisable(req, res = null) {
        try {
            const paramDto = UserParamDTO.fromRequest(req, "UID Obrigatório")
        } catch (error) {
            return this._sendRouteResponse(res, 400, HttpResponseDTO.fail(error))
        }
    }
}