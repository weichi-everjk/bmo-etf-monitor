import csv from "csv-parser";
import { Readable } from "stream";
import type { ETFHolding, PriceData, ParsedPricesData } from "./types/index.js";

interface CSVRow {
  [key: string]: string;
}

export function parseETFCSV(fileBuffer: Buffer): Promise<ETFHolding[]> {
  return new Promise((resolve, reject) => {
    const holdings: ETFHolding[] = [];
    const stream = Readable.from(fileBuffer.toString());

    stream
      .pipe(csv())
      .on("data", (row: CSVRow) => {
        const name = (row.name || row.constituent || "").trim();
        const weight = parseFloat(row.weight);

        if (name && !isNaN(weight)) {
          holdings.push({ constituent: name, weight });
        }
      })
      .on("end", () => resolve(holdings))
      .on("error", reject);
  });
}

export function parsePricesCSV(fileBuffer: Buffer): Promise<ParsedPricesData> {
  return new Promise((resolve, reject) => {
    const prices: PriceData[] = [];
    const constituents = new Set<string>();
    const dates: string[] = [];

    const stream = Readable.from(fileBuffer.toString());

    stream
      .pipe(csv())
      .on("data", (row: CSVRow) => {
        const date = (row.DATE || "").trim();
        if (!date) return;

        for (const key of Object.keys(row)) {
          if (key === "DATE" || key === "date") continue;

          const price = parseFloat(row[key]);
          if (isNaN(price)) continue;

          const constituent = key.trim();
          prices.push({ date, constituent, price });
          constituents.add(constituent);
        }

        dates.push(date);
      })
      .on("end", () => {
        const sortedDates = dates.sort();
        resolve({
          prices,
          constituents: Array.from(constituents),
          dateRange: {
            min: sortedDates[0] || "",
            max: sortedDates[sortedDates.length - 1] || "",
          },
        });
      })
      .on("error", reject);
  });
}
