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
      
      // Validate required fields
      if (!data.initial_amount || data.initial_amount <= 0) {
        throw new Error('Initial amount must be greater than 0');
      }
      if (!data.current_price || data.current_price <= 0) {
        throw new Error('Current price must be greater than 0');
      }

      // Transform CreateInvestmentRequest to CreateInvestmentInput  
      const investmentInput = {
        portfolio_id: data.portfolio_id,
        name: data.name,
        type: data.type,
        total_units: Number((data.initial_amount / data.current_price).toFixed(4)), // Calculate units from amount and price
        average_cost: Number(data.current_price.toFixed(2)),
        current_price: Number(data.current_price.toFixed(2)),
        currency: data.currency || 'BDT',
        purchase_date: new Date().toISOString().split('T')[0], // Today's date
        // Optional fields with defaults
        symbol: data.symbol || '',
        tags: data.tags || [],
        notes: data.notes || '',
        ...(data.target_date && { maturity_date: data.target_date }),
        ...(data.target_amount && { metadata: { target_amount: data.target_amount } })
      };
      
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