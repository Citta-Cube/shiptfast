"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowUpRight, CircleCheck, CircleHelp } from "lucide-react";
import { useState } from "react";

const tooltipContent = {
  quotes: "Get instant quotes from verified freight forwarders worldwide.",
  shipments: "Track and manage your active shipments with real-time updates.",
  analytics: "Access comprehensive reports and insights on your shipping operations.",
  support: "Get dedicated support from our freight experts.",
  integrations: "Connect with popular shipping and logistics platforms.",
  api: "Full API access for custom integrations and automation.",
};

const YEARLY_DISCOUNT = 20;
const plans = [
  {
    name: "Starter",
    price: 49,
    description:
      "Perfect for small businesses starting their freight operations.",
    features: [
      { title: "Up to 50 quotes per month", tooltip: tooltipContent.quotes },
      { title: "10 active shipments", tooltip: tooltipContent.shipments },
      { title: "Basic analytics dashboard", tooltip: tooltipContent.analytics },
      { title: "Email support" },
      { title: "Standard freight forwarder network" },
      { title: "Document management" },
      { title: "Mobile app access" },
    ],
  },
  {
    name: "Professional",
    price: 149,
    isRecommended: true,
    description:
      "Advanced features for growing businesses with regular shipping needs.",
    features: [
      { title: "Unlimited quotes", tooltip: tooltipContent.quotes },
      { title: "100 active shipments", tooltip: tooltipContent.shipments },
      { title: "Advanced analytics & reporting", tooltip: tooltipContent.analytics },
      { title: "Priority support (24/7)", tooltip: tooltipContent.support },
      { title: "Premium forwarder network access" },
      { title: "Custom document templates" },
      { title: "Team collaboration tools" },
      { title: "Third-party integrations", tooltip: tooltipContent.integrations },
      { title: "API access", tooltip: tooltipContent.api },
    ],
    isPopular: true,
  },
];

const Pricing04 = () => {
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState("monthly");

  return (
    <TooltipProvider>
      <section className="bg-transparent py-32" id="pricing">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          <Tabs
            value={selectedBillingPeriod}
            onValueChange={setSelectedBillingPeriod}
            className="flex justify-center mb-12"
          >
            <TabsList className="h-11 bg-muted border rounded-full">
              <TabsTrigger
                value="monthly"
                className="px-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger
                value="yearly"
                className="px-6 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Yearly (Save {YEARLY_DISCOUNT}%)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative p-8 bg-card border border-border rounded-lg hover:shadow-lg transition-shadow duration-300",
                  {
                    "shadow-xl ring-2 ring-primary/20 lg:scale-105 z-10": plan.isPopular,
                  }
                )}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      $
                      {selectedBillingPeriod === "monthly"
                        ? plan.price
                        : Math.round(plan.price * ((100 - YEARLY_DISCOUNT) / 100))}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      /month
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                <Button
                  variant={plan.isPopular ? "default" : "outline"}
                  size="lg"
                  className="w-full mb-6 rounded-lg"
                  asChild
                >
                  <a href="/auth/sign-up">
                    Get Started <ArrowUpRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>

                <Separator className="mb-6" />

                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CircleCheck className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                      <span className="text-foreground text-sm">{feature.title}</span>
                      {feature.tooltip && (
                        <Tooltip>
                          <TooltipTrigger className="cursor-help">
                            <CircleHelp className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{feature.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Additional info */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground text-sm">
              All plans include 14-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export { Pricing04 };