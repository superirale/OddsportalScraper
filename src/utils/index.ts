import fs from "fs";

export function saveJsonFile(filePath: string, data: string): void {
  fs.writeFileSync(filePath, data);
}

export function readJsonFile(filePath: string): unknown {
  try {
    let rawdata = fs.readFileSync(filePath);
    const data = JSON.parse(rawdata.toString());
    return data;
  } catch (error) {
    let message;
    if (error instanceof Error) message = error.message;
    console.log(message);
  }
}
