import Nano from "nano";
import IDatasource from "./IDataSource" // Assuming this file is in the same directory

class CouchDBDatasource implements IDatasource {
  private db: any;

  constructor(couchdbUrl: string, databaseName: string) {
    const server = Nano(couchdbUrl)
    this.db = server.use(databaseName);
    
  }

  async save<T>(data: T): Promise<void> {
    try {
      const response = await this.db.insert(data);
      if (response.ok === true) {
        return;
      }
    } catch (error) {
      throw new Error("Error saving data to CouchDB: " + (error as Error).message);
    }
  }

  async fetch<T>(queryOpt: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.db.find(queryOpt);
      if (response?.docs.length) {
        return response.docs as T;
      }

      return {} as T;
    } catch (error) {
      throw new Error("Error fetching data from CouchDB: " + (error as Error).message);
    }
  }
}

export default CouchDBDatasource;
