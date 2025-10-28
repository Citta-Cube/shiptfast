'use client'

import { LayoutTextFlip } from '@/components/ui/layout-text-flip'
import { motion } from 'motion/react'

export default function HeroSection() {
  return (
    <>
      {/* Main Heading with Text Flip */}
      <motion.div
        className="mt-8 lg:mt-16 text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <h1 className="text-balance text-6xl md:text-7xl lg:mt-16 xl:text-[5.25rem] relative z-10  bg-gradient-to-b from-foreground to-foreground/80 bg-clip-text">
          <LayoutTextFlip
            text="Ship Smarter. "
            words={[
              "Quote Faster.",
              "Grow Without Limits.",
              "Connect Globally.",
              "Move Forward."
            ]}
          />
        </h1>
      </motion.div>
    </>
  )
}

