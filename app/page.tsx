import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-6 py-20">
        <section className="flex flex-col items-center text-center gap-8">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900">
            Welcome
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Get started by exploring our live demo below.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-6 py-3 text-base font-medium hover:bg-gray-800 transition-colors"
          >
            <span
              aria-hidden="true"
              className="relative inline-flex items-center justify-center h-2.5 w-2.5"
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 motion-safe:animate-ping"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
            Live Demo
          </Link>
        </section>
      </main>
    </div>
  );
}
