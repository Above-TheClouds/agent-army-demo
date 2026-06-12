import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <section className="max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Stop loosing your time reviewing
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          Let AI handle the tedious parts of code review so you can focus on what matters.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
          >
            Get started
          </Link>
          <Link
            href="/learn-more"
            className="text-sm font-semibold text-gray-900 hover:underline"
          >
            Learn more →
          </Link>
        </div>
      </section>
    </main>
  );
}
