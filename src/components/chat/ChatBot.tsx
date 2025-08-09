import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, X, Send, Lock, RefreshCw, Flag } from 'lucide-react';
import { addDoc, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  timestamp: Date;
};

const defaultCommonQuestions = [
  "How do I add a product?",
  "How to update order status?",
  "Where can I see my messages?",
  "How to check my earnings?",
  "What should I do if an order is stuck?"
];

const defaultBotResponses: Record<string, string> = {
  "add product": "Click the 'Add Product' button at the top right, fill in the details, and submit the form.",
  "update order": "Go to the Orders tab, find the order, and use the status buttons to update it.",
  "messages": "All your messages are in the Inbox tab. Unread messages have a blue indicator.",
  "earnings": "Your monthly revenue is shown in the analytics tab and dashboard cards.",
  "stuck order": "Contact support at 0775 769 177 if an order hasn't progressed in 48 hours.",
  "default": "I'm here to help with your vendor dashboard. Ask about orders, products, or messages."
};

export const ChatBot = ({ vendorId }: { vendorId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [trainingMode, setTrainingMode] = useState(false);
  const [trainingCode, setTrainingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState(defaultCommonQuestions);
  const [botResponses, setBotResponses] = useState(defaultBotResponses);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial bot knowledge from Firebase
  useEffect(() => {
    const loadBotKnowledge = async () => {
      try {
        const botDoc = await getDoc(doc(db, 'chatbot', 'knowledge'));
        if (botDoc.exists()) {
          const data = botDoc.data();
          if (data.commonQuestions) setCommonQuestions(data.commonQuestions);
          if (data.botResponses) setBotResponses(data.botResponses);
        }
      } catch (error) {
        console.error("Error loading bot knowledge:", error);
      }
    };

    if (isOpen) loadBotKnowledge();
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    toast.success('Chat cleared');
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    addMessage(inputValue, 'user');
    setInputValue('');
    setIsLoading(true);

    try {
      const lowerInput = inputValue.toLowerCase();
      
      if (trainingMode) {
        if (trainingCode === "1212") {
          if (lowerInput.includes("||")) {
            const [question, answer] = inputValue.split("||").map(s => s.trim());
            await trainBot(question, answer);
            addMessage(`Learned: When asked "${question}", I'll respond "${answer}"`, 'system');
          } else {
            addMessage("Please use format: question || answer", 'system');
          }
        } else {
          addMessage("Invalid training code", 'system');
          setTrainingMode(false);
        }
        setTrainingCode('');
      } else {
        let response = botResponses[lowerInput] || 
          Object.entries(botResponses).find(([key]) => lowerInput.includes(key))?.[1] || 
          "I'm not sure how to answer that. This question has been forwarded to support.";

        if (response === "I'm not sure how to answer that. This question has been forwarded to support.") {
          await forwardToVendor(inputValue);
        }

        addMessage(response, 'bot');
      }
    } catch (error) {
      console.error("Error processing message:", error);
      addMessage("Sorry, something went wrong. Please try again.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  const forwardToVendor = async (question: string) => {
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: 'chatbot',
        senderName: 'Chatbot System',
        recipientId: vendorId,
        content: `Unanswered question: "${question}"`,
        read: false,
        createdAt: new Date(),
        type: 'unanswered_question'
      });
      console.log("Question forwarded to vendor");
    } catch (error) {
      console.error("Error forwarding question:", error);
      toast.error("Failed to forward question");
    }
  };

  const trainBot = async (question: string, answer: string) => {
    try {
      const newResponses = {
        ...botResponses,
        [question.toLowerCase()]: answer
      };

      setBotResponses(newResponses);
      
      await setDoc(doc(db, 'chatbot', 'knowledge'), {
        botResponses: newResponses,
        lastTrained: new Date()
      }, { merge: true });

      toast.success("Bot knowledge updated");
    } catch (error) {
      console.error("Error training bot:", error);
      toast.error("Failed to train bot");
    }
  };

  const enableTrainingMode = () => {
    addMessage("Enter training code:", 'system');
    setTrainingMode(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-[500px] bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="p-3 border-b flex justify-between items-center bg-primary text-primary-foreground">
            <h3 className="font-semibold">Vendor Support</h3>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={enableTrainingMode}
                className="text-primary-foreground hover:bg-primary/80"
                title="Train bot (Admin only)"
              >
                <Lock className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearChat}
                className="text-primary-foreground hover:bg-primary/80"
                title="Clear chat"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary/80"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.sender === 'bot'
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-accent text-accent-foreground'
                  }`}
                >
                  {message.text}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {message.sender === 'system' && ' (System)'}
                </p>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-3">
                <div className="inline-block px-3 py-2 rounded-lg bg-secondary text-secondary-foreground">
                  Typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="p-3 border-t">
            {trainingMode && (
              <div className="mb-2">
                <Input
                  type="password"
                  value={trainingCode}
                  onChange={(e) => setTrainingCode(e.target.value)}
                  placeholder="Enter training code"
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Training format: "question || answer"
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={trainingMode ? "Enter training (question || answer)" : "Type your question..."}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 p-0 shadow-lg"
        >
          <Flag className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};