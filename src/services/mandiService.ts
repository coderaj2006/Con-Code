export interface MandiPrice {
  crop: string;
  price: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  market: string;
}

export const mandiService = {
  fetchPrices: async (): Promise<MandiPrice[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { crop: 'Tomato', price: 2400, unit: 'Quintal', trend: 'up', market: 'Azadpur' },
          { crop: 'Wheat', price: 2100, unit: 'Quintal', trend: 'stable', market: 'Lucknow' },
          { crop: 'Potato', price: 1200, unit: 'Quintal', trend: 'down', market: 'Indore' }
        ]);
      }, 800);
    });
  }
};
