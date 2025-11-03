export interface Product {
  id: number;
  name: string;
  price: number;
  sharers: string[];
}

export interface Receipt {
  id: number;
  timestamp: number;
  title: string;
  products: Product[];
  sharers: { name: string }[];
  productTotal: number;
}

export const calculateShares = (receipt: Receipt, products: Product[]) => {
  const individualTotals: { [key: string]: number } = {};
  const sharerTotals: { [key: string]: number } = {};

  products.forEach((product: Product) => {
    const splitPrice = product.price / (product.sharers.length || 1);
    product.sharers.forEach((sharer) => {
      if (!individualTotals[sharer]) {
        individualTotals[sharer] = 0;
      }
      individualTotals[sharer] += splitPrice;
    });
  });

  const sharedTotal =
    receipt.productTotal -
    Object.values(individualTotals).reduce((sum, val) => sum + val, 0);

  receipt.sharers.forEach((sharer: any) => {
    sharerTotals[sharer.name] =
      sharedTotal / receipt.sharers.length +
      (individualTotals[sharer.name] || 0);
  });

  return { individualTotals, sharerTotals };
};
