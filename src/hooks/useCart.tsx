import { totalmem } from 'os';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { textSpanIsEmpty, updateVariableDeclarationList } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // TODO
      //Encontra o produto no carrinho
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId);
      //Encontra stock do produto
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount
      //Verifica disponibilidade no stock
      const currentAmount = productExists ? productExists.amount : 0;
      console.log("currentAmount: ", currentAmount)
      const updatedAmount = currentAmount + 1;
      console.log("updatedAmount: ", updatedAmount)
      
      if (updatedAmount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return ;
      }
      //Incrementa quantidade do produto caso já exista no carrinho
      if(productExists){
        productExists.amount = updatedAmount;
      }
      //Adiciona produto no carrinho caso já não exista
      else{
        const product = await api.get(`/products/${productId}`)
        
        const newProduct: Product = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct)
      }
      //Atualiza alterações
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      // TODO
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product=>(product.id === productId))
      if (productIndex == -1){
        toast.error('Erro na remoção do produto')
        return ;
      }

      //Atualiza alterações
      updatedCart.splice(productIndex, 1)
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      // TODO
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      //Encontra produto no carrinho
      const updatedCart = [...cart]
      const product = updatedCart.find(product => product.id === productId)
      //Encontra stock do produto
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount

      //Caso a quantidade seja 0, remove o produto
      if (amount < 1){
        return ;
      }
      
      //Verifica disponibilidade no stock
      if (amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque')
        return ;
      }
      
      //Altera quantidade do produto caso exista
      if (product)
        product.amount = amount
      //Da erro caso o produto nao exista
      else
        toast.error('Erro na alteração de quantidade do produto');

      //Atualiza alterações
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
