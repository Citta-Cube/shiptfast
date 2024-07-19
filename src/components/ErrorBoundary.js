"use client";

import React from 'react';
import { useToast } from "@/components/ui/use-toast";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error here
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

function ErrorFallback() {
  const { toast } = useToast();

  React.useEffect(() => {
    toast({
      title: "An error occurred",
      description: "Something went wrong. Please try again later.",
      variant: "destructive",
    });
  }, [toast]);

  return null;
}

export default ErrorBoundary;
