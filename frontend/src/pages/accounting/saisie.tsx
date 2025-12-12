import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AccountingSaisieRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accounting/entries');
  }, [router]);
  return null;
}
