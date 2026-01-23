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
  uploadedAt: string;
}

export interface ParsedPricesData {
  prices: PriceData[];
  constituents: string[];
  dateRange: {
    min: string;
    max: string;
  };
}

export interface ETFHoldingsResponse {
  holdings: ETFHolding[];
  filename: string;
  uploadedAt: string;
}

export interface PricesResponse extends ParsedPricesData {
  filename: string;
  uploadedAt?: string;
}

export interface ConstituentPricesResponse {
  constituent: string;
  prices: PriceData[];
  latestPrice: number;
}

export interface LatestPriceResponse {
  constituent: string;
  latestPrice: number;
  date: string;
}

export interface StatsResponse {
  hasHoldings: boolean;
  holdingsCount: number;
  hasPrices: boolean;
  pricesCount: number;
  constituentsCount: number;
  dateRange: {
    min: string;
    max: string;
  } | null;
}
