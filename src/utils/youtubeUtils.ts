/**
 * Extract YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|m\.youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/|www\.youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Generate YouTube embed URL from video ID
 */
export const generateYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Validate and convert YouTube URL to embed format
 */
export const convertToYouTubeEmbed = (url: string): string | null => {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? generateYouTubeEmbedUrl(videoId) : null;
};

/**
 * Check if a URL is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null;
};