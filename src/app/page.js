import { getCurrentUser } from '@/data-access/users'
import { Globe } from "@/components/ui/globe"
import HeroHeader from '@/components/LandingPage/navbar'
import LightRays from '@/components/ui/lightrays'
import { StarsBackground } from '@/components/ui/stars'
import LogoCloud from '@/components/LandingPage/logocloud'
import { Feature197 } from '@/components/LandingPage/features'
import { Pricing04 } from '@/components/LandingPage/pricing'
import { Contact2 } from '@/components/LandingPage/contact2'
import FooterSection from '@/components/LandingPage/footerNew'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import HeroSection from '@/components/LandingPage/hero-section'

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export default async function Home() {
  let user = null

  try {
    user = await getCurrentUser()
  } catch (error) {
    user = null
  }

  return (
    <main className="relative flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <HeroHeader isAuthenticated={!!user} />

      {/* Background Effects Container */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Starfield Background */}
        <StarsBackground className="absolute inset-0" speed={60} factor={0.03} />

        {/* Light Rays - Increased visibility */}
        <div className="absolute inset-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={2}
            lightSpread={1.2}
            rayLength={1.8}
            followMouse={true}
            mouseInfluence={0.2}
            noiseAmount={0.15}
            distortion={0.08}
            className="opacity-40 mix-blend-screen"
          />
        </div>

        {/* Additional Light Rays for better visibility */}
        <div className="absolute inset-0">
          <LightRays
            raysOrigin="center"
            raysColor="#3b82f6"
            raysSpeed={1}
            lightSpread={0.6}
            rayLength={1.5}
            followMouse={false}
            mouseInfluence={0}
            noiseAmount={0.2}
            distortion={0.1}
            className="opacity-20 mix-blend-overlay"
          />
        </div>

        {/* Globe Background */}
        <div className="absolute inset-0 flex items-center justify-center mt-40">
          <Globe className="opacity-60 w-[600px] h-[600px]" />
        </div>

        {/* Gradient overlay to help blend effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none" />
      </div>

      {/* Content Container with Consistent Spacing */}
      <div className="relative z-10 space-y-4">
        {/* Hero Section */}
        <section className="flex flex-1 items-center justify-center w-full px-4 pt-16 pb-16 bg-transparent">
          <div className="relative w-full max-w-7xl mx-auto">
            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
              {/* Badge */}
              <AnimatedGroup variants={transitionVariants}>
                <Link
                  href="#features"
                  className="hover:bg-background/80 dark:hover:border-t-border bg-muted/60 backdrop-blur-md group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/20 p-1 pl-4 shadow-lg shadow-zinc-950/10 transition-colors duration-300 dark:border-t-white/10 dark:shadow-zinc-950"
                >
                  <span className="text-foreground text-sm">
                    Introducing Freight Management Platform
                  </span>
                  <span className="dark:border-background block h-4 w-0.5 border-l bg-white/50 dark:bg-zinc-700"></span>
                  <div className="bg-background/80 group-hover:bg-muted/80 size-6 overflow-hidden rounded-full duration-500 backdrop-blur-sm">
                    <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                      <span className="flex size-6">
                        <ArrowRight className="m-auto size-3" />
                      </span>
                      <span className="flex size-6">
                        <ArrowRight className="m-auto size-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedGroup>

              {/* Main Heading with Text Flip */}
              <HeroSection />


              {/* Subtext */}
              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="mx-auto mt-8 max-w-3xl text-balance text-lg text-muted-foreground relative z-10 leading-relaxed rounded-lg p-4"
              >
                Connect with trusted freight forwarders, compare real-time quotes,
                and manage every shipment in one powerful workspace.
                Designed for exporters and forwarders who want speed, transparency,
                and growth — all in one place.
              </TextEffect>

              {/* CTA Buttons */}
              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="mt-12 flex flex-col items-center justify-center gap-4 md:flex-row relative z-10"
              >
                <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                  <Button 
                  asChild 
                  variant="new"
                  size="lg" className="rounded-xl px-8 py-3 text-base font-semibold shadow-lg">
                    <Link href="/auth/sign-up">
                      <span className="text-nowrap">Start Shipping Smarter</span>
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-xl px-8 py-3 text-base font-semibold backdrop-blur-md bg-background/40 border-white/20 shadow-lg"
                  >
                    <Link href="#contact">
                      <span className="text-nowrap">Book a Demo</span>
                    </Link>
                  </Button>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>

        {/* Logo Cloud Section */}
        <section className="mt-4 relative z-20">
          <LogoCloud />
        </section>

        {/* PNG Preview Section */}
        <section className="px-4 -mt-4 relative z-20">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 1,
                  },
                },
              },
              ...transitionVariants,
            }}
            className="relative px-2"
          >
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/20 p-4 shadow-2xl shadow-zinc-950/25 ring-1 ring-background/50 backdrop-blur-sm bg-background/80 dark:ring-white/10">
              {/* Dark Mode Preview */}
              <Image
                className="bg-background aspect-[15/8] relative hidden rounded-2xl dark:block"
                src="/Order-Dark.png"
                alt="Freight Management Dashboard"
                width={2700}
                height={1440}
                priority
              />
              {/* Light Mode Preview */}
              <Image
                className="z-2 border-border/25 aspect-[15/8] relative rounded-2xl border dark:hidden"
                src="/Order-Light.png"
                alt="Freight Management Dashboard"
                width={2700}
                height={1440}
                priority
              />
            </div>
            {/* Gradient Fade at Bottom */}
            <div
              aria-hidden
              className="bg-gradient-to-b from-transparent from-30% to-background absolute inset-0 z-10"
            />
          </AnimatedGroup>
        </section>

        {/* Features Section */}
        <section id="features" className="-mt-8 relative z-20">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 1.8,
                  },
                },
              },
              ...transitionVariants,
            }}
          >
            <Feature197 />
          </AnimatedGroup>
        </section>

        {/* Pricing Section */}
        <section className="-mt-8 relative z-20">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 2.0,
                  },
                },
              },
              ...transitionVariants,
            }}
          >
            <Pricing04 />
          </AnimatedGroup>
        </section>

        {/* Contact Section */}
        <section className="-mt-8 relative z-20">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 2.4,
                  },
                },
              },
              ...transitionVariants,
            }}
          >
            <Contact2 />
          </AnimatedGroup>
        </section>
      </div>

      {/* Footer Section - Outside the spaced container */}
      <section className="relative z-20 -mt-8">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 2.6,
                },
              },
            },
            ...transitionVariants,
          }}
        >
          <FooterSection />
        </AnimatedGroup>
      </section>
    </main>
  )
}