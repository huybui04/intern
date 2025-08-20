export const filterToMongo = (filterModel: any): any => {
  const mongoFilter: any = {};
  if (filterModel) {
    Object.keys(filterModel).forEach((field) => {
      const filter = filterModel[field];
      switch (filter.filterType) {
        case "text":
          mongoFilter[field] = { $regex: filter.filter, $options: "i" };
          break;
        case "number":
          if (filter.type === "equals") mongoFilter[field] = filter.filter;
          if (filter.type === "lessThan")
            mongoFilter[field] = { $lt: filter.filter };
          if (filter.type === "greaterThan")
            mongoFilter[field] = { $gt: filter.filter };
          break;
        // case "date":
        //   if (filter.type === "equals")
        //     mongoFilter[field] = { $eq: new Date(filter.filter) };
        //   if (filter.type === "lessThan")
        //     mongoFilter[field] = { $lt: new Date(filter.filter) };
        //   if (filter.type === "greaterThan")
        //     mongoFilter[field] = { $gt: new Date(filter.filter) };
        //   break;
        case "boolean":
          mongoFilter[field] = filter.filter;
          break;
        default:
          break;
      }
    });
  }
  return mongoFilter;
};
