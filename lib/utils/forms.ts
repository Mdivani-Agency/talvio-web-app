export function parseValidationErrors(errors: Record<string, string[]>) {
  return Object.keys(errors).reduce(
    (accumulator, key) => ({ ...accumulator, [key]: { message: errors[key]?.[0] } }),
    {},
  );
}

export function getHostname(url: string) {
  // Create a URL object
  const parsedUrl = new URL(url);

  // Get the hostname, which includes subdomains (e.g., www.domain.com)
  const hostname = parsedUrl.hostname;

  // Extract the main domain name (e.g., domain.com)
  // Split by '.' and filter to get the last two parts for domain
  const domainParts = hostname.split('.').filter((part) => part.length > 0);
  const domainName = domainParts.slice(domainParts.length - 2, domainParts.length - 1).join('.');

  return domainName;
}
