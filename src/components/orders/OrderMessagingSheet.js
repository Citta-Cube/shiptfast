'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, ArrowLeft, Building2, Users, Loader2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

const OrderMessagingSheet = ({ orderId, order, userRole }) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [companyConversations, setCompanyConversations] = useState([]);
  const [currentView, setCurrentView] = useState('companies'); // 'companies' or 'chat'

  const scrollAreaRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/messages/order/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchRecipients = useCallback(async () => {
    try {
      const response = await fetch(`/api/messages/order/${orderId}/recipients?role=${userRole}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Recipients fetched for', userRole, ':', data);
        setRecipients(data);
      } else {
        console.error('Failed to fetch recipients:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  }, [orderId, userRole]);

  // Move processMessagesIntoConversations before the useEffect that uses it
  const processMessagesIntoConversations = useCallback(() => {
    const conversationMap = new Map();
    
    // Get current user's company ID from messages or recipients
    let currentUserCompanyId = null;
    
    // Try to get company ID from messages where current user is the sender
    const userMessage = messages.find(msg => msg.sent_by?.user_id === user?.id);
    if (userMessage) {
      currentUserCompanyId = userMessage.sender_company?.id;
    }
    
    // If we still don't have company ID, try to infer from recipient structure
    if (!currentUserCompanyId && recipients.length > 0) {
      if (userRole === 'exporter' && recipients[0]?.companies) {
        // For exporters, we need to find their company ID differently
        // Let's check if any message has a recipient that matches our role
        const exporterMessage = messages.find(msg => 
          msg.to_company?.type === 'EXPORTER' || msg.sender_company?.type === 'EXPORTER'
        );
        if (exporterMessage) {
          currentUserCompanyId = exporterMessage.sender_company?.type === 'EXPORTER' 
            ? exporterMessage.sender_company?.id 
            : exporterMessage.to_company?.id;
        }
      } else if (userRole === 'forwarder' && recipients.companies) {
        // For forwarders, the current company would be the one not in recipients
        const forwarderMessage = messages.find(msg => 
          msg.to_company?.type === 'FREIGHT_FORWARDER' || msg.sender_company?.type === 'FREIGHT_FORWARDER'
        );
        if (forwarderMessage) {
          currentUserCompanyId = forwarderMessage.sender_company?.type === 'FREIGHT_FORWARDER' 
            ? forwarderMessage.sender_company?.id 
            : forwarderMessage.to_company?.id;
        }
      }
    }
    
    messages.forEach(message => {
      // Determine the other company - the one that's NOT the current user's company
      let otherCompany = null;
      
      if (message.sender_company?.id === currentUserCompanyId) {
        // Current user's company sent this message, so other company is the recipient
        otherCompany = message.to_company;
      } else if (message.to_company?.id === currentUserCompanyId) {
        // Current user's company received this message, so other company is the sender
        otherCompany = message.sender_company;
      } else {
        // Fallback: if we can't determine current user's company, group by sender for now
        otherCompany = message.sender_company;
      }
      
      // Skip if we can't determine the other company
      if (!otherCompany || !otherCompany.id) return;
      
      if (!conversationMap.has(otherCompany.id)) {
        conversationMap.set(otherCompany.id, {
          company: otherCompany,
          messages: [],
          lastMessage: null,
          lastMessageTime: null
        });
      }
      
      const conversation = conversationMap.get(otherCompany.id);
      conversation.messages.push(message);
      
      // Update last message
      if (!conversation.lastMessageTime || new Date(message.created_at) > new Date(conversation.lastMessageTime)) {
        conversation.lastMessage = message;
        conversation.lastMessageTime = message.created_at;
      }
    });
    
    // Sort messages within each conversation by time
    conversationMap.forEach(conversation => {
      conversation.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
    
    // Convert to array and sort by last message time
    return Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0)
    );
  }, [messages, user?.id, userRole, recipients]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      fetchRecipients();
    }
  }, [isOpen, fetchMessages, fetchRecipients]);

  useEffect(() => {
    // Process messages to create company conversations
    if (messages.length > 0) {
      const conversations = processMessagesIntoConversations();
      setCompanyConversations(conversations);
    }
  }, [messages, processMessagesIntoConversations]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (currentView === 'chat' && messagesEndRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentView, selectedCompany]);

  // Focus textarea when view changes
  useEffect(() => {
    if ((currentView === 'chat' || currentView === 'broadcast') && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentView]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (currentView !== 'companies') {
          handleBackToCompanies();
        } else {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, currentView]);

  const sendToAllCompanies = async () => {
    if (!messageText.trim()) return;

    try {
      setIsSending(true);
      
      const companies = userRole === 'exporter' ? recipients : [recipients];
      const promises = companies.map(item =>
        fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            sender_id: user.id,
            to_company_id: item.companies?.id || item.companies?.id,
            message: messageText
          })
        })
      );
      
      await Promise.all(promises);
      setMessageText('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message to all:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setCurrentView('chat');
  };

  const handleBackToCompanies = () => {
    setCurrentView('companies');
    setSelectedCompany(null);
    setMessageText('');
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM d');
    }
  };

  const getMessageCount = (companyId) => {
    const conversation = companyConversations.find(conv => conv.company.id === companyId);
    return conversation?.messages.length || 0;
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCompany) return;

    try {
      setIsSending(true);
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          sender_id: user.id,
          to_company_id: selectedCompany.id,
          message: messageText
        })
      });
      
      if (response.ok) {
        setMessageText('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderCompanyList = () => {
    const availableCompanies = userRole === 'exporter'
      ? recipients.map(r => ({ ...r.companies, type: 'forwarder' }))
      : recipients.companies ? [{ ...recipients.companies, type: 'exporter' }] : [];

    if (isLoading) {
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center p-3">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (availableCompanies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center px-4">
          <div className="bg-muted rounded-full p-4 mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium mb-1">No companies available</p>
          <p className="text-sm text-muted-foreground">There are no companies to message for this order</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {userRole === 'exporter' && recipients.length > 1 && (
          <>
            <div
              className="flex items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-all hover:shadow-sm border border-transparent hover:border-border"
              onClick={() => setCurrentView('broadcast')}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">All Freight Forwarders</div>
                <div className="text-sm text-muted-foreground">Send to all companies</div>
              </div>
              <Badge variant="secondary">{recipients.length}</Badge>
            </div>
            <Separator className="my-2" />
          </>
        )}

        {availableCompanies.map(company => {
          const conversation = companyConversations.find(conv => conv.company.id === company.id);
          const messageCount = getMessageCount(company.id);
          return (
            <div
              key={company.id}
              className="flex items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-all hover:shadow-sm border border-transparent hover:border-border"
              onClick={() => handleCompanySelect(company)}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {company.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{company.name}</span>
                  {messageCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {messageCount}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {conversation?.lastMessage
                    ? conversation.lastMessage.message
                    : 'Start a conversation'}
                </div>
              </div>
              {conversation?.lastMessage && (
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatMessageTime(conversation.lastMessage.created_at)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedCompanyChat = () => {
    if (!selectedCompany) return null;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCompanies}
            className="mr-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-9 w-9 mr-3">
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold text-sm">
              {selectedCompany.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{selectedCompany.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {(selectedCompany.type || selectedCompany.company_type)?.replace('_', ' ').toLowerCase()}
            </div>
          </div>
        </div>

        {renderChatMessages()}

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Type a message...`}
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              size="sm"
              className="self-end h-[60px] w-[60px]"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line, Esc to go back
          </p>
        </div>
      </div>
    );
  };

  const renderChatMessages = () => {
    if (!selectedCompany) return null;

    const conversation = companyConversations.find(conv => conv.company.id === selectedCompany.id);
    const conversationMessages = conversation?.messages || [];

    if (isLoading) {
      return (
        <div className="flex-1 px-4 py-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%] space-y-2">
                <Skeleton className="h-16 w-64" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (conversationMessages.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="bg-muted rounded-full p-4 mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium mb-1">No messages yet</p>
          <p className="text-sm text-muted-foreground">
            Start the conversation with {selectedCompany.name}
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <div className="space-y-4 py-4">
          {conversationMessages.map((message, index) => {
            const isCurrentUserMessage = message.sent_by?.user_id === user?.id;
            const showDateDivider = index === 0 ||
              new Date(conversationMessages[index - 1].created_at).toDateString() !==
              new Date(message.created_at).toDateString();

            return (
              <React.Fragment key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {isToday(new Date(message.created_at))
                        ? 'Today'
                        : isYesterday(new Date(message.created_at))
                        ? 'Yesterday'
                        : format(new Date(message.created_at), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}
                <div
                  className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                      isCurrentUserMessage
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    {!isCurrentUserMessage && (
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-background">
                            {message.sent_by?.first_name?.[0]}{message.sent_by?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-semibold">
                          {message.sent_by?.first_name} {message.sent_by?.last_name}
                        </span>
                        <span className="text-[10px] opacity-60">•</span>
                        <span className="text-[10px] opacity-70 font-medium">
                          {message.sender_company?.name}
                        </span>
                      </div>
                    )}
                    {isCurrentUserMessage && (
                      <div className="flex items-center gap-1.5 mb-1.5 justify-end">
                        <span className="text-[10px] opacity-70 font-medium">
                          {message.sender_company?.name}
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.message}
                    </p>
                    <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${
                      isCurrentUserMessage ? 'opacity-80 justify-end' : 'opacity-70'
                    }`}>
                      <span>{format(new Date(message.created_at), 'HH:mm')}</span>
                      {isCurrentUserMessage && (
                        <span>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    );
  };

  const renderBroadcastView = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCompanies}
            className="mr-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-9 w-9 mr-3">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Users className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-semibold">All Freight Forwarders</div>
            <div className="text-xs text-muted-foreground">
              Broadcasting to {recipients.length} companies
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="bg-primary/10 rounded-full p-6 inline-flex mb-4">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <p className="text-lg font-semibold mb-2">Broadcast Message</p>
            <p className="text-sm text-muted-foreground mb-4">
              Your message will be sent to all {recipients.length} freight forwarders simultaneously
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {recipients.slice(0, 5).map((r) => (
                <Badge key={r.companies?.id} variant="secondary" className="text-xs">
                  {r.companies?.name}
                </Badge>
              ))}
              {recipients.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{recipients.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your broadcast message..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendToAllCompanies();
                }
              }}
              disabled={isSending}
            />
            <Button
              onClick={sendToAllCompanies}
              disabled={!messageText.trim() || isSending}
              size="sm"
              className="self-end h-[60px] w-[60px]"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to broadcast, Shift+Enter for new line, Esc to go back
          </p>
        </div>
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          Send Message
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b bg-background">
          <SheetTitle className="text-lg">Order Messages</SheetTitle>
          <SheetDescription>
            Communicate about Order <span className="font-medium text-foreground">#{order?.reference_number}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {currentView === 'companies' && (
            <div className="flex flex-col h-full">
              <div className="px-6 pt-4 pb-3">
                <h3 className="font-semibold text-base">Select Company</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a company to start messaging
                </p>
              </div>
              <Separator />
              <ScrollArea className="flex-1 px-4 py-2">
                {renderCompanyList()}
              </ScrollArea>
            </div>
          )}

          {currentView === 'chat' && renderSelectedCompanyChat()}

          {currentView === 'broadcast' && renderBroadcastView()}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderMessagingSheet;