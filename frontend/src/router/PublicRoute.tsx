import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";
import { ROUTES } from "@/utils";

export default function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to={ROUTES.HOME} replace />;
  return <>{children}</>;
}
