import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { X, Send, Bot, Lock, RefreshCw, Settings } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import { addDoc, collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { geminiAI } from '@/lib/geminiAI';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
}

interface ChatbotAIProps {
  vendorId?: string;
  apiKey?: string;
}

const ChatbotAI = ({ vendorId, apiKey }: ChatbotAIProps) => {
  const { t, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingPasscode, setTrainingPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [botResponses, setBotResponses] = useState<Record<string, string>>({});
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default knowledge base for fallback
  const defaultKnowledgeBase = {
    en: {
      greeting: "Hello! I'm SokoCamp AI assistant. How can I help you today?",
      help: "I can help with: \n- Product inquiries\n- Order status\n- Vendor information\n- Marketplace policies\n- Account issues\n\nWhat do you need help with?",
      default: "I'm not sure I understand. Could you rephrase your question? Here are things I can help with:\n- Products\n- Vendors\n- Orders\n- Delivery\n- Payments\n- Returns\n\nFor further assistance, please email us at sokocamp@gmail.com"
    },
    sw: {
      greeting: "Habari! Mimi ni msaidizi wa SokoCamp AI. Ninaweza kukusaidia vipi leo?",
      help: "Naweza kusaidia kuhusu: \n- Maswali ya bidhaa\n- Hali ya maagizo\n- Taarifa za wauzaji\n- Sera ya soko\n- Matatizo ya akaunti\n\nUnahitaji msaada gani?",
      default: "Sielewi vizuri. Unaweza kueleza tena swali lako? Hizi ni mambo ninayoweza kusaidia:\n- Bidhaa\n- Wauzaji\n- Maagizo\n- Uwasilishaji\n- Malipo\n- Rudisho\n\nKwa msaada zaidi, tafadhali tutumie barua pepe sokocamp@gmail.com"
    }
  };

  // Check if AI is configured on component mount
  useEffect(() => {
    const checkAIConfiguration = () => {
      const isConfigured = geminiAI.isConfigured() || !!apiKey;
      setAiEnabled(isConfigured);
      
      if (!isConfigured) {
        console.log('Gemini AI not configured. Falling back to rule-based responses.');
      }
    };

    checkAIConfiguration();
  }, [apiKey]);

  // Load bot responses from Firebase
  useEffect(() => {
    const loadBotResponses = async () => {
      try {
        const botDoc = await getDoc(doc(db, 'chatbot', 'knowledge'));
        if (botDoc.exists()) {
          const data = botDoc.data();
          if (data.responses) {
            setBotResponses(data.responses);
          }
        }
      } catch (error) {
        console.error('Error loading bot responses:', error);
      }
    };

    if (isOpen) {
      loadBotResponses();
      
      // Initialize chat with greeting if empty
      if (messages.length === 0) {
        const greeting = currentLanguage === 'sw' ? 
          defaultKnowledgeBase.sw.greeting : 
          defaultKnowledgeBase.en.greeting;
        
        setMessages([{
          id: Date.now().toString(),
          text: greeting,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, currentLanguage]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    const message = currentLanguage === 'sw' ? 
      "Mazungumzo yamefutwa" : 
      "Chat cleared";
    toast.success(message);
  };

  const addMessage = (text: string, sender: 'user' | 'bot' | 'system') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const forwardToVendor = async (question: string) => {
    try {
      if (!vendorId) {
        console.log('No vendor ID provided, cannot forward question');
        return;
      }
      
      await addDoc(collection(db, 'messages'), {
        senderId: 'chatbot',
        senderName: 'Chatbot System',
        recipientId: vendorId,
        content: currentLanguage === 'sw' ? 
          `Swali lisilojibiwa: "${question}"` : 
          `Unanswered question: "${question}"`,
        read: false,
        createdAt: new Date(),
        type: 'unanswered_question'
      });
      
      const message = currentLanguage === 'sw' ?
        "Swali limesafirishwa kwa msaada wa ziada" :
        "Question forwarded for additional support";
      
      addMessage(message, 'system');
      console.log('Question forwarded to vendor:', question);
    } catch (error) {
      console.error('Error forwarding question:', error);
      const message = currentLanguage === 'sw' ?
        "Hitilafu katika kusafirisha swali" :
        "Error forwarding question";
      toast.error(message);
    }
  };

  const trainBot = async (question: string, answer: string) => {
    try {
      const newResponses = {
        ...botResponses,
        [question.toLowerCase()]: answer
      };

      await setDoc(doc(db, 'chatbot', 'knowledge'), {
        responses: newResponses,
        language: currentLanguage,
        lastTrained: new Date()
      }, { merge: true });

      setBotResponses(newResponses);

      const message = currentLanguage === 'sw' ?
        `Nimejifunza: "${question}" -> "${answer}"` :
        `Learned: "${question}" -> "${answer}"`;
      
      addMessage(message, 'system');
      toast.success(currentLanguage === 'sw' ? 'Mafunzo yamefanikiwa' : 'Training successful');
    } catch (error) {
      console.error('Error training bot:', error);
      toast.error(currentLanguage === 'sw' ? 'Hitilafu katika mafunzo' : 'Training failed');
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    addMessage(inputMessage, 'user');
    const userInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      if (isTraining) {
        if (trainingPasscode === '1212') {
          if (userInput.includes('||')) {
            const [question, answer] = userInput.split('||').map(s => s.trim());
            await trainBot(question, answer);
          } else {
            const message = currentLanguage === 'sw' ?
              "Tumia muundo: swali || jibu" :
              "Use format: question || answer";
            addMessage(message, 'system');
          }
        } else {
          const message = currentLanguage === 'sw' ?
            "Nambari ya siri si sahihi" :
            "Incorrect passcode";
          addMessage(message, 'system');
          setIsTraining(false);
        }
        setTrainingPasscode('');
      } else {
        const response = await generateResponse(userInput);
        addMessage(response, 'bot');
        
        // Check if this was a default response and forward if needed
        const defaultResponse = currentLanguage === 'sw' ? 
          defaultKnowledgeBase.sw.default : 
          defaultKnowledgeBase.en.default;
        
        if (response === defaultResponse && !aiEnabled) {
          await forwardToVendor(userInput);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage(
        currentLanguage === 'sw' ? 
          "Samahani, kuna hitilafu. Tafadhali jaribu tena." : 
          "Sorry, an error occurred. Please try again.",
        'bot'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = async (userInput: string): Promise<string> => {
    const lang = currentLanguage === 'sw' ? 'sw' : 'en';
    const input = userInput.toLowerCase();
    
    // 1. Check for exact match in Firebase responses first
    if (botResponses[input]) {
      return botResponses[input];
    }
    
    // 2. Check for partial matches in Firebase responses
    const partialMatch = Object.entries(botResponses).find(([key]) => 
      input.includes(key.toLowerCase())
    );
    
    if (partialMatch) {
      return partialMatch[1];
    }
    
    // 3. Use AI if enabled and configured
    if (aiEnabled) {
      try {
        // Create context from stored responses
        const context = Object.entries(botResponses)
          .map(([q, a]) => `Q: ${q} A: ${a}`)
          .join('\n');
        
        const aiResponse = await geminiAI.generateResponse(userInput, context, lang);
        return aiResponse;
      } catch (error) {
        console.error('AI response failed:', error);
        // Fall back to rule-based response
      }
    }
    
    // 4. Rule-based fallback responses
    if (input.includes('help') || input.includes('msaada')) {
      return defaultKnowledgeBase[lang].help;
    }
    
    // 5. Default response
    return defaultKnowledgeBase[lang].default;
  };

  const handleTrainBot = () => {
    const passcodeInput = prompt(
      currentLanguage === 'sw' ? 
        "Weka nambari ya siri ya mafunzo:" : 
        "Enter training passcode:"
    );
    
    if (passcodeInput) {
      setTrainingPasscode(passcodeInput);
      setIsTraining(true);
      const message = currentLanguage === 'sw' ?
        "Hali ya mafunzo imeanzishwa. Tumia muundo: swali || jibu" :
        "Training mode activated. Use format: question || answer";
      addMessage(message, 'system');
    }
  };

  const handleApiKeySubmit = () => {
    if (tempApiKey.trim()) {
      // You would typically save this securely
      localStorage.setItem('gemini_api_key', tempApiKey);
      setAiEnabled(true);
      setShowApiKeyInput(false);
      setTempApiKey('');
      toast.success('AI enabled successfully!');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <Card className="w-full max-w-sm h-[500px] flex flex-col bg-background shadow-lg rounded-lg overflow-hidden">
          {/* Chat header */}
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.ibb.co/svhPXXWV/Chat-GPT-Image-May-13-2025-12-00-01-AM-removebg-preview.png" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">SokoCamp {aiEnabled ? 'AI' : ''} {t('common.assistant')}</h3>
                {aiEnabled && (
                  <span className="text-xs opacity-80">AI Powered</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!aiEnabled && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  title="Configure AI"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={handleTrainBot}
                title={currentLanguage === 'sw' ? "Fanya mafunzo" : "Train bot"}
              >
                <Lock className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={clearChat}
                title={currentLanguage === 'sw' ? "Futa mazungumzo" : "Clear chat"}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* API Key Input */}
          {showApiKeyInput && (
            <div className="p-3 bg-muted border-b">
              <p className="text-xs mb-2">Enter your Gemini API key to enable AI:</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Your Gemini API key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleApiKeySubmit}>
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
              </p>
            </div>
          )}

          {/* Messages container */}
          <div className="flex-1 p-4 overflow-y-auto">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                    message.sender === 'user' ? 
                      'bg-primary text-primary-foreground' : 
                      message.sender === 'bot' ? 
                        'bg-muted' : 
                        'bg-accent text-accent-foreground'
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {message.sender === 'system' && ' (System)'}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-3 bg-background">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={
                  isTraining ? 
                    (currentLanguage === 'sw' ? "swali || jibu" : "question || answer") : 
                    (currentLanguage === 'sw' ? "Andika ujumbe..." : "Type your message...")
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isTraining && (
              <p className="text-xs text-muted-foreground mt-2">
                {currentLanguage === 'sw' ? 
                  "Hali ya mafunzo. Kukonyeza X kushoto kuondoa" : 
                  "Training mode. Click X on left to exit"}
              </p>
            )}
            {!aiEnabled && (
              <p className="text-xs text-muted-foreground mt-2">
                AI disabled - using rule-based responses
              </p>
            )}
          </div>
        </Card>
      ) : (
        <Button 
          className="rounded-full w-14 h-14 p-0 hover:scale-105 transition-transform shadow-lg bg-primary text-white"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default ChatbotAI;