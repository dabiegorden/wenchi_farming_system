'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Maize from "../../../public/assets/maize.jpeg";
import Cassava from "../../../public/assets/cassava.jpeg";
import Yams from "../../../public/assets/yam.jpeg";
import Cocoyam from "../../../public/assets/cocoyam.jpeg";
import Cowpea from "../../../public/assets/cowpea.jpeg";
import Groundnut from "../../../public/assets/groundnut.jpeg";
import Vegetables from "../../../public/assets/vegetables.jpeg";
import Rice from "../../../public/assets/rice.jpeg";
import Sorghum from "../../../public/assets/sorghum.jpeg";
import Soybean from "../../../public/assets/soyabeans.jpeg";

export const cropsData = {
  majorFoodCrops: [
    { 
      name: 'Maize', 
      description: 'A staple food crop in the region. Rich in carbohydrates and widely used in both human consumption and animal feed.',
      imageUrl: Maize
    },
    { 
      name: 'Cassava', 
      description: 'An important starchy root crop. Drought-resistant and a reliable food source in the region.',
      imageUrl: Cassava
    },
    { 
      name: 'Yams', 
      description: 'A common tuber crop cultivated in the area. Provides essential carbohydrates and nutrients.',
      imageUrl: Yams
    },
    { 
      name: 'Cocoyam', 
      description: 'Another starchy root crop. Both the corm and leaves are edible and rich in nutrients.',
      imageUrl: Cocoyam
    }
  ],
  grainLegumes: [
    { 
      name: 'Cowpea', 
      description: 'An increasingly important cash crop. Rich in protein and adapts well to the local climate.',
      imageUrl: Cowpea
    },
    { 
      name: 'Groundnut', 
      description: 'Another common grain legume. Important source of protein and oil.',
      imageUrl: Groundnut
    }
  ],
  otherCrops: [
    { 
      name: 'Vegetables', 
      description: 'The region is also known for producing vegetables like tomato, pepper, eggplant, and okra.',
      imageUrl: Vegetables
    },
    { 
      name: 'Rice', 
      description: 'Rice is also cultivated in the Bono region. Provides an important source of carbohydrates.',
      imageUrl: Rice
    },
    { 
      name: 'Sorghum', 
      description: 'Sorghum is another cereal crop grown in the area. Drought-resistant and versatile.',
      imageUrl: Sorghum
    },
    { 
      name: 'Soybean', 
      description: 'Soybean is also grown in the region. High in protein and used for various products.',
      imageUrl: Soybean
    }
  ]
};

export default function Crops() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCrop, setExpandedCrop] = useState(null);


  // Filter crops based on search query and active category
  const filterCrops = () => {
    let filteredCrops = [];
    
    if (activeCategory === 'all' || activeCategory === 'majorFoodCrops') {
      filteredCrops = [...filteredCrops, ...cropsData.majorFoodCrops];
    }
    
    if (activeCategory === 'all' || activeCategory === 'grainLegumes') {
      filteredCrops = [...filteredCrops, ...cropsData.grainLegumes];
    }
    
    if (activeCategory === 'all' || activeCategory === 'otherCrops') {
      filteredCrops = [...filteredCrops, ...cropsData.otherCrops];
    }
    
    return filteredCrops.filter(crop => 
      crop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      crop.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const toggleCropExpansion = (cropName) => {
    if (expandedCrop === cropName) {
      setExpandedCrop(null);
    } else {
      setExpandedCrop(cropName);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Wenchi Agricultural Research Station</h1>
          <p className="mt-2">Crops Database and Information Center</p>
        </div>
      </header>

      {/* Search and Filter Section */}
      <section className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search crops..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-4 py-2 rounded-lg ${activeCategory === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveCategory('all')}
              >
                All Crops
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${activeCategory === 'majorFoodCrops' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveCategory('majorFoodCrops')}
              >
                Major Food Crops
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${activeCategory === 'grainLegumes' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveCategory('grainLegumes')}
              >
                Grain Legumes
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${activeCategory === 'otherCrops' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                onClick={() => setActiveCategory('otherCrops')}
              >
                Other Crops
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterCrops().map((crop) => (
            <div key={crop.name} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative w-full h-48">
                <Image 
                  src={crop.imageUrl} 
                  alt={`${crop.name} crop`}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">{crop.name}</h2>
                  <button 
                    onClick={() => toggleCropExpansion(crop.name)} 
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    {expandedCrop === crop.name ? 
                      <ChevronUp className="h-5 w-5 text-green-600" /> : 
                      <ChevronDown className="h-5 w-5 text-green-600" />
                    }
                  </button>
                </div>
                
                {expandedCrop === crop.name && (
                  <div className="mt-3">
                    <p className="text-gray-600">{crop.description}</p>
                    <div className="mt-4 flex justify-end">
                      <button className="flex items-center text-green-600 font-medium hover:text-green-800">
                        <Info className="h-4 w-4 mr-1" /> More details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {filterCrops().length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No crops found matching your search.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white mt-8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Wenchi Agricultural Research Station</h3>
              <p className="mt-1 text-sm text-green-100">Providing agricultural research and information since 1962</p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-green-100">© 2025 Wenchi Agricultural Research Station. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}