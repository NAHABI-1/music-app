const { createProfileService } = require('./profile.service');

function createProfileController(service) {
  const profileService = service || createProfileService();

  return {
    getCurrentProfile: async (request, response, next) => {
      try {
        const profile = await profileService.getCurrentProfile(request.auth.userId);
        response.status(200).json(profile);
      } catch (error) {
        next(error);
      }
    },

    updateCurrentProfile: async (request, response, next) => {
      try {
        const profile = await profileService.updateCurrentProfile(request.auth.userId, request.validatedBody);
        response.status(200).json(profile);
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = {
  createProfileController,
};
