import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useOperatorData } from '../hooks/useOperatorData.js';
import { useTransitData } from '../hooks/useTransitData.js';

const OperatorContext = createContext(null);

/** Live operator data shared by every console page (one fetch + one set of socket listeners). */
export function OperatorProvider({ children }) {
  const [banner, setBanner] = useState(null);
  const transit = useTransitData();
  const operator = useOperatorData({ onNewAlert: setBanner });

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(null), 12000);
    return () => clearTimeout(timer);
  }, [banner]);

  const value = useMemo(
    () => ({ ...transit, ...operator, banner, dismissBanner: () => setBanner(null) }),
    [transit, operator, banner],
  );
  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  return useContext(OperatorContext);
}
