import { PaymentGateway, PaymentGatewayConfig, PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';
import crypto from 'crypto';

interface PayGateConfig extends PaymentGatewayConfig {
  merchantId: string;
  encryptionKey: string;
}

interface PayGatePaymentRequest {
  MERCHANT: string;
  TRANSACTION_DATE: string;
  TRANSACTION_TYPE: string;
  REFERENCE: string;
  AMOUNT: string;
  CURRENCY: string;
  RETURN_URL: string;
  NOTIFY_URL: string;
  CUSTOMER_EMAIL: string;
  CUSTOMER_NAME: string;
  CUSTOMER_PHONE?: string;
  CHECKSUM: string;
}

export class PayGateGateway extends PaymentGateway {
  private paygateConfig: PayGateConfig;
  private baseUrl: string;

  constructor(config: PayGateConfig) {
    super(config);
    this.paygateConfig = config;
    this.baseUrl = config.sandbox
      ? 'https://secure.paygate.co.za/payweb3/initiate.trans'
      : 'https://www.paygate.co.za/payweb3/initiate.trans';
  }

  getGatewayName(): string {
    return 'paygate';
  }

  getSupportedMethods(): string[] {
    return ['card', 'eft', 'masterpass', 'snapScan', 'zapper'];
  }

  private generateChecksum(data: Record<string, string>): string {
    const sortedKeys = Object.keys(data).sort();
    const checksumString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + `&ENCRYPTION_KEY=${this.paygateConfig.encryptionKey}`;
    
    return crypto.createHash('md5').update(checksumString).digest('hex').toUpperCase();
  }

  async initializePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const transactionDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const paymentData: Omit<PayGatePaymentRequest, 'CHECKSUM'> = {
        MERCHANT: this.paygateConfig.merchantId,
        TRANSACTION_DATE: transactionDate,
        TRANSACTION_TYPE: '1',
        REFERENCE: request.reference,
        AMOUNT: request.amount.toFixed(2),
        CURRENCY: request.currency,
        RETURN_URL: this.config.successUrl,
        NOTIFY_URL: this.config.webhookUrl,
        CUSTOMER_EMAIL: request.customer.email,
        CUSTOMER_NAME: request.customer.name,
        CUSTOMER_PHONE: request.customer.phone,
      };

      const checksum = this.generateChecksum(paymentData as Record<string, string>);
      const paymentDataWithChecksum = { ...paymentData, CHECKSUM: checksum };

      const formFields = Object.entries(paymentDataWithChecksum)
        .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
        .join('\n');

      const formHtml = `
        <form action="${this.baseUrl}" method="post" id="paygate-form">
          ${formFields}
        </form>
        <script>document.getElementById('paygate-form').submit();</script>
      `;

      return {
        success: true,
        paymentId: request.reference,
        redirectUrl: 'data:text/html;charset=utf-8,' + encodeURIComponent(formHtml),
        rawResponse: paymentDataWithChecksum,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to initialize PayGate payment',
      };
    }
  }

  async verifyPayment(gatewayReference: string): Promise<PaymentVerificationResult> {
    try {
      const queryData = {
        MERCHANT: this.paygateConfig.merchantId,
        REFERENCE: gatewayReference,
        TRANSACTION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      const checksum = this.generateChecksum(queryData);
      const queryDataWithChecksum = { ...queryData, CHECKSUM: checksum };

      const queryUrl = this.config.sandbox
        ? 'https://secure.paygate.co.za/payweb3/query.trans'
        : 'https://www.paygate.co.za/payweb3/query.trans';

      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(queryDataWithChecksum as Record<string, string>),
      });

      const text = await response.text();
      const result = this.parsePayGateResponse(text);

      const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
        '1': 'completed',
        '2': 'pending',
        '3': 'failed',
        '4': 'cancelled',
        '5': 'refunded',
      };

      return {
        success: result.TRANSACTION_STATUS === '1',
        status: statusMap[result.TRANSACTION_STATUS] || 'pending',
        amount: parseFloat(result.AMOUNT || '0'),
        gatewayReference,
        paidAt: result.TRANSACTION_DATE ? new Date(result.TRANSACTION_DATE) : undefined,
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

  private parsePayGateResponse(text: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = text.trim().split('\n');
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        result[key] = valueParts.join('=');
      }
    });
    
    return result;
  }

  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    return {
      success: false,
      error: 'Refunds must be processed manually through PayGate merchant dashboard',
    };
  }

  async handleWebhook(payload: any, signature?: string): Promise<{ success: boolean; event: string; data: any }> {
    const receivedChecksum = payload.CHECKSUM;
    const { CHECKSUM, ...data } = payload;
    
    const expectedChecksum = this.generateChecksum(data as Record<string, string>);
    
    if (receivedChecksum && receivedChecksum.toUpperCase() !== expectedChecksum.toUpperCase()) {
      return { success: false, event: 'invalid_signature', data: payload };
    }

    const statusMap: Record<string, 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'> = {
      '1': 'completed',
      '2': 'pending',
      '3': 'failed',
      '4': 'cancelled',
      '5': 'refunded',
    };

    return {
      success: true,
      event: `payment_${statusMap[payload.TRANSACTION_STATUS] || 'unknown'}`,
      data: {
        reference: payload.REFERENCE,
        gatewayReference: payload.REFERENCE,
        amount: parseFloat(payload.AMOUNT || '0'),
        status: statusMap[payload.TRANSACTION_STATUS] || 'pending',
        customerEmail: payload.CUSTOMER_EMAIL,
        rawPayload: payload,
      },
    };
  }
}