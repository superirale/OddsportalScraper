import { exit } from "process";

const nano = require("nano")("http://admin:Omokhudu1987@127.0.0.1:5984");
const db = nano.use("historical-odds");

export async function deleter(leagueName: string, season: string, sport: string) {
  try {
    const q = {
      selector: {
        leagueName: { $eq: leagueName },
        season: { $eq: season },
        sport: { $eq: sport },
      },
      limit: 3000,
    };
    const records = await db.find(q);

    console.log(records.docs.length);

    for await (const record of records.docs) {

      await db.destroy(record._id, record._rev);;
    }
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message;
    console.log(message);
  }
};
