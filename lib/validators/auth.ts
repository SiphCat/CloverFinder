import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username must be 30 characters or fewer")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only use letters, numbers, and underscores"
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signUpSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email("Enter a valid email"),
    password: passwordSchema,
    confirmPassword: z.string(),
    rememberMe: z.boolean().optional().default(false)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  /** Login identifier: full email, or Cloverfinder username (resolved on the server). */
  username: z
    .string()
    .trim()
    .min(1, "Enter your username or email")
    .max(320, "That value is too long")
    .superRefine((val, ctx) => {
      if (val.includes("@") && !z.string().email().safeParse(val).success) {
        ctx.addIssue({ code: "custom", message: "Enter a valid email" });
      }
    }),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email")
});

export const changeEmailSchema = z.object({
  email: z.string().email("Enter a valid email")
});

export const changeUsernameBodySchema = z.object({
  username: usernameSchema
});

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
