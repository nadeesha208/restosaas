import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { Restaurant, MenuItem, Category, ChatMessage } from '../types';
import Modal from './Modal';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant;
    menuItems: MenuItem[];
    categories: Category[];
}

const SendIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
    </svg>
);


const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, restaurant, menuItems, categories }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);


    useEffect(() => {
        if (isOpen) {
            const initializeChat = async () => {
                if (!process.env.API_KEY) {
                    console.error("Gemini API Key is missing. Please set the API_KEY environment variable.");
                    const errorMessage: ChatMessage = {
                        role: 'model',
                        parts: [{ text: "I'm sorry, the AI assistant is not configured correctly. The API key is missing." }]
                    };
                    setMessages([errorMessage]);
                    return;
                }
                try {
                    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                    
                    const menuContext = menuItems.map(item => {
                        const categoryName = categories.find(c => c.id === item.categoryId)?.name || 'Uncategorized';
                        return `- ${item.name} (${categoryName}): ${item.description} [Price: $${item.price.toFixed(2)}]`;
                    }).join('\n');
                    
                    const systemInstruction = `You are a friendly and helpful AI assistant for a restaurant called "${restaurant.name}".
                    Your goal is to answer customer questions about the menu. Be concise and helpful.
                    Here is the full menu for your reference:
                    ${menuContext}
                    Do not answer questions that are not related to the restaurant or its menu.
                    `;

                    const newChat = ai.chats.create({
                        model: 'gemini-2.5-flash',
                        config: {
                            systemInstruction,
                        },
                    });
                    
                    setChat(newChat);
                    
                    // Initial greeting from the bot
                    const greetingMessage: ChatMessage = {
                        role: 'model',
                        parts: [{ text: `Hello! I'm the AI assistant for ${restaurant.name}. How can I help you with the menu today?` }]
                    };
                    setMessages([greetingMessage]);

                } catch (error) {
                    console.error("Error initializing Gemini:", error);
                     const errorMessage: ChatMessage = {
                        role: 'model',
                        parts: [{ text: "Sorry, I'm having trouble connecting. Please try again later." }]
                    };
                    setMessages([errorMessage]);
                }
            };
            initializeChat();
        } else {
            // Reset state when modal is closed
            setMessages([]);
            setInput('');
            setIsLoading(false);
            setChat(null);
        }
    }, [isOpen, restaurant, menuItems, categories]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: modelResponse }] };
                    return newMessages;
                });
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "I'm sorry, something went wrong. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Assistant">
            <div className="flex flex-col h-[60vh]">
                <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl bg-gray-200 text-gray-800">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <div className="mt-4 pt-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about the menu..."
                            className="flex-1 border-gray-300 rounded-full py-2 px-4 focus:ring-orange-500 focus:border-orange-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-orange-500 text-white disabled:bg-gray-300 hover:bg-orange-600 transition">
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default Chatbot;