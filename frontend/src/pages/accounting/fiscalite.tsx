import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AccountingFiscaliteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tax/vat');
  }, [router]);
  return null;
}
