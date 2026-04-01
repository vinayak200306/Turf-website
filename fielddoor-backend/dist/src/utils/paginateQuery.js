"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationMeta = exports.buildPaginationArgs = void 0;
const buildPaginationArgs = (page = 1, limit = 10) => {
    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(Math.min(limit, 100), 1);
    return {
        skip: (safePage - 1) * safeLimit,
        take: safeLimit
    };
};
exports.buildPaginationArgs = buildPaginationArgs;
const buildPaginationMeta = (total, page = 1, limit = 10) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
});
exports.buildPaginationMeta = buildPaginationMeta;
