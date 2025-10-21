'use client'

import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";

const Contact7 = () => {
  return (
    <section className="bg-transparent py-32" id="contact">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Get In Touch
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to streamline your freight operations? Our friendly team is always here to help you get started.
          </p>
          <div className="max-w-6xl mx-auto py-16 grid md:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-10">
            <div className="text-center flex flex-col items-center">
              <div className="h-12 w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full">
                <MailIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-semibold text-xl text-foreground">Email Support</h3>
              <p className="mt-2 text-muted-foreground">
                Get detailed support and answers to your shipping questions.
              </p>
              <Link
                className="mt-4 font-medium text-primary hover:text-primary/80 transition-colors"
                href="mailto:support@cittacube.com"
              >
                support@cittacube.com
              </Link>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="h-12 w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full">
                <MapPinIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-semibold text-xl text-foreground">Our Office</h3>
              <p className="mt-2 text-muted-foreground">
                Visit us for an in-person consultation about your freight needs.
              </p>
              <Link
                className="mt-4 font-medium text-primary hover:text-primary/80 transition-colors"
                href="https://maps.google.com"
                target="_blank"
              >
                143/6, Weediyabandara Mawatha, <br />
                Kelanimulla Angoda, Sri Lanka
              </Link>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="h-12 w-12 flex items-center justify-center bg-primary/5 dark:bg-primary/10 text-primary rounded-full">
                <PhoneIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-semibold text-xl text-foreground">Phone Support</h3>
              <p className="mt-2 text-muted-foreground">
                Speak directly with our freight experts, Mon-Fri 8am to 6pm.
              </p>
              <Link
                className="mt-4 font-medium text-primary hover:text-primary/80 transition-colors"
                href="tel:+94112345678"
              >
                +94 (11) 234-5678
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact7 };