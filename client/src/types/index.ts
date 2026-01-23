export interface ETFHolding {
  constituent: string;
  weight: number;
}

export interface PriceData {
  date: string;
  constituent: string;
  price: number;
}

export interface ParsedETFData {
  holdings: ETFHolding[];
  filename: string;
}

export interface ParsedPricesData {
  prices: PriceData[];
  constituents: Set<string>;
  dateRange: {
    min: string;
    max: string;
  };
}

export interface HoldingWithPrice extends ETFHolding {
  latestPrice?: number;
  holdingSize?: number;
}

export interface PriceSeriesPoint {
  date: string;
  price: number;
}

export interface TopHoldingItem {
  name: string;
  size: number;
}

export type SortField = "constituent" | "weight" | "price";
export type SortOrder = "asc" | "desc";
