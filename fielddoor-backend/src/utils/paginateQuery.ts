export const buildPaginationArgs = (page = 1, limit = 10) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(Math.min(limit, 100), 1);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit
  };
};

export const buildPaginationMeta = (total: number, page = 1, limit = 10) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit)
});
