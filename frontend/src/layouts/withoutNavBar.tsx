import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const LayoutWithoutNavBar = ({ children, className = "" }: LayoutProps) => {
  return (
    <div className="h-[100dvh] w-full overflow-hidden flex justify-center">
      <div className={cn("w-full max-w-[425px] flex flex-col items-center relative", className)}>
        {children}
      </div>
    </div>
  );
};
