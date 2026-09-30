import { PaymentGateway, PaymentGatewayConfig, PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';
import crypto from 'crypto';

interface YocoConfig extends PaymentGatewayConfig {
  secretKey: string;
  publicKey: string;
}

export class YocoGateway extends PaymentGateway {
  private yocoConfig: YocoConfig;
  private baseUrl: string;

  constructor(config: YocoConfig) {
    super(config);
    this.yocoConfig = config;
    this.baseUrl = config.sandbox
      ? 'https://payments.yoco.com/api'
      : 'https://payments.yoco.com/api';
  }

  getGatewayName(): string {
    return 'yoco';
  }

  getSupportedMethods(): string[] {
    return ['card', 'apple_pay', 'google_pay'];
  }

  private getAuthHeader(): string {
    return `Bearer ${this.yocoConfig.secretKey}`;
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData = {
        amountInCents: Math.round(request.amount * 100),
        currency: request.currency,
        callbackUrl: this.config.successUrl,
        cancelUrl: this.config.cancelUrl,
        metadata: {
          reference: request.reference,
          patientId: request.metadata?.patientId,
          claimId: request.metadata?.claimId,
          practiceId: request.metadata?.practiceId,
          description: request.description,
        },
        lineItems: [{
          name: request.description,
          quantity: 1,
          amountInCents: Math.round(request.amount * 100),
        }],
        customer: {
          email: request.customer.email,
          phone: request.customer.phone,
        },
      };

      const response = await fetch(`${this.baseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          'X-Yoco-Idempotency-Key': request.reference,
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.id && result.redirectUrl) {
        return {
          success: true,
          paymentId: request.reference,
          gatewayReference: result.id,
          redirectUrl: result.redirectUrl,
          rawResponse: result,
        };
      }

      return {
        success: false,
        error: result.error?.message || 'Failed to initialize Yoco checkout',
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize Yoco payment',
      };
    }
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/checkouts/${gatewayReference}`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const result = await response.json();

      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
        'created': 'pending',
        'paid': 'completed',
        'failed': 'failed',
        'cancelled': 'cancelled',
        'expired': 'cancelled',
      };

      return {
        success: result.status === 'paid',
        status: statusMap[result.status] || 'pending',
        amount: (result.amountInCents || 0) / 100,
        gatewayReference,
        paidAt: result.paidAt ? new Date(result.paidAt) : undefined,
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
      const response = await fetch(`${this.baseUrl}/checkouts/${request.paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountInCents: request.amount ? Math.round(request.amount * 100) : undefined,
          reason: request.reason,
        }),
      });

      const result = await response.json();

      return {
        success: result.status === 'refunded',
        refundId: result.id,
        error: result.error?.message,
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
        .createHmac('sha256', this.yocoConfig.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return { success: false, event: 'invalid_signature', data: payload };
      }
    }

    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
      'created': 'pending',
      'paid': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'expired': 'cancelled',
      'refunded': 'refunded',
    };

    return {
      success: true,
      event: `payment_${payload.status || 'unknown'}`,
      data: {
        reference: payload.metadata?.reference,
        gatewayReference: payload.id,
        amount: (payload.amountInCents || 0) / 100,
        status: statusMap[payload.status] || 'pending',
        customerEmail: payload.customer?.email,
        rawPayload: payload,
      },
    };
  }
}