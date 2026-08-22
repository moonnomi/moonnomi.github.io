export function restoredEditorState(state) {
  const next = { ...state, dirty: false };

  if (state.activeView === "site") {
    if (state.savedSiteSnapshot) next.site = structuredClone(state.savedSiteSnapshot);
    return next;
  }

  if (state.isNew) {
    return {
      ...next,
      activePost: null,
      originalSlug: "",
      isNew: false,
      slugTouched: false,
      savedPostSnapshot: null,
    };
  }

  if (state.savedPostSnapshot) {
    return {
      ...next,
      activePost: structuredClone(state.savedPostSnapshot),
      originalSlug: state.savedPostSnapshot.slug,
      slugTouched: true,
    };
  }

  return next;
}
