export default interface IDatasource {
  save<T>(data: T): Promise<void>;
  fetch<T>(queryOpt: Record<string, unknown>): Promise<T>;
}
