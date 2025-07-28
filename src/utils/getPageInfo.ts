export function getPageInfo(
  startRow: number,
  endRow: number,
  rowCount: number
) {
  const pageSize = endRow - startRow;
  const currentPage = pageSize > 0 ? Math.floor(startRow / pageSize) + 1 : 1;
  const totalPages = pageSize > 0 ? Math.ceil(rowCount / pageSize) : 1;
  return {
    pageSize,
    currentPage,
    totalPages,
  };
}
