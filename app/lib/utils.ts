/**
 * Generates a URL-friendly slug from a given string.
 * This function is now centralized to ensure consistency across the application.
 * - Converts to lowercase
 * - Trims whitespace
 * - Replaces spaces and other symbols with a hyphen
 * - Removes any non-alphanumeric characters (except for Arabic letters and hyphens)
 */
export const generateSlug = (name: string): string => {
    if (!name) return '';
    return name
        .trim()
        .toLowerCase()
        .replace(/[\s_.,;:'"()[\]{}]+/g, '-') // Replace spaces and many symbols with a hyphen
        .replace(/--+/g, '-') // Collapse consecutive hyphens
        .replace(/[^\w\d\-\u0600-\u06FF]/g, '') // Remove non-alphanumeric, non-hyphen, non-Arabic characters
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};
