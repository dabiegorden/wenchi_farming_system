'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('core');
  
  const features = {
    core: [
      {
        title: 'Weather Integration',
        description: 'Real-time weather data and forecasting to help plan farm activities and protect crops.',
        icon: '☁️'
      },
      {
        title: 'Crop Database',
        description: 'Comprehensive database of crops with planting guides, growth cycles, and care instructions.',
        icon: '🌱'
      },
      {
        title: 'Land Management',
        description: 'Organize and map your fields, track crop rotation, and plan efficient land usage.',
        icon: '🗺️'
      },
      {
        title: 'User Authentication',
        description: 'Secure multi-role access system with different permissions for administrators, managers, and field workers.',
        icon: '🔐'
      }
    ],
    monitoring: [
      {
        title: 'Crop Monitoring',
        description: 'Track growth stages, health metrics, and yield projections for all your crops.',
        icon: '📊'
      },
      {
        title: 'Disease Tracking',
        description: 'Identify and monitor crop diseases with recommendations for treatment and prevention.',
        icon: '🔍'
      },
      {
        title: 'Inventory Management',
        description: 'Track seeds, fertilizers, pesticides, and equipment with automatic low-stock alerts.',
        icon: '📦'
      },
      {
        title: 'Basic Reporting',
        description: 'Generate simple reports on crop performance, inventory usage, and field productivity.',
        icon: '📝'
      }
    ],
    advanced: [
      {
        title: 'Predictive Analytics',
        description: 'AI-powered predictions for optimal planting times, potential issues, and yield forecasts.',
        icon: '🧠'
      },
      {
        title: 'Advanced Reporting',
        description: 'Customizable dashboards and comprehensive exportable reports for in-depth analysis.',
        icon: '📈'
      },
      {
        title: 'Full Inventory Control',
        description: 'Advanced inventory tracking with supply chain integration and cost analysis.',
        icon: '⚙️'
      },
      {
        title: 'Agricultural News',
        description: 'Curated news and updates relevant to your crops and farming region.',
        icon: '📰'
      }
    ]
  };

  return (
    <main className="min-h-screen bg-green-50">
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Comprehensive Farm Management Features</h1>
          <p className="text-xl max-w-3xl mx-auto text-center">
            Our system provides all the tools you need to effectively manage your agricultural operations at Wenchi Farm Institute.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setActiveTab('core')}
              className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'core' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Core Features
            </button>
            <button 
              onClick={() => setActiveTab('monitoring')}
              className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'monitoring' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Monitoring & Management
            </button>
            <button 
              onClick={() => setActiveTab('advanced')}
              className={`px-6 py-3 rounded-lg font-medium transition ${activeTab === 'advanced' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              Advanced Features
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features[activeTab].map((feature, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-green-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System Architecture */}
      <section className="py-16 bg-green-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-green-800">System Architecture</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-green-700">Built with modern technologies:</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Node.js & Express.js:</strong> Robust backend API services</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>MongoDB with Mongoose:</strong> Flexible and scalable database</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Next.js 13.5:</strong> Fast, responsive user interface</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Responsive Design:</strong> Works on any device</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>Data Visualization:</strong> Interactive charts and reports</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span><strong>API Integration:</strong> Weather data and more</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-green-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to optimize your farm operations?</h2>
          <p className="text-xl mb-8">Contact us today to learn more about how our system can help Wenchi Farm Institute.</p>
          <Link 
            href="/contact" 
            className="inline-block bg-white text-green-700 px-8 py-3 rounded-lg font-bold text-lg hover:bg-green-100 transition"
          >
            Get in Touch
          </Link>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/" 
              className="px-6 py-3 rounded-lg font-medium bg-gray-100 hover:bg-gray-200"
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className="px-6 py-3 rounded-lg font-medium bg-gray-100 hover:bg-gray-200"
            >
              About
            </Link>
            <Link 
              href="/contact" 
              className="px-6 py-3 rounded-lg font-medium bg-gray-100 hover:bg-gray-200"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}