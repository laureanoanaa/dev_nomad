import express from 'express';
import userRoute, { USER_ROUTE_PATHS } from './routes/userRoute.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middlewares de parse e CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-uid');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Rota raiz (Status da API e catálogo de endpoints)
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        name: 'dev_nomad',
        description: 'Backend Javascript SOLID Clean Architecture Engine Infrastructure',
        version: '0.0.1',
        status: 'online',
        endpoints: {
            health: '/health',
            routes: USER_ROUTE_PATHS,
            registeredRoutes: userRoute.getRegisteredRoutes()
        }
    });
});

// Rota de Health Check (utilizada pelo Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Registra as rotas de UserRoute na raiz (/auth/* e /users/*) e sob /api (/api/auth/* e /api/users/*)
userRoute.registerRoutes(app);
userRoute.registerRoutes(app, '/api');

// Tratamento de rota não encontrada (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Rota não encontrada: ${req.method} ${req.originalUrl}`
    });
});

// Tratamento global de erros
app.use((err, req, res, _next) => {
    console.error('[Server Error]', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Erro interno no servidor.'
    });
});

const server = app.listen(PORT, HOST, () => {
    console.log(`[Dev Nomad] Servidor rodando em http://${HOST}:${PORT}`);
});

export { app, server };
export default app;