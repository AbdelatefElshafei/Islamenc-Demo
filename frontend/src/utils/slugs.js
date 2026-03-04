export const sanitizeSlug = (slug) => {
  if (!slug) return '';
  // Remove characters invalid in Windows filenames: < > : " / \ | ? *
  // We replace them with nothing or a safe character.
  // Replacing with nothing seems safest to avoid double dashes or confusion,
  // but replacing with '-' might be better for readability if the colon was a separator.
  // Given the previous error "الخلاف بين العلماء: أسبابه", replacing ':' with '-' makes sense: "الخلاف بين العلماء- أسبابه"
  return slug.replace(/[:"|?*<>/\\]/g, '-');
};
