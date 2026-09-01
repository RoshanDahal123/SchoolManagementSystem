export const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.max(1, Math.ceil(total / limit || 1));

  return {
    page,
    limit,
    total,
    totalPages,
  };
};
