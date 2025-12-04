import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional()
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6)
});
