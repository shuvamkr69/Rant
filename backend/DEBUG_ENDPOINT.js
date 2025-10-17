// Quick API test endpoint to verify swipe functionality
// Add this temporarily to your profiles.controller.js for debugging

export const debugProfiles = async (req, res) => {
  try {
    const allProfiles = await Profile.find({})
      .populate("userId", "name userType")
      .populate("otherUserId", "name userType");

    res.status(200).json({
      totalProfiles: allProfiles.length,
      profiles: allProfiles.map((p) => ({
        from: p.userId?.name,
        fromType: p.userId?.userType,
        to: p.otherUserId?.name,
        toType: p.otherUserId?.userType,
        status: p.Status,
        message: p.preMatchMessage,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add this route to profiles.routes.js:
// profilesRouter.get("/debug-profiles", verifyJWT, debugProfiles);
