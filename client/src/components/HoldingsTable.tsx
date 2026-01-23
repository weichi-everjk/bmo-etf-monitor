import type { HoldingWithPrice, SortField, SortOrder } from "../types";

interface HoldingsTableProps {
  holdings: HoldingWithPrice[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export default function HoldingsTable({
  holdings,
  sortField,
  sortOrder,
  onSort,
}: HoldingsTableProps) {

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  const formatWeight = (weight: number) => {
    return (weight * 100).toFixed(3) + "%";
  };

  return (
    <div className="mt-10">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">ETF Holdings</h2>
        <p className="text-gray-600">Click column headers to sort</p>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th
                  onClick={() => onSort("constituent")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Constituent
                    {sortField === "constituent" && (
                      <svg
                        className={`w-4 h-4 text-blue-600 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => onSort("weight")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Weight
                    {sortField === "weight" && (
                      <svg
                        className={`w-4 h-4 text-blue-600 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  onClick={() => onSort("price")}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Latest Close Price
                    {sortField === "price" && (
                      <svg
                        className={`w-4 h-4 text-blue-600 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {holdings.map((holding, index) => (
                <tr
                  key={`${holding.constituent}-${index}`}
                  className="hover:bg-blue-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {holding.constituent}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatWeight(holding.weight)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(holding.latestPrice)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing {holdings.length} holdings
      </div>
    </div>
  );
}
