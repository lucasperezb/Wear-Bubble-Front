export type CheckoutStep = 'cart' | 'delivery' | 'payment' | 'confirmation';

export type DeliveryProfile = {
  name: string;
  email: string;
  taxId: string;
  phone: string;
  cep: string;
  street: string;
  neighborhood: string;
  number: string;
  reference: string;
  city: string;
  state: string;
};

export const emptyDeliveryProfile: DeliveryProfile = {
  name: '',
  email: '',
  taxId: '',
  phone: '',
  cep: '',
  street: '',
  neighborhood: '',
  number: '',
  reference: '',
  city: '',
  state: '',
};

export type CardPaymentForm = {
  holder: string;
  number: string;
  expiry: string;
  securityCode: string;
  installments: number;
};

export const emptyCardPaymentForm: CardPaymentForm = {
  holder: '',
  number: '',
  expiry: '',
  securityCode: '',
  installments: 1,
};

export type PixPayment = {
  orderId: string;
  number: string;
  total: number;
  paymentStatus: string;
  pix: {
    text: string;
    image: string | null;
    expiresAt: string | null;
  };
};
