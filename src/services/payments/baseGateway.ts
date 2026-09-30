export interface PaymentGatewayConfig {
  sandbox: boolean;
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  reference: string;
  description: string;
  customer: {
    email: string;
    phone?: string;
    name: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  gatewayReference?: string;
  redirectUrl?: string;
  error?: string;
  rawResponse?: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  amount: number;
  gatewayReference: string;
  paidAt?: Date;
  rawResponse?: any;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId?: string;
  error?: string;
}

export abstract class PaymentGateway {
  protected config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  abstract initializePayment(request: PaymentRequest): Promise<PaymentResponse>;
  abstract verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult>;
  abstract processRefund(request: RefundRequest): Promise<RefundResponse>;
  abstract handleWebhook(payload: any, signature?: string): Promise<{ success: boolean; event: string; data: any }>;
  abstract getSupportedMethods(): string[];
  abstract getGatewayName(): string;
}

export class PaymentGatewayFactory {
  private static gateways: Map<string, PaymentGateway> = new Map();

  static register(gateway: PaymentGateway) {
    this.gateways.set(gateway.getGatewayName(), gateway);
  }

  static get(gatewayName: string): PaymentGateway | undefined {
    return this.gateways.get(gatewayName);
  }

  static getAll(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }

  static getSupportedGateways(): string[] {
    return Array.from(this.gateways.keys());
  }
}