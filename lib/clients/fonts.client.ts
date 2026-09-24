export const fontsClient = {
  getFontUrl: async (family: string) => {
    const base = (process.env.GOOGLE_FONTS_API_BASE ?? 'https://www.googleapis.com').replace(/\/$/, '');
    const response = await fetch(
      `${base}/webfonts/v1/webfonts?key=${process.env.GOOGLE_FONTS_API_KEY}&family=${family}`,
    );
    const data = await response.json();
    console.log(data);

    return data.items[0].files;
  },
  fetchFont: async (font: string) => {
    const response = await fetch(`/fonts/${font}.ttf`);
    return response.arrayBuffer();
  },
};
