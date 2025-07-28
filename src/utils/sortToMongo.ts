export const SortToMongo = (sortModel: any[]): any => {
  const mongoSort: any = {};
  if (Array.isArray(sortModel)) {
    sortModel.forEach((sort) => {
      mongoSort[sort.colId] = sort.sort === "asc" ? 1 : -1;
    });
  }
  return mongoSort;
};

  