import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { subscribeApiLoading } from "@/lib/axiosClient";

export function useApiLoading() {
  const [isAxiosLoading, setIsAxiosLoading] = useState(false);
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  useEffect(() => {
    return subscribeApiLoading((loading) => {
      setIsAxiosLoading(loading);
    });
  }, []);

  return isAxiosLoading || isFetching > 0 || isMutating > 0;
}
