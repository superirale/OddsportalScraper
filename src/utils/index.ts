import fs from "fs";
import path from "path";

export function saveJsonFile(filePath: string, data: string): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data);
  } catch (error) {
    console.error('Error saving JSON file:', error);
  }
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
