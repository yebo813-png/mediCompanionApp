import { PaymentGateway, PaymentGatewayConfig, PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';
import crypto from 'crypto';

interface PeachPaymentsConfig extends PaymentGatewayConfig {
  entityId: string;
  password: string;
}

interface PeachPaymentData {
  entityId: string;
  amount: string;
  currency: string;
  paymentType: string;
  merchantTransactionId: string;
  customer: {
    email: string;
    givenName: string;
    surname: string;
    mobile?: string;
  };
  billing: {
    street1: string;
    city: string;
    state: string;
    country: string;
    postcode: string;
  };
  customParameters?: Record<string, string>;
}

export class PeachPaymentsGateway extends PaymentGateway {
  private peachConfig: PeachPaymentsConfig;
  private baseUrl: string;
  private apiUrl: string;

  constructor(config: PeachPaymentsConfig) {
    super(config);
    this.peachConfig = config;
    this.baseUrl = config.sandbox
      ? 'https://test.peachpayments.com/v1/checkouts'
      : 'https://api.peachpayments.com/v1/checkouts';
    this.apiUrl = config.sandbox
      ? 'https://test.peachpayments.com/v1'
      : 'https://api.peachpayments.com/v1';
  }

  getGatewayName(): string {
    return 'peach';
  }

  getSupportedMethods(): string[] {
    return ['card', 'instant_eft', 'masterpass', 'mobicred', 'ozow'];
  }

  private getAuthHeader(): string {
    return `Bearer ${this.peachConfig.password}`;
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData: PeachPaymentData = {
        entityId: this.peachConfig.entityId,
        amount: request.amount.toFixed(2),
        currency: request.currency,
        paymentType: 'DB',
        merchantTransactionId: request.reference,
        customer: {
          email: request.customer.email,
          givenName: request.customer.name.split(' ')[0],
          surname: request.customer.name.split(' ').slice(1).join(' ') || '',
          mobile: request.customer.phone,
        },
        billing: {
          street1: request.metadata?.address || '123 Medical Street',
          city: request.metadata?.city || 'Johannesburg',
          state: 'GP',
          country: 'ZA',
          postcode: request.metadata?.postcode || '2000',
        },
        customParameters: {
          shopperResultUrl: this.config.successUrl,
          [request.reference]: request.reference,
          patientId: request.metadata?.patientId || '',
          claimId: request.metadata?.claimId || '',
          practiceId: request.metadata?.practiceId || '',
        },
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.id && result.redirect?.url) {
        return {
          success: true,
          paymentId: request.reference,
          gatewayReference: result.id,
          redirectUrl: result.redirect.url,
          rawResponse: result,
        };
      }

      return {
        success: false,
        error: result.result?.description || 'Failed to initialize Peach Payments checkout',
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize Peach Payments payment',
      };
    }
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch(`${this.apiUrl}/checkouts/${gatewayReference}/payment`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const result = await response.json();

      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
        'success': 'completed',
        'pending': 'pending',
        'failed': 'failed',
        'cancelled': 'cancelled',
      };

      return {
        success: result.result?.code === '000.100.110' || result.result?.code === '000.100.111',
        status: statusMap[result.result?.code?.split('.')[2] || 'failed'] || 'failed',
        amount: parseFloat(result.amount || '0'),
        gatewayReference,
        paidAt: result.timestamp ? new Date(result.timestamp) : undefined,
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
      const response = await fetch(`${this.apiUrl}/payments/${request.paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: request.amount?.toFixed(2),
          merchantTransactionId: `refund_${Date.now()}`,
        }),
      });

      const result = await response.json();

      return {
        success: result.result?.code === '000.100.110',
        refundId: result.id,
        error: result.result?.description,
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
    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
      'success': 'completed',
      'pending': 'pending',
      'failed': 'failed',
      'cancelled': 'cancelled',
    };

    return {
      success: true,
      event: `payment_${payload.result?.code?.split('.')[2] || 'unknown'}`,
      data: {
        reference: payload.merchantTransactionId,
        gatewayReference: payload.id,
        amount: parseFloat(payload.amount || '0'),
        status: statusMap[payload.result?.code?.split('.')[2]] || 'pending',
        customerEmail: payload.customer?.email,
        rawPayload: payload,
      },
    };
  }
}