import React from 'react';
import AdHocPricingForm from '@/components/pricing/AdHocPricingForm';

const AdHocPricing: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ad-hoc Pricing Console</h1>
      <AdHocPricingForm />
    </div>
  );
};

export default AdHocPricing;