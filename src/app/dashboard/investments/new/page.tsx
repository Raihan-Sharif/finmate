'use client';

import { CreateInvestmentForm } from '@/components/investments/CreateInvestmentForm';
import { useInvestmentPortfolios } from '@/hooks/useInvestmentPortfolios';
import { useCreateInvestment } from '@/hooks/useInvestments';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function NewInvestmentPage() {
  const router = useRouter();
  const { data: portfolios = [], isLoading: portfoliosLoading } = useInvestmentPortfolios();
  const createInvestment = useCreateInvestment();

  const handleSubmit = async (data: any) => {
    try {
      console.log('🔥 NEW PAGE: Raw form data:', data);
      
      // Validate required fields that are now part of the schema-compliant data
      if (!data.total_units || data.total_units <= 0) {
        throw new Error('Total units must be greater than 0');
      }
      if (!data.average_cost || data.average_cost <= 0) {
        throw new Error('Average cost must be greater than 0');
      }
      if (!data.current_price || data.current_price <= 0) {
        throw new Error('Current price must be greater than 0');
      }
      if (!data.purchase_date) {
        throw new Error('Purchase date is required');
      }

      // The form now sends properly formatted CreateInvestmentInput data
      // No transformation needed as the form handles it
      const investmentInput = data;
      
      console.log('🔥 NEW PAGE: Transformed investment input:', investmentInput);
      
      await createInvestment.mutateAsync(investmentInput);
      toast.success('Investment created successfully!');
      router.push('/dashboard/investments');
    } catch (error) {
      console.error('Failed to create investment:', error);
      toast.error('Failed to create investment');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/investments');
  };

  if (portfoliosLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CreateInvestmentForm
        portfolios={portfolios.map(p => ({ id: p.id, name: p.name, currency: p.currency }))}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createInvestment.isPending}
      />
    </div>
  );
}