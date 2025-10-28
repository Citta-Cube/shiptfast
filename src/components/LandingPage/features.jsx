'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const Feature197 = ({
  features = [
    {
      id: 1,
      title: 'Real-Time Quote Comparison',
      image: '/Order-Dark.png',
      description:
        'Get instant quotes from multiple verified freight forwarders. Compare rates, delivery times, and service quality to make informed decisions. Our platform connects you with trusted partners worldwide.',
    },
    {
      id: 2,
      title: 'Smart Order Management',
      image: '/Order-Dark.png',
      description:
        'Streamline your shipping workflow with intelligent order tracking, automated notifications, and comprehensive shipment visibility. Manage all your freight operations from one centralized platform.',
    },
    {
      id: 3,
      title: 'Global Network Access',
      image: '/Order-Dark.png',
      description:
        'Connect with our worldwide network of trusted freight forwarders and shipping partners for seamless global trade operations. Access competitive rates and reliable services across all major trade routes.',
    },
    {
      id: 4,
      title: 'Advanced Analytics',
      image: '/Order-Dark.png',
      description:
        'Make data-driven decisions with comprehensive analytics, performance metrics, and insights to optimize your shipping strategy. Track costs, delivery times, and partner performance in real-time.',
    },
    {
      id: 5,
      title: 'Automated Documentation',
      image: '/Order-Dark.png',
      description:
        'Simplify your shipping process with automated document generation and management. Our platform handles all required paperwork and ensures compliance with international shipping regulations.',
    },
  ],
}) => {
  const [activeTabId, setActiveTabId] = useState(1)
  const [activeImage, setActiveImage] = useState(features[0]?.image || '/Order-Dark.png')

  return (
    <section className="py-16">
      <div className="container mx-auto">
        <div className="mb-16 flex flex-col items-center gap-6">
          <h1 className="text-center text-3xl font-semibold lg:max-w-3xl lg:text-5xl">
            Everything you need to manage freight
          </h1>
          <p className="text-muted-foreground text-center text-lg font-medium md:max-w-4xl lg:text-xl">
            Streamline your shipping operations with our comprehensive freight management platform designed for exporters and forwarders.
          </p>
        </div>
        <div className="flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue="item-1">
              {features.map((tab) => (
                <AccordionItem
                  key={tab.id}
                  value={`item-${tab.id}`}
                  className="transition-opacity hover:opacity-80"
                >
                  <AccordionTrigger
                    onClick={() => {
                      setActiveImage(tab.image)
                      setActiveTabId(tab.id)
                    }}
                    className="no-underline cursor-pointer py-5 transition"
                  >
                    <h4
                      className={`text-xl font-semibold ${
                        tab.id === activeTabId
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {tab.title}
                    </h4>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground text-base">
                      {tab.description}
                    </p>
                    <div className="mt-4 md:hidden">
                      <Image
                        src={tab.image}
                        alt={tab.title}
                        width={600}
                        height={400}
                        className="h-full max-h-80 w-full rounded-md object-cover"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          <div className="bg-muted relative m-auto hidden w-1/2 overflow-hidden rounded-xl md:block">
            <Image
              src={activeImage}
              alt="Feature preview"
              width={800}
              height={600}
              className="aspect-[4/3] rounded-md object-cover pl-4"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export { Feature197 }
