"use client";

import React from 'react';
import { toast } from "sonner";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    toast.error("An error occurred", {
      description: "Something went wrong. Please try again later.",
    });
  }

  render() {
    if (this.state.hasError) {
      return null; // We return null because the toast is shown in componentDidCatch
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
