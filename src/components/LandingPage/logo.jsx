import Image from 'next/image'

export const Logo = ({ className, width = 200, height = 200 }) => (
  <span className={`inline-flex items-center ${className || ''}`}>
    {/* Light mode logo */}
    <Image
      src="/favicon.svg"
      alt="Citta-Cube.ai Logo Light"
      width={width}
      height={height}
      priority
      className="block dark:hidden"
    />
    
    {/* Dark mode logo */}
    <Image
      src="/favicon1.svg"
      alt="Citta-Cube.ai Logo Dark"
      width={width}
      height={height}
      priority
      className="hidden dark:block"
    />
  </span>
)
