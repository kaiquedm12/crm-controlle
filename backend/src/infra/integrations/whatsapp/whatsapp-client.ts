type SendWhatsappInput = {
  phone: string;
  message: string;
};

type SendWhatsappResult = {
  success: boolean;
  providerStatus: string;
};

export async function sendWhatsappMessage(input: SendWhatsappInput): Promise<SendWhatsappResult> {
  const provider = process.env.WHATSAPP_PROVIDER ?? 'stub';

  if (provider === 'stub') {
    console.log('[WHATSAPP_STUB] Sending message', input);
    return {
      success: true,
      providerStatus: 'stub_sent',
    };
  }

  return {
    success: true,
    providerStatus: 'sent',
  };
}
