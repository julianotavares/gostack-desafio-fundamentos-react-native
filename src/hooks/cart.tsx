import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const keyStorage = '@GoMarketplace:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(keyStorage);

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const keyProduct = products.findIndex(item => item.id === id);

      if (keyProduct >= 0) {
        const updateProducts = [...products];

        updateProducts[keyProduct].quantity += 1;

        setProducts(updateProducts);
      }

      await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const keyProduct = products.findIndex(item => item.id === id);

      if (keyProduct >= 0) {
        if (products[keyProduct].quantity <= 1) {
          const removeProduct = products.filter(item => item.id !== id);

          setProducts([...removeProduct]);
        } else {
          const updateProducts = [...products];

          updateProducts[keyProduct].quantity -= 1;

          setProducts([...updateProducts]);
        }
      }

      await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        increment(product.id);
      } else {
        const productAdd = {
          ...product,
          quantity: 1,
        };

        await setProducts(state => [...state, productAdd]);
      }

      await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
