import { PaymentGateway, PaymentGatewayConfig, PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';
import crypto from 'crypto';

interface NetcashConfig extends PaymentGatewayConfig {
  merchantId: string;
  apiKey: string;
}

interface NetcashPaymentRequest {
  merchant_id: string;
  amount: string;
  currency: string;
  reference: string;
  description: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  metadata?: Record<string, string>;
}

export class NetcashGateway extends PaymentGateway {
  private netcashConfig: NetcashConfig;
  private baseUrl: string;

  constructor(config: NetcashConfig) {
    super(config);
    this.netcashConfig = config;
    this.baseUrl = config.sandbox
      ? 'https://sandbox.netcash.co.za/api/v1'
      : 'https://api.netcash.co.za/api/v1';
  }

  getGatewayName(): string {
    return 'netcash';
  }

  getSupportedMethods(): string[] {
    return ['card', 'eft', 'debit_order', 'instant_eft'];
  }

  private getAuthHeader(): string {
    return `Bearer ${this.netcashConfig.apiKey}`;
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData: NetcashPaymentRequest = {
        merchant_id: this.netcashConfig.merchantId,
        amount: request.amount.toFixed(2),
        currency: request.currency,
        reference: request.reference,
        description: request.description,
        return_url: this.config.successUrl,
        cancel_url: this.config.cancelUrl,
        notify_url: this.config.webhookUrl,
        customer: {
          email: request.customer.email,
          name: request.customer.name,
          phone: request.customer.phone,
        },
        metadata: {
          patientId: request.metadata?.patientId || '',
          claimId: request.metadata?.claimId || '',
          practiceId: request.metadata?.practiceId || '',
        },
      };

      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Idempotency-Key': request.reference,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.id && result.payment_url) {
        return {
          success: true,
          paymentId: request.reference,
          gatewayReference: result.id,
          redirectUrl: result.payment_url,
          rawResponse: result,
        };
      }

      return {
        success: false,
        error: result.message || 'Failed to initialize Netcash payment',
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize Netcash payment',
      };
    }
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${gatewayReference}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const result = await response.json();

      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
        'pending': 'pending',
        'authorized': 'pending',
        'captured': 'completed',
        'completed': 'completed',
        'failed': 'failed',
        'cancelled': 'cancelled',
        'refunded': 'refunded',
        'expired': 'cancelled',
      };

      return {
        success: ['captured', 'completed'].includes(result.status),
        status: statusMap[result.status] || 'pending',
        amount: parseFloat(result.amount || '0'),
        gatewayReference,
        paidAt: result.completed_at ? new Date(result.completed_at) : undefined,
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'failed',
        amount: 0,
        gatewayReference,
        error: error.message,
      };
    }
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${request.paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amount ? request.amount.toFixed(2) : undefined,
          reason: request.reason,
        }),
      });

      const result = await response.json();

      return {
        success: result.status === 'refunded',
        refundId: result.id,
        error: result.message,
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<{ success: boolean; event: string; data: any }> {
    if (signature) {
      const expectedSignature = crypto
        .createHmac('sha256', this.netcashConfig.apiKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return { success: false, event: 'invalid_signature', data: payload };
      }
    }

    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
      'pending': 'pending',
      'authorized': 'pending',
      'captured': 'completed',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'expired': 'cancelled',
    };

    return {
      success: true,
      event: `payment_${payload.status || 'unknown'}`,
      data: {
        reference: payload.reference,
        gatewayReference: payload.id,
        amount: parseFloat(payload.amount || '0'),
        status: statusMap[payload.status] || 'pending',
        customerEmail: payload.customer?.email,
        rawPayload: payload,
      },
    };
  }
}