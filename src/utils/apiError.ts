export const getApiErrorMessage = (
  err: any,
  fallback = "Something went wrong. Please try again."
): string => {
  const raw =
    err?.response?.data?.message ??
    err?.response?.data ??
    err?.message ??
    fallback;

  let msg = typeof raw === "string" ? raw : JSON.stringify(raw);

  // Case: 401 UNAUTHORIZED "Current password is incorrect"
  const quoted = msg.match(/"([^"]+)"/);
  if (quoted?.[1]) return quoted[1].trim();

  // Otherwise remove leading "401 UNAUTHORIZED" type prefix if present
  msg = msg.replace(/^\d{3}\s+[A-Z_ ]+\s*/i, "").trim();

  // remove wrapping quotes if any
  msg = msg.replace(/^"+|"+$/g, "").trim();

  return msg || fallback;
};
