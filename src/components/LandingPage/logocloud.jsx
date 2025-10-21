import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import Image from 'next/image'

export default function LogoCloud() {
    return (
        <section className="bg-transparent overflow-hidden py-16">
            <div className="group relative m-auto max-w-7xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="md:max-w-44 md:border-r md:pr-6">
                        <p className="text-end text-md">Our Trusted Partners</p>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider speedOnHover={20} speed={40} gap={112}>

                            {/* Basilur Tea Exports */}
                            <div className="flex items-center gap-2">
                                <Image
                                    className="mx-auto h-6 w-fit"
                                    src="/basilurlogo.png"
                                    alt="Basilur Tea Exports Logo"
                                    height={24}
                                    width={24}
                                />
                                <span className="text-lg font-bold">Basilur Tea Exports</span>
                            </div>

                            {/* Citta-Cube.ai */}
                            <div className="flex items-center gap-2">
                                <Image
                                    className="mx-auto h-6 w-fit"
                                    src="/CittaCube1.png"
                                    alt="Citta-Cube.ai Logo"
                                    height={24}
                                    width={24}
                                />
                                <span className="text-lg font-bold">Citta-Cube.ai</span>
                            </div>

                            {/* Coca-Cola */}
                            <div className="flex items-center gap-2">
                                <Image
                                    className="mx-auto h-6 w-fit"
                                    src="/cocacoala.png"
                                    alt="Coca-Cola Logo"
                                    height={24}
                                    width={24}
                                />
                                <span className="text-lg font-bold">Coca-Cola</span>
                            </div>

                            {/* Google */}
                            <div className="flex items-center gap-2">
                                <Image
                                    className="mx-auto h-6 w-fit"
                                    src="/google.png"
                                    alt="Google Logo"
                                    height={24}
                                    width={24}
                                />
                                <span className="text-lg font-bold">Google</span>
                            </div>

                        </InfiniteSlider>

                        {/* Blur Effects - Updated to use transparent gradients */}
                        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background/80 to-transparent"></div>
                        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background/80 to-transparent"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}