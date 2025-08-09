'use client';

import { useRouter } from 'next/navigation';
import { CreateInvestmentForm } from '@/components/investments/CreateInvestmentForm';
import { useInvestmentPortfolios } from '@/hooks/useInvestmentPortfolios';
import { useCreateInvestment } from '@/hooks/useInvestments';
import toast from 'react-hot-toast';

export default function NewInvestmentPage() {
  const router = useRouter();
  const { data: portfolios = [], isLoading: portfoliosLoading } = useInvestmentPortfolios();
  const createInvestment = useCreateInvestment();

  const handleSubmit = async (data: any) => {
    try {
      await createInvestment.mutateAsync(data);
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