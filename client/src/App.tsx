import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import FileUpload from "./components/FileUpload";
import HoldingsTable from "./components/HoldingsTable";
import ETFPriceChart from "./components/ETFPriceChart";
import TopHoldingsChart from "./components/TopHoldingsChart";
import type {
  ParsedETFData,
  ParsedPricesData,
  HoldingWithPrice,
  PriceSeriesPoint,
  TopHoldingItem,
  SortField,
  SortOrder,
} from "./types";
import { getAxiosErrorMessage } from "./utils/axiosErrorHelper";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function App() {
  const [etfData, setEtfData] = useState<ParsedETFData | null>(null);
  const [pricesData, setPricesDataState] = useState<ParsedPricesData | null>(
    null,
  );
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [enrichedHoldings, setEnrichedHoldings] = useState<
    HoldingWithPrice[] | null
  >(null);
  const [priceSeries, setPriceSeries] = useState<PriceSeriesPoint[] | null>(
    null,
  );
  const [topHoldings, setTopHoldings] = useState<TopHoldingItem[] | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [sortField, setSortField] = useState<SortField>("constituent");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    let cancelled = false;

    const loadPrices = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/prices`);
        if (cancelled) return;

        const data = res.data;
        const parsed: ParsedPricesData = {
          ...data,
          constituents: new Set(data.constituents),
        };
        setPricesDataState(parsed);
      } catch (err) {
        if (!cancelled) {
          console.error(getAxiosErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    };

    loadPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!etfData || !pricesData) {
      setEnrichedHoldings(null);
      setPriceSeries(null);
      setTopHoldings(null);
      return;
    }
    let cancelled = false;
    setLoadingData(true);
    setEnrichedHoldings(null);
    setPriceSeries(null);
    setTopHoldings(null);

    const fetchAll = async () => {
      try {
        const [enrichedRes, seriesRes, topRes] = await Promise.all([
          axios.get<{ holdings: HoldingWithPrice[] }>(
            `${API_URL}/api/holdings/enriched`,
            { params: { sort: sortField, order: sortOrder } },
          ),
          axios.get<{ series: PriceSeriesPoint[] }>(
            `${API_URL}/api/etf-price-series`,
          ),
          axios.get<{ top: TopHoldingItem[] }>(`${API_URL}/api/holdings/top`, {
            params: { n: 5 },
          }),
        ]);
        if (cancelled) return;
        setEnrichedHoldings(enrichedRes.data.holdings);
        setPriceSeries(seriesRes.data.series);
        setTopHoldings(topRes.data.top);
      } catch (err) {
        if (!cancelled) {
          console.error(getAxiosErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [etfData, pricesData, sortField, sortOrder]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("asc");
      }
    },
    [sortField],
  );

  const handleETFUploaded = (data: ParsedETFData) => {
    setEtfData(data);
  };

  const handlePricesUploaded = (data: ParsedPricesData) => {
    setPricesDataState(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            ETF Price Monitor
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze ETF holdings and track historical prices with interactive
            visualizations
          </p>
        </div>

        {loadingPrices && (
          <div className="mb-6 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-sm font-medium text-gray-700">
                Loading prices data...
              </p>
            </div>
          </div>
        )}

        <FileUpload
          onETFUploaded={handleETFUploaded}
          onPricesUploaded={handlePricesUploaded}
        />

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {pricesData && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Prices Data Loaded
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {pricesData.prices.length.toLocaleString()} records •{" "}
                    {pricesData.constituents.size} constituents
                  </p>
                </div>
              </div>
            </div>
          )}

          {etfData && (
            <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    ETF Data Loaded
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {etfData.filename} • {etfData.holdings.length} holdings
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!pricesData && !loadingPrices && (
          <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-medium text-amber-800">
                Please upload prices.csv to continue
              </p>
            </div>
          </div>
        )}

        {etfData && !pricesData && (
          <div className="mt-6 bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm font-medium text-amber-800">
                Please load prices.csv to view latest prices
              </p>
            </div>
          </div>
        )}

        {etfData && pricesData && (
          <>
            {loadingData && (
              <div className="mt-6 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm font-medium text-gray-700">
                    Loading data...
                  </p>
                </div>
              </div>
            )}
            {!loadingData && enrichedHoldings && priceSeries && topHoldings && (
              <>
                <HoldingsTable
                  holdings={enrichedHoldings}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <div className="grid lg:grid-cols-2 gap-8 mt-8">
                  <ETFPriceChart data={priceSeries} />
                  <TopHoldingsChart data={topHoldings} />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
