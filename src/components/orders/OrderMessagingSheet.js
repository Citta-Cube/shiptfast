'use client'

import React, { useState, useEffect, useCallback } from 'react';
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
import { MessageSquare, Send, ArrowLeft, Building2, Users } from "lucide-react";
import { format } from "date-fns";

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

    if (availableCompanies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No companies available for messaging</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {userRole === 'exporter' && recipients.length > 1 && (
          <>
            <div 
              className="flex items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
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
            </div>
            <Separator />
          </>
        )}
        
        {availableCompanies.map(company => {
          const conversation = companyConversations.find(conv => conv.company.id === company.id);
          return (
            <div
              key={company.id}
              className="flex items-center p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
              onClick={() => handleCompanySelect(company)}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {company.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{company.name}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {conversation?.lastMessage 
                    ? conversation.lastMessage.message 
                    : 'No messages yet'}
                </div>
              </div>
              {conversation?.lastMessage && (
                <div className="text-xs text-muted-foreground">
                  {format(new Date(conversation.lastMessage.created_at), 'MMM d')}
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
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCompanies}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8 mr-3">
            <AvatarFallback>
              {selectedCompany.name?.[0]}{selectedCompany.name?.[1]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{selectedCompany.name}</div>
            <div className="text-sm text-muted-foreground">
              {selectedCompany.company_type?.replace('_', ' ').toLowerCase()}
            </div>
          </div>
        </div>
        
        {renderChatMessages()}
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message ${selectedCompany.name}...`}
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || isSending}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderChatMessages = () => {
    if (!selectedCompany) return null;

    const conversation = companyConversations.find(conv => conv.company.id === selectedCompany.id);
    const conversationMessages = conversation?.messages || [];

    if (conversationMessages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No messages sent yet</p>
          <p className="text-sm text-muted-foreground">Start the conversation!</p>
        </div>
      );
    }

    return (
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {conversationMessages.map((message) => {
            const isCurrentUserMessage = message.sent_by?.user_id === user?.id;
            
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isCurrentUserMessage
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {!isCurrentUserMessage && (
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {message.sent_by?.first_name?.[0]}{message.sent_by?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {message.sent_by?.first_name} {message.sent_by?.last_name}
                      </span>
                      <span className="text-xs opacity-60">
                        from {message.sender_company?.name}
                      </span>
                    </div>
                  )}
                  <p className="text-sm">{message.message}</p>
                  <div className={`text-xs mt-1 ${isCurrentUserMessage ? 'opacity-70' : 'opacity-60'}`}>
                    {format(new Date(message.created_at), 'MMM d, HH:mm')}
                    {isCurrentUserMessage && (
                      <span className="ml-2">✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const renderBroadcastView = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToCompanies}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8 mr-3">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Users className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">All Freight Forwarders</div>
            <div className="text-sm text-muted-foreground">Send to all companies</div>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Broadcast Message</p>
            <p className="text-sm text-muted-foreground">Your message will be sent to all freight forwarders</p>
          </div>
        </div>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message to all companies..."
              className="flex-1 min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendToAllCompanies();
                }
              }}
            />
            <Button
              onClick={sendToAllCompanies}
              disabled={!messageText.trim() || isSending}
              size="sm"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
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
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Order Messages</SheetTitle>
          <SheetDescription>
            Communicate about Order #{order?.reference_number}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {currentView === 'companies' && (
            <div className="p-4">
              <h3 className="font-medium mb-4">Select Company</h3>
              <ScrollArea className="flex-1">
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