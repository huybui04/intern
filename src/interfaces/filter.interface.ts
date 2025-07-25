export interface IFilter {
  field: string;
  operator: "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in" | "nin" | "regex";
  value: any;
}
