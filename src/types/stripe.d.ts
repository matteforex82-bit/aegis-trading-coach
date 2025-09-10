// Stripe Pricing Table Custom Element Declaration
declare namespace JSX {
  interface IntrinsicElements {
    'stripe-pricing-table': {
      'pricing-table-id': string;
      'publishable-key': string;
      'client-reference-id'?: string;
      'customer-email'?: string;
      'customer-session-client-secret'?: string;
      children?: React.ReactNode;
    };
  }
}

// Global Stripe types
declare global {
  interface Window {
    Stripe?: any;
  }
}

export {};