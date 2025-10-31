import express from "express";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger/config';
import { registerAllApi } from './api/index';

/**
 * Website API Server
 * Обрабатывает авторизацию, профили пользователей и статические страницы
 */
(async () => {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

    // API Routes
    registerAllApi(app);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🔐 Website API запущен на http://localhost:${PORT}`);
    });
})();

