import path from "node:path";
import { pathToFileURL } from "node:url";

function stripSqliteScheme(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice("file:".length);
  }

  if (databaseUrl.startsWith("sqlite:")) {
    return databaseUrl.slice("sqlite:".length);
  }

  return databaseUrl;
}

export function resolveSqliteFilePath(databaseUrl: string) {
  const filePath = stripSqliteScheme(databaseUrl);

  if (!filePath) {
    throw new Error("The SQLite DATABASE_URL is missing a file path.");
  }

  return path.isAbsolute(filePath)
    ? filePath
    : path.resolve(/* turbopackIgnore: true */ process.cwd(), filePath);
}

export function normalizeSqliteDatabaseUrl(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl;
  }

  const filePath = resolveSqliteFilePath(databaseUrl);
  return pathToFileURL(filePath).href;
}