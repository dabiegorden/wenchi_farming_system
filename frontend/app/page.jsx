


import { Leaf, BarChart, Calendar, Users } from "lucide-react";

const features = [
  {
    name: "Crop Tracking",
    description: "Monitor growth stages and health of various crops.",
    icon: Leaf,
  },
  {
    name: "Yield Forecasting",
    description: "Predict harvest yields using advanced analytics.",
    icon: BarChart,
  },
  {
    name: "Planting Scheduler",
    description: "Optimize planting and harvesting schedules.",
    icon: Calendar,
  },
  {
    name: "Team Management",
    description: "Coordinate farm workers and assign tasks efficiently.",
    icon: Users,
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          className="flex items-center justify-between p-6 lg:px-8"
          aria-label="Global"
        >
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Wenchi Farm Institute</span>
              <img
                className="h-8 w-auto"
                src="/placeholder.svg?height=32&width=32"
                alt="Wenchi Farm Institute logo"
              />
            </a>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            <a
              href="#features"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              About
            </a>
            <a
              href="#contact"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Contact
            </a>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <a
              href="#"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Log in <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </nav>
      </header>

      <main>
        <div className="relative isolate">
          <svg
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                width={200}
                height={200}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              width="100%"
              height="100%"
              strokeWidth={0}
              fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
            />
          </svg>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                    Crop Management System for Wenchi Farm Institute
                  </h1>
                  <p className="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
                    Empower your agricultural practices with our advanced Crop
                    Management System. Designed specifically for Wenchi Farm
                    Institute, our solution helps you optimize crop yields,
                    streamline operations, and make data-driven decisions.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <a
                      href="#"
                      className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                    >
                      Get started
                    </a>
                    <a
                      href="#features"
                      className="text-sm font-semibold leading-6 text-gray-900"
                    >
                      Learn more <span aria-hidden="true">→</span>
                    </a>
                  </div>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=528&width=528"
                        alt="Crop field"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=792&width=792"
                        alt="Farmer using tablet"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                    <div className="relative">
                      <img
                        src="/placeholder.svg?height=792&width=792"
                        alt="Crop analysis"
                        className="aspect-[2/3] w-full rounded-xl bg-gray-900/5 object-cover shadow-lg"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-900/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature section */}
        <div
          className="mx-auto mt-32 max-w-7xl px-6 sm:mt-56 lg:px-8"
          id="features"
        >
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-green-600">
              Manage smarter
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage your crops
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our Crop Management System provides a comprehensive suite of tools
              to help you maximize your farm's potential and streamline your
              agricultural operations.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
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

        {/* CTA section */}
        <div className="mx-auto mt-32 max-w-7xl sm:mt-56 px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to grow your farm's potential?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join Wenchi Farm Institute in embracing modern agricultural
              practices. Start using our Crop Management System today and see
              the difference it can make.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="#"
                className="rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
              >
                Get started
              </a>
              <a
                href="#"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto mt-32 max-w-7xl overflow-hidden px-6 pb-20 sm:mt-56 sm:pb-24 lg:px-8">
        <nav
          className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12"
          aria-label="Footer"
        >
          <div className="pb-6">
            <a
              href="#"
              className="text-sm leading-6 text-gray-600 hover:text-gray-900"
            >
              About
            </a>
          </div>
          <div className="pb-6">
            <a
              href="#"
              className="text-sm leading-6 text-gray-600 hover:text-gray-900"
            >
              Blog
            </a>
          </div>
          <div className="pb-6">
            <a
              href="#"
              className="text-sm leading-6 text-gray-600 hover:text-gray-900"
            >
              Jobs
            </a>
          </div>
          <div className="pb-6">
            <a
              href="#"
              className="text-sm leading-6 text-gray-600 hover:text-gray-900"
            >
              Press
            </a>
          </div>
          <div className="pb-6">
            <a
              href="#"
              className="text-sm leading-6 text-gray-600 hover:text-gray-900"
            >
              Partners
            </a>
          </div>
        </nav>
        <p className="mt-10 text-center text-xs leading-5 text-gray-500">
          &copy; 2023 Wenchi Farm Institute. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
