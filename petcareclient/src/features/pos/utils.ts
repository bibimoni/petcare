export const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const formatPrice = (value: unknown): string => {
  const amount = toNumber(value);

  if (amount === null) {
    return "0đ";
  }

  return `${amount.toLocaleString("vi-VN")}đ`;
};
