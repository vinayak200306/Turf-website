"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = void 0;
const path_1 = __importDefault(require("path"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const spec = (0, swagger_jsdoc_1.default)({
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Field Door API",
            version: "1.0.0",
            description: "Production backend for Field Door turf booking platform"
        },
        servers: [{ url: "http://localhost:3000" }]
    },
    apis: [path_1.default.resolve(process.cwd(), "src/modules/**/*.ts")]
});
const setupSwagger = (app) => {
    app.use("/api/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(spec));
};
exports.setupSwagger = setupSwagger;
