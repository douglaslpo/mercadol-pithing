import crypto from 'crypto';

/**
 * Gera assinatura Shopee v2:
 * base = partner_id + api_path + timestamp + access_token? + shop_id?
 */
export function shopeeSign({
  partnerId,
  partnerKey,
  apiPath,        // ex: "/api/v2/order/get_order_detail"
  timestamp,      // Math.floor(Date.now()/1000)
  accessToken,    // opcional (para rotas shop-level)
  shopId          // opcional
}: {
  partnerId: string;
  partnerKey: string;
  apiPath: string;
  timestamp: number;
  accessToken?: string;
  shopId?: string;
}): string {
  const base = accessToken && shopId
    ? `${partnerId}${apiPath}${timestamp}${accessToken}${shopId}`
    : `${partnerId}${apiPath}${timestamp}`;
  
  return crypto.createHmac('sha256', partnerKey).update(base).digest('hex');
}

/**
 * Cria headers para requisição Shopee v2
 */
export function createShopeeHeaders({
  partnerId,
  partnerKey,
  apiPath,
  accessToken,
  shopId
}: {
  partnerId: string;
  partnerKey: string;
  apiPath: string;
  accessToken?: string;
  shopId?: string;
}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = shopeeSign({
    partnerId,
    partnerKey,
    apiPath,
    timestamp,
    accessToken,
    shopId
  });

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || ''}`,
    'X-Shopee-Partner-Id': partnerId,
    'X-Shopee-Timestamp': timestamp.toString(),
    'X-Shopee-Signature': signature,
    ...(shopId && { 'X-Shopee-Shop-Id': shopId })
  };
}
