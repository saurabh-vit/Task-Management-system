import { z } from "zod";

export const roleNameSchema = z.enum(["Admin", "Manager", "User"]);

const optionalNameSchema = z
  .string()
  .trim()
  .max(80, "Name must be 80 characters or fewer.")
  .transform((value) => value || undefined);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
  next: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export const registerSchema = z
  .object({
    name: optionalNameSchema,
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(8, "Please confirm your password."),
    next: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
