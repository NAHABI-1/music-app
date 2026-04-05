const { z } = require('zod');
const { validateBody } = require('../../middleware/validateBody');

const jsonRecordSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]));

const updateProfileSchema = z
  .object({
    displayName: z.string().min(2).max(140).optional(),
    bio: z.string().max(800).optional().nullable(),
    countryCode: z.string().length(2).transform((v) => v.toUpperCase()).optional().nullable(),
    dateOfBirth: z.string().date().optional().nullable(),
    avatarUrl: z.string().url().max(2000).optional().nullable(),
    avatarStorageKey: z.string().max(400).optional().nullable(),
    avatarMetadata: jsonRecordSchema.optional().nullable(),
    profileMetadata: jsonRecordSchema.optional().nullable(),
    notificationPreferences: z
      .object({
        inAppNotificationsEnabled: z.boolean().optional(),
        pushNotificationsEnabled: z.boolean().optional(),
        emailNotificationsEnabled: z.boolean().optional(),
        notificationTopics: jsonRecordSchema.optional().nullable(),
      })
      .optional(),
    emailPreferences: z
      .object({
        emailMarketingEnabled: z.boolean().optional(),
        emailProductUpdatesEnabled: z.boolean().optional(),
        emailSecurityAlertsEnabled: z.boolean().optional(),
      })
      .optional(),
  })
  .refine(
    (data) =>
      Object.keys(data).length > 0 &&
      (Object.keys(data).some((key) => key !== 'notificationPreferences' && key !== 'emailPreferences') ||
        (data.notificationPreferences && Object.keys(data.notificationPreferences).length > 0) ||
        (data.emailPreferences && Object.keys(data.emailPreferences).length > 0)),
    {
      message: 'At least one profile preference field must be provided.',
    }
  );

module.exports = {
  updateProfileSchema,
  validateBody,
};
