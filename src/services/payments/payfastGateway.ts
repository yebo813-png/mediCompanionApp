import { PaymentGateway, PaymentGatewayConfig, PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';
import crypto from 'crypto';

interface PayFastConfig extends PaymentGatewayConfig {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
}

interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  cell_number?: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
}

export class PayFastGateway extends PaymentGateway {
  private payfastConfig: PayFastConfig;
  private baseUrl: string;

  constructor(config: PayFastConfig) {
    super(config);
    this.payfastConfig = config;
    this.baseUrl = config.sandbox 
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';
  }

  getGatewayName(): string {
    return 'payfast';
  }

  getSupportedMethods(): string[] {
    return ['card', 'eft', 'masterpass', 'instant_eft'];
  }

  private generateSignature(data: Record<string, string>): string {
    const sortedKeys = Object.keys(data).sort();
    const pfData = sortedKeys.map(key => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`).join('&');
    
    if (this.payfastConfig.passphrase) {
      return crypto
        .createHmac('md5', this.payfastConfig.passphrase)
        .update(pfData)
        .digest('hex');
    }
    
    return crypto.createHash('md5').update(pfData).digest('hex');
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const paymentData: PayFastPaymentData = {
        merchant_id: this.payfastConfig.merchantId,
        merchant_key: this.payfastConfig.merchantKey,
        return_url: this.config.successUrl,
        cancel_url: this.config.cancelUrl,
        notify_url: this.config.webhookUrl,
        name_first: request.customer.name.split(' ')[0],
        name_last: request.customer.name.split(' ').slice(1).join(' ') || '',
        email_address: request.customer.email,
        cell_number: request.customer.phone,
        amount: request.amount.toFixed(2),
        item_name: request.description,
        item_description: request.metadata?.description,
        custom_str1: request.reference,
        custom_str2: request.metadata?.patientId || '',
        custom_str3: request.metadata?.claimId || '',
        custom_str4: request.metadata?.practiceId || '',
        custom_str5: JSON.stringify(request.metadata || {}),
      };

      const signature = this.generateSignature(paymentData as Record<string, string>);
      const paymentDataWithSignature = { ...paymentData, signature };

      const formFields = Object.entries(paymentDataWithSignature)
        .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
        .join('\n');

      const formHtml = `
        <form action="${this.baseUrl}" method="post" id="payfast-form">
          ${formFields}
        </form>
        <script>document.getElementById('payfast-form').submit();</script>
      `;

      return {
        success: true,
        paymentId: request.reference,
        redirectUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(formHtml),
        rawResponse: paymentDataWithSignature,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize PayFast payment',
      };
    }
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult> {
    try {
      const verifyUrl = this.payfastConfig.sandbox
        ? 'https://sandbox.payfast.co.za/eng/query/validate'
        : 'https://www.payfast.co.za/eng/query/validate';

      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          merchant_id: this.payfastConfig.merchantId,
          merchant_key: this.payfastConfig.merchantKey,
          pf_payment_id: gatewayReference,
        }),
      });

      const text = await response.text();
      const lines = text.trim().split('\n');
      const result: Record<string, string> = {};
      
      lines.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) result[key] = value;
      });

      const isValid = result['pf_payment_status'] === 'COMPLETE';
      
      return {
        success: isValid,
        status: isValid ? 'completed' : 'failed',
        amount: parseFloat(result['amount_gross'] || '0'),
        gatewayReference,
        paidAt: result['payment_date'] ? new Date(result['payment_date']) : undefined,
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
      error: 'Refunds must be processed manually through PayFast merchant dashboard',
    };
  }

  async handleWebhook(payload: any, signature?: string): Promise<{ success: boolean; event: string; data: any }> {
    const expectedSignature = this.generateSignature(payload);
    
    if (signature && signature !== expectedSignature) {
      return { success: false, event: 'invalid_signature', data: payload };
    }

    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
      'COMPLETE': 'completed',
      'PENDING': 'pending',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded',
    };

    return {
      success: true,
      event: `payment_${payload.pf_payment_status?.toLowerCase() || 'unknown'}`,
      data: {
        reference: payload.custom_str1,
        gatewayReference: payload.pf_payment_id,
        amount: parseFloat(payload.amount_gross || '0'),
        status: statusMap[payload.pf_payment_status] || 'pending',
        customerEmail: payload.email_address,
        rawPayload: payload,
      },
    };
  }
}