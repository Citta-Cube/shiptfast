import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const UrgentIndicator = () => {
  return (
    <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 1,
            ease: "easeInOut"
        }}
        className="flex items-center space-x-1 bg-red-600 rounded-full px-2 py-1 opacity-100"
    >
        <AlertTriangle className="h-4 w-4 text-white" />
        <span className="text-xs font-semibold text-white opacity-100">URGENT</span>
    </motion.div>
  );
};

export default UrgentIndicator;