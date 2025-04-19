// components/UpgradePlanModal.tsx
'use client';

import { useState } from 'react';
import { X, Check, CreditCard, Zap } from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$9.99',
    period: 'month',
    credits: 100,
    features: [
      '100 credits per month',
      'Standard code generation',
      'Email support',
      'Access to all section types'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19.99',
    period: 'month',
    credits: 300,
    popular: true,
    features: [
      '300 credits per month',
      'Advanced code generation',
      'Priority email support',
      'Access to all section types',
      'Custom code optimization'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$49.99',
    period: 'month',
    credits: 1000,
    features: [
      '1000 credits per month',
      'Premium code generation',
      'Priority phone support',
      'Access to all section types',
      'Custom code optimization',
      'Dedicated account manager',
      'API access'
    ]
  }
];

export default function UpgradePlanModal({ isOpen, onClose }: UpgradePlanModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [showComingSoon, setShowComingSoon] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = () => {
    // Show coming soon message instead of processing payment
    setShowComingSoon(true);
    
    // Hide coming soon message after 3 seconds
    setTimeout(() => {
      setShowComingSoon(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-sm md:max-w-4xl p-4 md:p-6 relative animate-fadeIn">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Coming Soon Alert */}
        {showComingSoon && (
          <div className="absolute top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-300 dark:border-yellow-700 p-3 text-center rounded-t-lg z-20">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Paid plans coming soon! We&apos;re still working on this feature.
            </p>
          </div>
        )}
        
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upgrade Your Plan
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Choose the plan that works best for you and get more credits to generate Shopify code.
          </p>
        </div>

        {/* Plans with hidden scrollbar and no arrows */}
        <div 
          className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible gap-4 md:gap-6 mb-6 md:mb-8 pb-2 snap-x snap-mandatory no-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`rounded-lg border snap-center flex-shrink-0 w-[85%] md:w-auto ${
                selectedPlan === plan.id 
                  ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' 
                  : 'border-gray-200 dark:border-gray-700'
              } p-4 md:p-6 relative transition-all mt-6 md:mt-0 ${
                plan.popular ? 'md:-mt-4 md:mb-4' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                  <span className="bg-indigo-600 text-white text-sm font-medium px-4 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              
              <div className="flex items-baseline mb-4">
                <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /{plan.period}
                </span>
              </div>
              
              <div className="flex items-center mb-4 text-indigo-600 dark:text-indigo-400">
                <Zap className="h-5 w-5 mr-2" />
                <span className="font-medium">{plan.credits} credits</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  selectedPlan === plan.id
                    ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                } transition-colors`}
              >
                {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
            <p className="text-sm">
              Current plan: <span className="font-medium">Free</span>
            </p>
            <p className="text-xs mt-1">
              You will be charged on a monthly basis. Cancel anytime.
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleUpgrade}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-md font-medium bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white"
          >
            <CreditCard className="h-5 w-5" />
            <span>Upgrade to {plans.find(p => p.id === selectedPlan)?.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
