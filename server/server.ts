import express, { Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseETFCSV, parsePricesCSV } from "./csvParser.js";
import type {
  ETFHoldingsResponse,
  ParsedPricesData,
  PriceData,
} from "./types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

let etfHoldings: ETFHoldingsResponse | null = null;
let pricesData: ParsedPricesData | null = null;

function computeLatestPrices(prices: PriceData[]): Record<string, number> {
  const byConstituent = new Map<string, { date: string; price: number }>();
  for (const p of prices) {
    const existing = byConstituent.get(p.constituent);
    if (
      !existing ||
      new Date(p.date).getTime() > new Date(existing.date).getTime()
    ) {
      byConstituent.set(p.constituent, { date: p.date, price: p.price });
    }
  }
  const out: Record<string, number> = {};
  byConstituent.forEach((v, k) => {
    out[k] = v.price;
  });
  return out;
}

type SortField = "constituent" | "weight" | "price";
type SortOrder = "asc" | "desc";

interface EnrichedHolding {
  constituent: string;
  weight: number;
  latestPrice?: number;
  holdingSize?: number;
}

function computeEtfPriceSeries(
  holdings: { constituent: string; weight: number }[],
  prices: PriceData[],
): { date: string; price: number }[] {
  const priceMap = new Map<string, number>();
  for (const p of prices) {
    priceMap.set(`${p.date}|${p.constituent}`, p.price);
  }
  const dates = [...new Set(prices.map((p) => p.date))].sort();
  return dates.map((date) => {
    const price = holdings.reduce(
      (sum, h) =>
        sum + (priceMap.get(`${date}|${h.constituent}`) ?? 0) * h.weight,
      0,
    );
    return { date, price: Number(price.toFixed(2)) };
  });
}

function sortEnrichedHoldings(
  holdings: EnrichedHolding[],
  sort: SortField,
  order: SortOrder,
): EnrichedHolding[] {
  const sorted = [...holdings].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    switch (sort) {
      case "constituent":
        aVal = a.constituent;
        bVal = b.constituent;
        break;
      case "weight":
        aVal = a.weight;
        bVal = b.weight;
        break;
      case "price":
        aVal = a.latestPrice ?? 0;
        bVal = b.latestPrice ?? 0;
        break;
    }
    if (typeof aVal === "string" && typeof bVal === "string") {
      return order === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return order === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });
  return sorted;
}

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function loadPricesFromDisk() {
  const pricesPath = path.join(uploadsDir, "prices.csv");
  if (fs.existsSync(pricesPath)) {
    try {
      const fileBuffer = fs.readFileSync(pricesPath);
      pricesData = await parsePricesCSV(fileBuffer);
      console.log(
        `Loaded prices data from disk (${pricesData.prices.length} records)`,
      );
    } catch (error) {
      console.error("Failed to load prices from disk:", error);
    }
  }
}

app.post(
  "/api/upload/etf",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.originalname.endsWith(".csv")) {
        return res.status(400).json({ error: "Invalid CSV file" });
      }
      const holdings = await parseETFCSV(req.file.buffer);
      etfHoldings = {
        holdings,
        filename: req.file.originalname,
        uploadedAt: new Date().toISOString(),
      };
      return res.json({
        message: "ETF file uploaded successfully",
        data: etfHoldings,
      });
    } catch (error) {
      console.error("Error parsing ETF CSV:", error);
      return res.status(500).json({
        error: "Failed to parse ETF CSV file",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

app.post(
  "/api/upload/prices",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.originalname.endsWith(".csv")) {
        return res.status(400).json({ error: "Invalid CSV file" });
      }
      pricesData = await parsePricesCSV(req.file.buffer);
      const pricesPath = path.join(uploadsDir, "prices.csv");
      fs.writeFileSync(pricesPath, req.file.buffer);
      return res.json({
        message: "Prices file uploaded successfully",
        data: pricesData,
      });
    } catch (error) {
      console.error("Error parsing prices CSV:", error);
      return res.status(500).json({
        error: "Failed to parse prices CSV file",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
);

app.get("/api/prices", (_req: Request, res: Response) => {
  if (!pricesData) {
    return res.status(404).json({ error: "No prices data available" });
  }
  return res.json(pricesData);
});

app.get("/api/prices/latest", (_req: Request, res: Response) => {
  if (!pricesData) {
    return res.status(404).json({ error: "No prices data available" });
  }
  const latestPrices = computeLatestPrices(pricesData.prices);
  return res.json({ latestPrices });
});

app.get("/api/holdings/enriched", (req: Request, res: Response) => {
  if (!etfHoldings || !pricesData) {
    return res.status(404).json({
      error: "Both ETF holdings and prices data are required",
    });
  }
  const latestPrices = computeLatestPrices(pricesData.prices);
  const enriched: EnrichedHolding[] = etfHoldings.holdings.map((h) => {
    const latestPrice = latestPrices[h.constituent];
    const holdingSize =
      latestPrice != null ? latestPrice * h.weight : undefined;
    return {
      ...h,
      latestPrice,
      holdingSize,
    };
  });
  const sort = (req.query.sort as SortField) || "constituent";
  const order = (req.query.order as SortOrder) || "asc";
  const validSort: SortField[] = ["constituent", "weight", "price"];
  const validOrder: SortOrder[] = ["asc", "desc"];
  const sortField = validSort.includes(sort) ? sort : "constituent";
  const sortOrder = validOrder.includes(order) ? order : "asc";
  const holdings = sortEnrichedHoldings(enriched, sortField, sortOrder);
  return res.json({ holdings });
});

app.get("/api/etf-price-series", (_req: Request, res: Response) => {
  if (!etfHoldings || !pricesData) {
    return res.status(404).json({
      error: "Both ETF holdings and prices data are required",
    });
  }
  const series = computeEtfPriceSeries(etfHoldings.holdings, pricesData.prices);
  return res.json({ series });
});

app.get("/api/holdings/top", (req: Request, res: Response) => {
  if (!etfHoldings || !pricesData) {
    return res.status(404).json({
      error: "Both ETF holdings and prices data are required",
    });
  }
  const n = Math.min(
    Math.max(1, parseInt(String(req.query.n || "5"), 10) || 5),
    100,
  );
  const latestPrices = computeLatestPrices(pricesData.prices);
  const enriched: EnrichedHolding[] = etfHoldings.holdings.map((h) => {
    const latestPrice = latestPrices[h.constituent];
    const holdingSize =
      latestPrice != null ? latestPrice * h.weight : undefined;
    return { ...h, latestPrice, holdingSize };
  });
  const top = enriched
    .filter((h) => h.holdingSize != null && h.holdingSize > 0)
    .sort((a, b) => (b.holdingSize ?? 0) - (a.holdingSize ?? 0))
    .slice(0, n)
    .map((h) => ({
      name: h.constituent,
      size: Number((h.holdingSize ?? 0).toFixed(2)),
    }));
  return res.json({ top });
});

app.get("/prices.csv", (_req: Request, res: Response) => {
  const pricesPath = path.join(uploadsDir, "prices.csv");
  if (!fs.existsSync(pricesPath)) {
    return res.status(404).json({ error: "prices.csv not found" });
  }
  res.setHeader("Content-Type", "text/csv");
  return res.sendFile(pricesPath);
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await loadPricesFromDisk();
});
