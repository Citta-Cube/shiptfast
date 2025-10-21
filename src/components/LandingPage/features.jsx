'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'

const Feature166 = ({
    title = "Everything you need to manage freight",
    description = "Streamline your shipping operations with our comprehensive freight management platform designed for exporters and forwarders.",
    feature1 = {
      title: "Real-Time Quote Comparison",
      description:
        "Get instant quotes from multiple verified freight forwarders. Compare rates, delivery times, and service quality to make informed decisions.",
      imageLight: "/Order-Light.png",
      imageDark: "/Order-Dark.png",
    },
    feature2 = {
      title: "Smart Order Management",
      description:
        "Streamline your shipping workflow with intelligent order tracking, automated notifications, and comprehensive shipment visibility.",
      imageLight: "/Order-Light.png",
      imageDark: "/Order-Dark.png",
    },
    feature3 = {
      title: "Global Network Access",
      description:
        "Connect with our worldwide network of trusted freight forwarders and shipping partners for seamless global trade operations.",
      imageLight: "/Order-Light.png",
      imageDark: "/Order-Dark.png",
    },
    feature4 = {
      title: "Advanced Analytics",
      description:
        "Make data-driven decisions with comprehensive analytics, performance metrics, and insights to optimize your shipping strategy.",
      imageLight: "/Order-Light.png",
      imageDark: "/Order-Dark.png",
    },
  }) => {
    const { theme } = useTheme()
    
    const FeatureImage = ({ feature, className }) => (
      <div className="relative mt-8">
        {/* Light mode image */}
        <Image
          src={feature.imageLight}
          alt={feature.title}
          width={600}
          height={400}
          className={`${className} dark:hidden`}
          priority
        />
        {/* Dark mode image */}
        <Image
          src={feature.imageDark}
          alt={feature.title}
          width={600}
          height={400}
          className={`${className} hidden dark:block`}
          priority
        />
      </div>
    )

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col items-center gap-6">
          <h1 className="text-center text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {title}
          </h1>
          <p className="text-center text-lg leading-8 text-muted-foreground max-w-2xl">
            {description}
          </p>
        </div>
          <div className="relative flex justify-center">
            <div className="relative flex w-full flex-col border border-border md:w-1/2 lg:w-full">
              <div className="relative flex flex-col lg:flex-row">
                <div className="flex flex-col justify-between border-b border-border border-solid p-10 lg:w-3/5 lg:border-b-0 lg:border-r">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature1.title}</h3>
                    <p className="text-muted-foreground text-sm leading-6">{feature1.description}</p>
                  </div>
                  <FeatureImage 
                    feature={feature1}
                    className="aspect-[1.5] h-full w-full object-cover lg:aspect-[2.4] rounded-lg"
                  />
                </div>
                <div className="flex flex-col justify-between p-10 lg:w-2/5">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature2.title}</h3>
                    <p className="text-muted-foreground text-sm leading-6">{feature2.description}</p>
                  </div>
                  <FeatureImage 
                    feature={feature2}
                    className="aspect-[1.45] h-full w-full object-cover rounded-lg"
                  />
                </div>
              </div>
              <div className="relative flex flex-col border-t border-border border-solid lg:flex-row">
                <div className="flex flex-col justify-between border-b border-border border-solid p-10 lg:w-2/5 lg:border-b-0 lg:border-r">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature3.title}</h3>
                    <p className="text-muted-foreground text-sm leading-6">{feature3.description}</p>
                  </div>
                  <FeatureImage 
                    feature={feature3}
                    className="aspect-[1.45] h-full w-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex flex-col justify-between p-10 lg:w-3/5">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{feature4.title}</h3>
                    <p className="text-muted-foreground text-sm leading-6">{feature4.description}</p>
                  </div>
                  <FeatureImage 
                    feature={feature4}
                    className="aspect-[1.5] h-full w-full object-cover lg:aspect-[2.4] rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  export { Feature166 };