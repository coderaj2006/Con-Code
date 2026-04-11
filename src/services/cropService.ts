export interface CropData {
  id: string;
  name: string;
  growth: number;
  health: 'Good' | 'Fair' | 'Poor';
  lastWatered: string;
}

export const cropService = {
  fetchMyCrops: async (): Promise<CropData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cropNames = ['Tomato', 'Potato', 'Wheat'];
        const data: CropData[] = cropNames.map(name => ({
          id: name.toLowerCase(),
          name,
          growth: Math.floor(Math.random() * (85 - 15 + 1)) + 15,
          health: Math.random() > 0.3 ? 'Good' : 'Fair',
          lastWatered: '2 hours ago'
        }));
        resolve(data);
      }, 800);
    });
  }
};
