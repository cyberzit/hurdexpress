// SMS provider abstraction — провайдер солих боломжтой бүтэц.
// Бодит API key зөвхөн энд (Functions runtime) ашиглагдана.

export interface SmsConfig {
  enabled: boolean;
  provider: "mock" | "custom";
  apiUrl?: string;
  apiKey?: string;
}

export interface SmsResult {
  success: boolean;
  provider: string;
  error?: string;
}

// Провайдерын дагуу SMS илгээх. Шинэ провайдер нэмэхэд энд case нэмнэ.
export async function sendSms(
  phone: string,
  message: string,
  config: SmsConfig,
): Promise<SmsResult> {
  if (config.provider === "custom" && config.apiUrl) {
    try {
      const res = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({ phone, message }),
      });
      if (!res.ok) {
        return { success: false, provider: "custom", error: `HTTP ${res.status}` };
      }
      return { success: true, provider: "custom" };
    } catch (e) {
      return {
        success: false,
        provider: "custom",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  // mock — console.log (дараа custom руу амар солино).
  console.log(`[SMS mock] → ${phone}: ${message}`);
  return { success: true, provider: "mock" };
}
