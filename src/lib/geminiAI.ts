import { GoogleGenerativeAI } from '@google/generative-ai';

// Prefer secure storage. In this app, we also support a localStorage fallback set via the Chatbot settings.
const getApiKey = (): string => {
  const fromLocalStorage = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
  const fromEnv = (import.meta?.env?.VITE_GEMINI_API_KEY as string | undefined) || undefined;
  return (fromLocalStorage || fromEnv || '').trim();
};

class GeminiAIService {
  constructor() {
    const key = getApiKey();
    if (!key) {
      console.warn('Gemini API key not found. Enter it in Chatbot settings or set VITE_GEMINI_API_KEY.');
    }
  }

  async generateResponse(prompt: string, context: string = '', language: 'en' | 'sw' = 'en'): Promise<string> {
    try {
      // Create a system prompt for the SokoCamp assistant
      const systemPrompt = language === 'sw' ? 
        `Wewe ni msaidizi wa SokoCamp, soko la kitandao. Unasaidia wateja kuhusu:
        - Maswali ya bidhaa
        - Hali ya maagizo
        - Taarifa za wauzaji
        - Sera za soko
        - Matatizo ya akaunti
        - Ununuzi na malipo
        - Uwasilishaji
        - Rudisho na ubadilishaji

        Jibu kwa ufupi, kwa urafiki, na kwa msaada. Kama hujaelewa swali, omba mtu aeleze zaidi.
        Kama swali halihusu SokoCamp, elekeza mtu aongee na timu yetu ya msaada kwa sokocamp@gmail.com

        Context: ${context}
        Swali la mtumiaji: ${prompt}` :
        
        `You are SokoCamp assistant, a marketplace platform. You help customers with:
        - Product inquiries
        - Order status
        - Vendor information
        - Marketplace policies
        - Account issues
        - Shopping and payments
        - Delivery
        - Returns and exchanges

        Respond briefly, friendly, and helpfully. If you don't understand a question, ask for clarification.
        If the question is not related to SokoCamp, direct them to contact our support team at sokocamp@gmail.com

        Context: ${context}
        User question: ${prompt}`;

      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error('MISSING_API_KEY');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback response based on language
      if (language === 'sw') {
        return "Samahani, nina matatizo ya kutoa jibu. Tafadhali jaribu tena au tupigie simu kwa sokocamp@gmail.com";
      } else {
        return "Sorry, I'm having trouble generating a response. Please try again or contact us at sokocamp@gmail.com";
      }
    }
  }

  isConfigured(): boolean {
    return !!getApiKey();
  }
}

export const geminiAI = new GeminiAIService();