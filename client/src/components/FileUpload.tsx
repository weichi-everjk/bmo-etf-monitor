import { useCallback, useState } from "react";
import axios from "axios";
import type { ParsedETFData, ParsedPricesData } from "../types";
import { getAxiosErrorMessage } from "../utils/axiosErrorHelper";

interface FileUploadProps {
  onETFUploaded: (data: ParsedETFData) => void;
  onPricesUploaded: (data: ParsedPricesData) => void;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function FileUpload({
  onETFUploaded,
  onPricesUploaded,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadETF = useCallback(
    async (formData: FormData) => {
      const res = await axios.post(`${API_URL}/api/upload/etf`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onETFUploaded(res.data.data);
    },
    [onETFUploaded],
  );

  const uploadPrices = useCallback(
    async (formData: FormData) => {
      const res = await axios.post(`${API_URL}/api/upload/prices`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data.data as ParsedPricesData & {
        constituents: string[];
      };

      onPricesUploaded({
        ...data,
        constituents: new Set(data.constituents),
      } as ParsedPricesData);
    },
    [onPricesUploaded],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setUploadError("Please upload a CSV file");
        return;
      }

      setUploading(true);
      setUploadError(null);

      try {
        const filename = file.name.toLowerCase();
        const formData = new FormData();
        formData.append("file", file);

        if (
          filename.includes("etf1") ||
          filename.includes("etf2") ||
          filename.includes("etf")
        ) {
          await uploadETF(formData);
          return;
        }

        if (filename.includes("price")) {
          await uploadPrices(formData);
          return;
        }

        const text = await file.text();
        const firstLine = (text.split("\n")[0] ?? "").toLowerCase();

        if (firstLine.includes("weight")) {
          await uploadETF(formData);
        } else {
          await uploadPrices(formData);
        }
      } catch (err) {
        setUploadError(getAxiosErrorMessage(err));
      } finally {
        setUploading(false);
      }
    },
    [uploadETF, uploadPrices],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-xl"
              : "border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg"
          }
          ${uploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          disabled={uploading}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer block">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-base font-medium text-gray-700">
                Processing file...
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {isDragging ? "Drop your file here" : "Upload CSV File"}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium text-blue-600">
                  Click to browse
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Supports: ETF1.csv, ETF2.csv, prices.csv
              </p>
            </>
          )}
        </label>
      </div>

      {uploadError && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-red-800">{uploadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
