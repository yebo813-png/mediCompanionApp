import { PaymentGateway, PaymentGatewayConfig, PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';
import crypto from 'crypto';

interface OzowConfig extends PaymentGatewayConfig {
  siteCode: string;
  privateKey: string;
  publicKey: string;
}

interface OzowPaymentRequest {
  SiteCode: string;
  CountryCode: string;
  CurrencyCode: string;
  Amount: string;
  TransactionReference: string;
  Customer: {
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber?: string;
  };
  IsTest: boolean;
  SuccessUrl: string;
  CancelUrl: string;
  ErrorUrl: string;
  NotifyUrl: string;
  Items: Array<{
    Name: string;
    Description?: string;
    Quantity: number;
    Price: string;
  }>;
}

export class OzowGateway extends PaymentGateway {
  private ozowConfig: OzowConfig;
  private baseUrl: string;

  constructor(config: OzowConfig) {
    super(config);
    this.ozowConfig = config;
    this.baseUrl = config.sandbox
      ? 'https://staging.ozow.com'
      : 'https://api.ozow.com';
  }

  getGatewayName(): string {
    return 'ozow';
  }

  getSupportedMethods(): string[] {
    return ['instant_eft', 'ozow_eft'];
  }

  private generateHash(data: Record<string, any>): string {
    const sortedKeys = Object.keys(data).sort();
    const hashString = sortedKeys
      .filter(key => data[key] !== null && data[key] !== undefined && data[key] !== '')
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha512', this.ozowConfig.privateKey)
      .update(hashString)
      .digest('hex')
      .toUpperCase();
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData: OzowPaymentRequest = {
        SiteCode: this.ozowConfig.siteCode,
        CountryCode: 'ZA',
        CurrencyCode: request.currency,
        Amount: request.amount.toFixed(2),
        TransactionReference: request.reference,
        Customer: {
          FirstName: request.customer.name.split(' ')[0],
          LastName: request.customer.name.split(' ').slice(1).join(' ') || '',
          Email: request.customer.email,
          PhoneNumber: request.customer.phone,
        },
        IsTest: this.config.sandbox,
        SuccessUrl: this.config.successUrl,
        CancelUrl: this.config.cancelUrl,
        ErrorUrl: this.config.cancelUrl,
        NotifyUrl: this.config.webhookUrl,
        Items: [{
          Name: request.description,
          Description: request.metadata?.description,
          Quantity: 1,
          Price: request.amount.toFixed(2),
        }],
      };

      const hash = this.generateHash(paymentData as Record<string, any>);
      const paymentDataWithHash = { ...paymentData, HashCheck: hash };

      const response = await fetch(`${this.baseUrl}/PostPaymentRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(paymentDataWithHash),
      });

      const result = await response.json();

      if (result.IsSuccessful && result.Url) {
        return {
          success: true,
          paymentId: request.reference,
          gatewayReference: result.TransactionReference,
          redirectUrl: result.Url,
          rawResponse: result,
        };
      }

      return {
        success: false,
        error: result.ErrorMessage || 'Failed to initialize Ozow payment',
        rawResponse: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize Ozow payment',
      };
    }
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult> {
    try {
      const queryData = {
        SiteCode: this.ozowConfig.siteCode,
        TransactionReference: gatewayReference,
        IsTest: this.config.sandbox,
      };

      const hash = this.generateHash(queryData);
      const queryDataWithHash = { ...queryData, HashCheck: hash };

      const response = await fetch(`${this.baseUrl}/GetTransaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(queryDataWithHash),
      });

      const result = await response.json();

      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
        'Complete': 'completed',
        'Pending': 'pending',
        'Failed': 'failed',
        'Cancelled': 'cancelled',
        'Refunded': 'refunded',
      };

      return {
        success: result.Status === 'Complete',
        status: statusMap[result.Status] || 'pending',
        amount: parseFloat(result.Amount || '0'),
        gatewayReference,
        paidAt: result.DateCompleted ? new Date(result.DateCompleted) : undefined,
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
    return {
      success: false,
      error: 'Refunds must be processed manually through Ozow merchant dashboard',
    };
  }

  async handleWebhook(payload: any, signature?: string): Promise<{ success: boolean; event: string; data: any }> {
    if (payload.HashCheck) {
      const { HashCheck, ...data } = payload;
      const expectedHash = this.generateHash(data);
      
      if (HashCheck.toUpperCase() !== expectedHash.toUpperCase()) {
        return { success: false, event: 'invalid_signature', data: payload };
      }
    }

    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
      'Complete': 'completed',
      'Pending': 'pending',
      'Failed': 'failed',
      'Cancelled': 'cancelled',
      'Refunded': 'refunded',
    };

    return {
      success: true,
      event: `payment_${payload.Status?.toLowerCase() || 'unknown'}`,
      data: {
        reference: payload.TransactionReference,
        gatewayReference: payload.TransactionReference,
        amount: parseFloat(payload.Amount || '0'),
        status: statusMap[payload.Status] || 'pending',
        customerEmail: payload.Customer?.Email,
        rawPayload: payload,
      },
    };
  }
}