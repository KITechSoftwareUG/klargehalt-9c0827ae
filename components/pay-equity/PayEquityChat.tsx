/**
 * Pay Equity AI Chat Component
 * Minimalistisches Chat-Interface für Mitarbeiter-Fragen
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Send, Info, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface PayEquityChatProps {
    employeeId?: string;
    companyId?: string;
}

const EXAMPLE_QUESTIONS = [
    'Wie setzt sich meine Vergleichsgruppe zusammen?',
    'Warum gibt es in manchen Gruppen einen Gap?',
    'Was bedeutet der 5%-Schwellenwert?',
    'Wie wird das Gehalt in meiner Gruppe berechnet?',
];

export function PayEquityChat({ employeeId, companyId }: PayEquityChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hallo! Ich helfe dir bei Fragen zu deinem Gehaltsvergleich und zur Pay-Equity-Analyse. Was möchtest du wissen?',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async (question?: string) => {
        const messageText = question || input.trim();
        if (!messageText || isLoading) return;

        // User-Message hinzufügen
        const userMessage: Message = {
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/pay-equity/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: messageText,
                    employee_id: employeeId,
                    company_id: companyId,
                    history: messages.slice(-4), // Letzte 4 Nachrichten als Kontext
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Chat-Fehler');
            }

            // AI-Message hinzufügen
            const aiMessage: Message = {
                role: 'assistant',
                content: data.answer,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Chat error:', error);

            // Fehler-Message
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Entschuldigung, ich konnte diese Frage gerade nicht beantworten. Bitte versuche es später erneut.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    KI-Assistent
                </CardTitle>
                <CardDescription>
                    Fragen zu Gehaltsvergleichen und Pay-Equity
                </CardDescription>
            </CardHeader>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <Avatar className={message.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}>
                                <AvatarFallback className="text-white">
                                    {message.role === 'user' ? 'DU' : 'KI'}
                                </AvatarFallback>
                            </Avatar>
                            <div
                                className={`flex-1 rounded-lg p-3 ${message.role === 'user'
                                        ? 'bg-blue-600 text-white ml-12'
                                        : 'bg-muted mr-12'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.content}
                                </p>
                                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                                    }`}>
                                    {message.timestamp.toLocaleTimeString('de-DE', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <Avatar className="bg-purple-600">
                                <AvatarFallback className="text-white">KI</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 rounded-lg p-3 bg-muted mr-12">
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-4/5" />
                                    <Skeleton className="h-3 w-3/5" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Example Questions (only shown initially) */}
            {messages.length === 1 && (
                <div className="px-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-2">Beispiel-Fragen:</p>
                    <div className="grid grid-cols-1 gap-2">
                        {EXAMPLE_QUESTIONS.map((q, idx) => (
                            <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSend(q)}
                                disabled={isLoading}
                                className="justify-start text-left h-auto py-2 px-3"
                            >
                                <MessageCircle className="h-3 w-3 mr-2 flex-shrink-0" />
                                <span className="text-xs">{q}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Banner */}
            <div className="px-4 pb-3">
                <Alert>
                    <Info className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                        Dieser Chat gibt <strong>keine Rechtsberatung</strong> und keine konkreten Handlungsempfehlungen.
                    </AlertDescription>
                </Alert>
            </div>

            {/* Input */}
            <CardContent className="border-t pt-4 pb-4">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Stelle eine Frage..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    <Button
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        size="icon"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
