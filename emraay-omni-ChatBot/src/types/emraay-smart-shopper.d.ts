import 'react';

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // Allows emraay/staples-smart-shopper web component attributes
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'staples-smart-shopper': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.Ref<EmraaySmartShopperElement>;
        'user-id'?: string;
        'header-title'?: string;
        'theme-mode'?: string;
        'enable-sound'?: string;
        'max-history-messages'?: string;
        'enable-image-upload'?: string;
        locale?: string;
      };
    }
  }
}

export interface EmraaySmartShopperElement extends HTMLElement {
  addMessage: (message: {
    text: string;
    sender: string;
    timestamp: number;
    products?: unknown[];
  }) => void;
}
