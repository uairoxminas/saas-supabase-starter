import type { MeResponse } from "@/lib/types";
import useSWR from "swr";

const useUser = () => {
  const { data, isLoading, error, mutate } = useSWR<MeResponse>("/api/app/me");

  return { user: data?.user, isLoading, error, mutate };
};

export default useUser;
