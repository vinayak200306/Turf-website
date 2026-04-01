"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema, source = "body") => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        return res.status(422).json({
            success: false,
            message: "Validation failed",
            errors: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
    }
    req[source] = result.data;
    return next();
};
exports.validate = validate;
