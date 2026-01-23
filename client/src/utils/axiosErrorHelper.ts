import axios from "axios";

export function getAxiosErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    const msg =
      err.response?.data?.message || err.response?.statusText || err.message;
    return msg || "Failed to upload CSV file";
  }
  return err instanceof Error ? err.message : "Failed to upload CSV file";
}
