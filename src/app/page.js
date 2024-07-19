import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold text-center">
        Welcome to the Next.js E-commerce Dashboard
      </h1>
      <Image
        src="/images/nextjs-logo.svg"
        alt="Next.js Logo"
        width={300}
        height={300}
      />
    </main>
  );
}
