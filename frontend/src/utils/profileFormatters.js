export const pickValue = (...values) =>
  values.find((value) => value !== null && value !== undefined && value !== "");

export const formatText = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

export const formatBoolean = (value) => {
  if (value === true) return "Enabled";
  if (value === false) return "Disabled";
  return "—";
};

export const formatList = (value) => {
  if (Array.isArray(value) && value.length > 0) {
    return value.filter(Boolean).join(", ");
  }
  return "—";
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toLocaleString();
};

export const formatCurrency = (value, currency = "USD") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const amount = Number(value);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch (error) {
    return amount.toLocaleString();
  }
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const formatRole = (value) => {
  if (!value) return "—";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const getInitials = (value) => {
  if (!value) return "—";
  const text = String(value).trim();
  if (!text) return "—";
  const parts = text.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[1][0] : parts[0]?.[1] ?? "";
  return `${first}${second}`.toUpperCase() || "—";
};
