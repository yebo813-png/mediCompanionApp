import { PaymentGatewayFactory } from './baseGateway';
import { PayFastGateway } from './payfastGateway';
import { PeachPaymentsGateway } from './peachGateway';
import { YocoGateway } from './yocoGateway';
import { OzowGateway } from './ozowGateway';
import { PayGateGateway } from './paygateGateway';
import { NetcashGateway } from './netcashGateway';

export function initializePaymentGateways() {
  const sandbox = import.meta.env.VITE_PAYMENT_SANDBOX === 'true' || import.meta.env.DEV;

  const commonConfig = {
    sandbox,
    successUrl: import.meta.env.VITE_PAYMENT_SUCCESS_URL || `${window.location.origin}/payment/success`,
    cancelUrl: import.meta.env.VITE_PAYMENT_CANCEL_URL || `${window.location.origin}/payment/cancel`,
    webhookUrl: import.meta.env.VITE_PAYMENT_WEBHOOK_URL || `${window.location.origin}/api/payments/webhook`,
  };

  if (import.meta.env.VITE_PAYFAST_MERCHANT_ID && import.meta.env.VITE_PAYFAST_MERCHANT_KEY) {
    PaymentGatewayFactory.register(new PayFastGateway({
      ...commonConfig,
      merchantId: import.meta.env.VITE_PAYFAST_MERCHANT_ID,
      merchantKey: import.meta.env.VITE_PAYFAST_MERCHANT_KEY,
      passphrase: import.meta.env.VITE_PAYFAST_PASSPHRASE || '',
    }));
  }

  if (import.meta.env.VITE_PEACH_PAYMENTS_ENTITY_ID && import.meta.env.VITE_PEACH_PAYMENTS_PASSWORD) {
    PaymentGatewayFactory.register(new PeachPaymentsGateway({
      ...commonConfig,
      entityId: import.meta.env.VITE_PEACH_PAYMENTS_ENTITY_ID,
      password: import.meta.env.VITE_PEACH_PAYMENTS_PASSWORD,
    }));
  }

  if (import.meta.env.VITE_YOCO_SECRET_KEY && import.meta.env.VITE_YOCO_PUBLIC_KEY) {
    PaymentGatewayFactory.register(new YocoGateway({
      ...commonConfig,
      secretKey: import.meta.env.VITE_YOCO_SECRET_KEY,
      publicKey: import.meta.env.VITE_YOCO_PUBLIC_KEY,
    }));
  }

  if (import.meta.env.VITE_OZOW_SITE_CODE && import.meta.env.VITE_OZOW_PRIVATE_KEY) {
    PaymentGatewayFactory.register(new OzowGateway({
      ...commonConfig,
      siteCode: import.meta.env.VITE_OZOW_SITE_CODE,
      privateKey: import.meta.env.VITE_OZOW_PRIVATE_KEY,
      publicKey: import.meta.env.VITE_OZOW_PUBLIC_KEY || '',
    }));
  }

  if (import.meta.env.VITE_PAYGATE_MERCHANT_ID && import.meta.env.VITE_PAYGATE_ENCRYPTION_KEY) {
    PaymentGatewayFactory.register(new PayGateGateway({
      ...commonConfig,
      merchantId: import.meta.env.VITE_PAYGATE_MERCHANT_ID,
      encryptionKey: import.meta.env.VITE_PAYGATE_ENCRYPTION_KEY,
    }));
  }

  if (import.meta.env.VITE_NETCASH_MERCHANT_ID && import.meta.env.VITE_NETCASH_API_KEY) {
    PaymentGatewayFactory.register(new NetcashGateway({
      ...commonConfig,
      merchantId: import.meta.env.VITE_NETCASH_MERCHANT_ID,
      apiKey: import.meta.env.VITE_NETCASH_API_KEY,
    }));
  }

  console.log('Initialized payment gateways:', PaymentGatewayFactory.getSupportedGateways());
}

export { PaymentGatewayFactory } from './baseGateway';
export type { PaymentRequest, PaymentResponse, PaymentVerificationResult, RefundRequest, RefundResponse } from './baseGateway';