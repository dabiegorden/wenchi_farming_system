import Link from "next/link";
import { Leaf, BarChart, Calendar, Users } from "lucide-react";
import farmImage1 from "@/public/assets/farm1.jpeg";
import farmImage2 from "@/public/assets/farm2.jpeg";
import Image from "next/image";

const features = [
  {
    name: "Crop Tracking",
    description: "Monitor growth stages and health of various crops.",
    icon: Leaf,
  },
  {
    name: "Yield Forecasting",
    description: "Predict harvest yields using analytics.",
    icon: BarChart,
  },
  {
    name: "Planting Scheduler",
    description: "Optimize planting and harvesting schedules.",
    icon: Calendar,
  },
  {
    name: "Team Management",
    description: "Coordinate farm workers and assign tasks.",
    icon: Users,
  },
];

export default function Home() {
  return (
    <div>
      {/* Background image for entire page */}
      <div 
        className="fixed inset-0 bg-cover bg-center -z-10 bg_image"/>

      <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-md">
        <nav
          className="flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <Image
                className="h-8 w-auto rounded-md"
                src={farmImage1}
                alt="Wenchi Farm Institute logo"
                width={24}
                height={24}
              />
              <span className="text-black text-xl">Wenchi Farm Institute</span>
            </Link>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <Link
              href="/features"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600"
            >
              Features
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600"
            >
              Contact
            </Link>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Link
              href="/sign-in"
              className="text-sm font-semibold leading-6 bg-green-100 px-4 py-2 rounded-md text-green-800 hover:bg-green-200"
            >
              Sign in <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate pt-14">
          <div className="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Wenchi Farm Management System
              </h1>
              <p className="mt-6 text-lg leading-8 text-white">
                Simple tools to boost your farm productivity, track crops, and increase yields.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/sign-up"
                  className="rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-green-600 transition-colors"
                >
                  Get started
                </Link>
                <Link
                  href="/features"
                  className="text-sm font-semibold leading-6 bg-gray-100 px-5 py-3 rounded-md text-gray-900 hover:bg-gray-200 transition-colors"
                >
                  See features <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div
          className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 bg-white rounded-lg shadow-lg"
          id="features"
        >
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600">
              Farm Smarter
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Tools for Every Farmer
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Simple solutions to help Wenchi farmers manage crops and increase productivity.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl lg:mt-20 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
                      <feature.icon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* About section */}
        <div className="bg-green-50 py-16 sm:py-24 my-16 rounded-lg shadow-lg" id="about">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                About Wenchi Farm Institute
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Wenchi Farm Institute supports local farmers with modern agricultural tools and training. 
                Our crop management system was designed with Wenchi's unique farming needs in mind.
              </p>
            </div>
            <div className="mt-12 flex justify-center">
              <Image
                src={farmImage2}
                alt="Wenchi farmers"
                className="rounded-lg shadow-lg"
                width={500}
                height={400}
              />
            </div>
          </div>
        </div>

        {/* CTA section */}
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 bg-white rounded-lg shadow-lg">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Ready to start?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Join other Wenchi farmers and start improving your farm today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/sign-up"
                className="rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline-green-600 transition-colors"
              >
                Sign up for free
              </Link>
              <Link
                href="/contact"
                className="text-sm font-semibold leading-6 bg-gray-100 px-5 py-3 rounded-md text-gray-900 hover:bg-gray-200 transition-colors"
              >
                Contact us <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-6 py-12 lg:px-8 mt-16 bg-gray-50 rounded-lg">
        <div className="flex justify-center space-x-10">
          <Link href="/about" className="text-sm text-gray-600 hover:text-green-600">
            About
          </Link>
          <Link href="/features" className="text-sm text-gray-600 hover:text-green-600">
            Features
          </Link>
          <Link href="/contact" className="text-sm text-gray-600 hover:text-green-600">
            Contact
          </Link>
          <Link href="/privacy" className="text-sm text-gray-600 hover:text-green-600">
            Privacy
          </Link>
        </div>
        <p className="mt-8 text-center text-xs text-gray-500">
          &copy; 2025 Wenchi Farm Institute. All rights reserved.
        </p>
      </footer>
    </div>
  );
}