export interface ProductImage {
  id: string;
  width: number;
  height: number;
  alt: string;
}

export interface ProductVideo {
  title: string;
  posterId: string;
  mp4Url: string;
}

export interface ProductOptionSelection {
  id: number;
  label: string;
  hex: string;
  linkedImageIds: string[];
}

export interface ProductOption {
  title: string;
  type: string;
  selections: ProductOptionSelection[];
}

export interface Product {
  id: string;
  code: string;
  codeNum: number;
  orderIndex: number;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  currency: string;
  inStock: boolean;
  stockQuantity: number | null;
  categories: string[];
  productType: string;
  colors: string[];
  description: string[];
  specs: Record<string, string>;
  images: ProductImage[];
  videos: ProductVideo[];
  options: ProductOption[];
}

export interface CartItem {
  productId: string;
  code: string;
  name: string;
  slug: string;
  price: number;
  imageId: string;
  selectedOption?: string;
  quantity: number;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Processing'
  | 'Dispatched'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered';

export interface OrderRecord {
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note: string }[];
  customer: {
    name: string;
    mobile: string;
    email: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
  };
  items: {
    productId: string;
    code: string;
    name: string;
    price: number;
    quantity: number;
    selectedOption?: string;
    imageId: string;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: 'razorpay' | 'upi_whatsapp' | 'cod';
  paymentStatus: 'paid' | 'pending_verification' | 'cod_confirmed';
  razorpayPaymentId?: string;
  courierName?: string;
  trackingNumber?: string;
}
