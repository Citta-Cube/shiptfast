import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Send, User, MessageSquare } from 'lucide-react';

const formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  };
  return new Date(dateString).toLocaleString('en-US', options);
};

const TimelineEvent = ({ event }) => {
  const isSystemEvent = event.type.toLowerCase().includes('system') || 
                        ['order created', 'bidding closed', 'bidding opened'].includes(event.type.toLowerCase());

  return (
    <li className="flex items-start space-x-4 pb-4 last:pb-0">
      {isSystemEvent ? (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Bell className="w-4 h-4 text-blue-600" />
        </div>
      ) : (
        <Avatar className="w-8 h-8">
          <AvatarImage src={event.userAvatar} alt={event.userName} />
          <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
        </Avatar>
      )}
      <div className="flex-grow">
        <p className="text-sm font-medium">{event.type}</p>
        <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
        <p className="mt-1 text-sm">{event.content}</p>
      </div>
    </li>
  );
};

const Timeline = ({ events, onPublishMessage }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onPublishMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow pr-4 mb-4">
        <ul className="space-y-4">
          {events.map((event, index) => (
            <TimelineEvent key={index} event={event} />
          ))}
        </ul>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 pt-4">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow"
        />
        <Button type="submit" size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

const TimelineSheet = ({ events, onPublishMessage }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="ml-auto">
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Order Notifications</SheetTitle>
        </SheetHeader>
        <div className="mt-4 h-[calc(100vh-120px)]">
          <Timeline events={events} onPublishMessage={onPublishMessage} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TimelineSheet;