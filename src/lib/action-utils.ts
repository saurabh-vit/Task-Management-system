import { AuthorizationError } from "@/lib/auth/authorization";
import { ZodError } from "zod";

export function getTextValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getActionErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }

  if (error instanceof AuthorizationError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function buildRedirectUrl(
  pathname: string,
  key: "error" | "success",
  message: string
) {
  const params = new URLSearchParams({
    [key]: message,
  });

  return `${pathname}?${params.toString()}`;
}

export function pickSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
