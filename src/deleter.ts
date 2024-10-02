import { exit } from "process";

const nano = require("nano")("http://admin:Omokhudu1987@127.0.0.1:5984");
const db = nano.use("historical-odds");

(async () => {
  

  try {
    const q = {
        selector: {
          leagueName: { $eq: "super-league" },
          season: { $eq: "2024" },
          sport: { $eq: "rugby-league" },
        },
        limit: 1000,
      };
      const records = await db.find(q);

      console.log(records.docs.length);
      
      for await (const record of records.docs) {
        // console.log(record);
        await db.destroy(record._id, record._rev);
        // exit(1);
      }
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message;
    console.log(message);
  }
})();
