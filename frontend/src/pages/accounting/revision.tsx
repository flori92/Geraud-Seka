import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AccountingRevisionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accounting/balance');
  }, [router]);
  return null;
}
