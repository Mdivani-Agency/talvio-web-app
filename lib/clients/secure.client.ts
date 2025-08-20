export const secureFetch = async (url: string, options: RequestInit, token?: string) => {
  const accessToken = token || localStorage.getItem("bearer_token");

  if (!accessToken) {
      throw new Error("No token found");
  }

  return fetch(url, { ...options, headers: {
    ...options.headers,
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  } });
};
