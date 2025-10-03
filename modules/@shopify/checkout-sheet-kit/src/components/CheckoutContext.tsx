import React, {
  createContext,
  useContext,
  useReducer,
  type PropsWithChildren,
} from 'react';
import type {MailingAddress} from '../pixels';

export type PaymentData = {
  lastFourDigits?: string;
  cardNetwork?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  [key: string]: any;
};

export type CheckoutState = {
  address: Record<string, MailingAddress>;
  payments: Record<string, PaymentData>;
};

export type CheckoutAction =
  | {type: 'SET_ADDRESS_DATA'; id: string; data: MailingAddress}
  | {type: 'SET_PAYMENT_DATA'; id: string; data: PaymentData};

type CheckoutContextData = {
  state: CheckoutState;
  dispatch: React.Dispatch<CheckoutAction>;
};

const CheckoutContext = createContext<CheckoutContextData | undefined>(
  undefined,
);

function reducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'SET_ADDRESS_DATA':
      return {
        ...state,
        address: {...state.address, [action.id]: action.data},
      };
    case 'SET_PAYMENT_DATA':
      return {
        ...state,
        payments: {...state.payments, [action.id]: action.data},
      };
    default:
      action satisfies never;
      return state;
  }
}

export function useCheckoutContext() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error(
      `${useCheckoutContext.name} must be used within CheckoutContextProvider`,
    );
  }
  return context;
}

const initialState: CheckoutState = {
  address: {},
  payments: {},
};

export function CheckoutContextProvider({children}: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log({state});

  return (
    <CheckoutContext.Provider value={{state, dispatch}}>
      {children}
    </CheckoutContext.Provider>
  );
}
