export const formatDriveUrl = (url: string | undefined): string => {
  if (!url || typeof url !== 'string') return '';
  const fileRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match1 = url.match(fileRegex);
  if (match1 && match1[1]) {
    return `https://drive.google.com/uc?export=view&id=${match1[1]}`;
  }
  
  const openRegex = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const match2 = url.match(openRegex);
  if (match2 && match2[1]) {
    return `https://drive.google.com/uc?export=view&id=${match2[1]}`;
  }

  return url;
};
