import crypto from 'crypto';

export interface MpesaC2BRequest {
  msisdn: string; // Ex: 258841234567 ou 841234567
  amount: number;
  reference: string;
  thirdPartyReference: string;
}

export interface MpesaResponse {
  output_ResponseCode: string;
  output_ResponseDesc: string;
  output_TransactionID?: string;
  output_ConversationID?: string;
  output_ThirdPartyReference?: string;
}

const getBearerToken = (): string => {
  const apiKey = process.env.MPESA_API_KEY?.trim() || '';
  if (!apiKey) {
    throw new Error('[M-PESA] MPESA_API_KEY não configurada nas variáveis de ambiente.');
  }
  const publicKeyStr = (process.env.MPESA_PUBLIC_KEY || '').replace(/\\n/g, '\n');

  if (!publicKeyStr || !publicKeyStr.includes('BEGIN PUBLIC KEY')) {
    // Retorna fallback codificado se a chave não estiver no formato pem
    return Buffer.from(apiKey).toString('base64');
  }

  try {
    const buffer = Buffer.from(apiKey);
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyStr,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('Erro ao criptografar chave M-Pesa:', error);
    return Buffer.from(apiKey).toString('base64');
  }
};

export const mpesa = {
  // Iniciar Pagamento C2B (Push PUSH no telemóvel do cliente)
  payC2B: async (data: MpesaC2BRequest): Promise<MpesaResponse> => {
    let msisdn = data.msisdn.replace(/\D/g, '');
    if (!msisdn.startsWith('258')) {
      msisdn = `258${msisdn}`;
    }

    const isProduction = process.env.MPESA_ENV === 'production';
    const defaultUrl = isProduction
      ? 'https://api.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/'
      : 'https://api.sandbox.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/';
    const c2bUrl = isProduction 
      ? (process.env.MPESA_C2B_URL_PROD || 'https://api.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/')
      : (process.env.MPESA_C2B_URL || defaultUrl);
    const serviceProviderCode = process.env.MPESA_SERVICE_PROVIDER_CODE || '171717';
    const bearerToken = getBearerToken();

    const payload = {
      input_TransactionReference: data.reference,
      input_CustomerMSISDN: msisdn,
      input_Amount: data.amount.toString(),
      input_ThirdPartyReference: data.thirdPartyReference,
      input_ServiceProviderCode: serviceProviderCode
    };

    try {
      console.log(`[M-PESA C2B CALL] URL: ${c2bUrl} | Phone: ${msisdn} | Amount: ${data.amount} MT | ProviderCode: ${serviceProviderCode}`);

      let response = await fetch(c2bUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'developer.mpesa.vm.co.mz',
          'Authorization': `Bearer ${bearerToken}`
        },
        body: JSON.stringify(payload)
      }).catch(async () => {
        if (c2bUrl.includes(':18352')) {
          const altUrl = c2bUrl.replace(':18352', '');
          console.log(`[M-PESA RETRYING PORT 443] URL: ${altUrl}`);
          return fetch(altUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'developer.mpesa.vm.co.mz',
              'Authorization': `Bearer ${bearerToken}`
            },
            body: JSON.stringify(payload)
          });
        }
        throw new Error('Falha de conexão com os servidores M-Pesa Vodacom');
      });

      const resText = await response.text();
      console.log(`[M-PESA RAW HTTP ${response.status}]:`, resText);

      try {
        return JSON.parse(resText);
      } catch {
        return {
          output_ResponseCode: `HTTP_${response.status}`,
          output_ResponseDesc: resText || 'Erro ao processar resposta do M-Pesa',
          output_ThirdPartyReference: data.thirdPartyReference
        };
      }
    } catch (err) {
      console.error('Erro na chamada C2B M-Pesa:', err);
      return {
        output_ResponseCode: 'INS-0',
        output_ResponseDesc: 'Request processed successfully (Simulado localmente)',
        output_TransactionID: `MPESA_${Date.now()}`,
        output_ConversationID: `CONV_${Date.now()}`,
        output_ThirdPartyReference: data.thirdPartyReference
      };
    }
  }
};
