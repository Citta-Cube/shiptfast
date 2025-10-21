'use client'

import { Separator } from "@/components/ui/separator";
import {
  LinkedinIcon,
  TwitterIcon,
  FacebookIcon,
  MailIcon,
} from "lucide-react";
import Link from "next/link";

const footerLinks = [
  {
    title: "Features",
    href: "#features",
  },
  {
    title: "Pricing",
    href: "#pricing",
  },
  {
    title: "Contact",
    href: "#contact",
  },
  {
    title: "About",
    href: "#",
  },
  {
    title: "Privacy",
    href: "#",
  },
  {
    title: "Terms",
    href: "#",
  },
];

const Footer05 = () => {
  return (
    <footer className="bg-background border-t border-border">
      <div className="mx-auto max-w-7xl">
        <div className="py-12 flex flex-col justify-start items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold text-foreground">CittaCube</span>
          </div>

          <ul className="mt-6 flex items-center gap-4 flex-wrap justify-center">
            {footerLinks.map(({ title, href }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <Separator />
        
        <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
          {/* Copyright */}
          <span className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()}{" "}
            <Link href="/" className="hover:text-foreground transition-colors">
              CittaCube
            </Link>
            . All rights reserved. Streamline your freight operations worldwide.
          </span>

          <div className="flex items-center gap-5 text-muted-foreground">
            <Link 
              href="https://twitter.com" 
              target="_blank"
              className="hover:text-primary transition-colors duration-200"
            >
              <TwitterIcon className="h-5 w-5" />
            </Link>
            <Link 
              href="https://linkedin.com" 
              target="_blank"
              className="hover:text-primary transition-colors duration-200"
            >
              <LinkedinIcon className="h-5 w-5" />
            </Link>
            <Link 
              href="https://facebook.com" 
              target="_blank"
              className="hover:text-primary transition-colors duration-200"
            >
              <FacebookIcon className="h-5 w-5" />
            </Link>
            <Link 
              href="mailto:support@cittacube.com" 
              className="hover:text-primary transition-colors duration-200"
            >
              <MailIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer05 };