import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AccountingEtatsSyntheseRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/reports/balance-sheet');
  }, [router]);
  return null;
}
