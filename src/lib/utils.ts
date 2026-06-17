export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  // Input: "YYYY-MM-DD"
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};
