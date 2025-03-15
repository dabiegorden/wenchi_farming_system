import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'About Us | Wenchi Farm Institute Crop Management System',
  description: 'Learn about the Wenchi Farm Institute Crop Management System and our mission to improve agricultural productivity.',
};

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-800 mb-4">About Wenchi Farm Institute</h1>
        <div className="h-1 w-32 bg-green-600 mb-8"></div>
      </div>

      <div className="grid md:grid-cols-2 gap-12 mb-12">
        <div>
          <p className="text-lg mb-6">
            The Wenchi Farm Institute Crop Management System is a comprehensive agricultural platform 
            designed to empower farmers with data-driven insights and tools to optimize crop production, 
            monitor field health, and manage agricultural resources efficiently.
          </p>
          <p className="text-lg mb-6">
            Established with the mission to revolutionize farming practices through technology, our 
            system combines real-time weather data, crop insights, disease monitoring, and inventory 
            management into a single, easy-to-use platform.
          </p>
          <p className="text-lg">
            Whether you&apos;re a small-scale farmer or managing large agricultural operations, our 
            tools are designed to increase productivity, reduce waste, and promote sustainable farming practices.
          </p>
        </div>
        <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
          <Image 
            src="/assets/farm3.jpeg" 
            alt="Wenchi Farm Institute fields" 
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Our System Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Weather Integration</h3>
            <p>Real-time weather data and forecasting to help plan farm activities and protect crops.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Crop Management</h3>
            <p>Comprehensive database of crops with planting guides, growth monitoring, and harvest planning.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Disease Tracking</h3>
            <p>Early detection and management recommendations for crop diseases and pests.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Land Management</h3>
            <p>Field mapping, crop rotation planning, and soil health monitoring tools.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Inventory System</h3>
            <p>Track seeds, fertilizers, pesticides, and equipment with low-stock alerts.</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-green-700 mb-3">Analytics & Reports</h3>
            <p>Data visualization and exportable reports to track progress and make informed decisions.</p>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Our Vision</h2>
        <p className="text-lg mb-4">
          At Wenchi Farm Institute, we envision a future where technology bridges the gap between 
          traditional farming wisdom and modern agricultural science. Our goal is to make advanced 
          crop management tools accessible to all farmers, improving food security and promoting 
          sustainable agricultural practices.
        </p>
      </div>

      <div className="bg-green-50 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Ready to Transform Your Farming?</h2>
        <p className="text-lg mb-6">
          Join the growing community of farmers using our crop management system to increase yields 
          and optimize resources.
        </p>
        <Link 
          href="/contact" 
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          Contact Us Today
        </Link>
      </div>
    </div>
  );
}