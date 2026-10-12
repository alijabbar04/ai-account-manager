"use strict";

function normalizeDashboardRole(role) {
  return role === "work" || role === "personal" ? role : null;
}

// The selection belongs to profiles.json. A persisted null means explicitly cleared.
// Legacy personal profiles keep their shared-state isolation when moved off Dashboard.
function selectDashboardProfile(store, id) {
  if (
    id !== null &&
    (typeof id !== "string" || !store.profiles.some((p) => p.id === id))
  ) {
    throw new Error("Account not found.");
  }
  const profiles = store.profiles.map((profile) => {
    const { dashboardRole, ...rest } = profile;
    const isolatedSharedState =
      profile.isolatedSharedState === true || dashboardRole === "personal";
    return {
      ...rest,
      // Preserve legacy VS Code names; dashboard switching must not reuse another profile.
      vscodeProfileLabel:
        profile.vscodeProfileLabel !== undefined
          ? profile.vscodeProfileLabel
          : dashboardRole === "work"
            ? "Work"
            : dashboardRole === "personal"
              ? "Personal"
              : null,
      ...(isolatedSharedState ? { isolatedSharedState: true } : {}),
      ...(profile.id === id
        ? { dashboardRole: isolatedSharedState ? "personal" : "work" }
        : {}),
    };
  });
  const next = { ...store, dashboardProfileId: id, profiles };
  return JSON.stringify(next) === JSON.stringify(store) ? store : next;
}

function migrateDashboardSelection(store) {
  if (Object.prototype.hasOwnProperty.call(store, "dashboardProfileId")) {
    const id = store.profiles.some((p) => p.id === store.dashboardProfileId)
      ? store.dashboardProfileId
      : null;
    return selectDashboardProfile(store, id);
  }
  if (!store.profiles.length) return store;
  const selected =
    store.profiles.find((p) => p.dashboardRole === "work") ??
    store.profiles.find((p) => p.dashboardRole === "personal") ??
    store.profiles[0];
  return selectDashboardProfile(store, selected.id);
}

module.exports = {
  normalizeDashboardRole,
  selectDashboardProfile,
  migrateDashboardSelection,
};
