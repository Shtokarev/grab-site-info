import { MongoClient, Callback, Db } from "mongodb";

import { mongoDbConnectionString, mongoDbName } from "../envs/load-envs";

export let db: Db | null = null;

export const connectDb = (): Promise<Db> =>
  new Promise((resolve, reject) => {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      sslValidate: false,
    };

    const mongoClient = new MongoClient(mongoDbConnectionString, options);

    mongoClient.connect(((error: any, client: MongoClient) => {
      if (error) {
        console.error(error);
        return reject(error);
      }

      process.on("SIGTERM", () => {
        client.close();
      });

      resolve(client.db(mongoDbName));
    }) as Callback<MongoClient>);
  });

(async () => {
  try {
    db = await connectDb();
  } catch (error) {
    console.log("Error in mongo initializer:");
    console.log(error);
  }
})();
