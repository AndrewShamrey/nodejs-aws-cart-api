import { CartItem } from '../../cart/models';

export type Order = {
  id?: string,
  userId: string;
  cartId: string;
  items: CartItem[]
  payment: {
    type: string,
    address?: any,
    creditCard?: any,
  },
  delivery: {
    type: string,
    address: any,
  },
  comments: string,
  status: string;
  total: number;
}

export enum OrderStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  CONFIRMED = 'CONFIRMED',
  SENT = 'SENT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
