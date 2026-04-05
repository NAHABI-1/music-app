const { z } = require('zod');
const { validateBody } = require('../../middleware/validateBody');

const emailSchema = z.string().email().max(320).transform((value) => value.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters long')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number');

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2).max(140).optional(),
  countryCode: z.string().length(2).optional(),
  deviceId: z.string().min(1).max(190).optional(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  deviceId: z.string().min(1).max(190).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});

const socialAuthSchema = z.object({
  idToken: z.string().min(10),
  deviceId: z.string().min(1).max(190).optional(),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  socialAuthSchema,
  validateBody,
};
