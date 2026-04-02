import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  wrapperClassName?: string;
  containerClassName?: string;
}

const navItems = [
  { path: "/", key: "home", label: "Home", icon: "🏠" },
  { path: "/practice", key: "practice", label: "Practice", icon: "🎙️" },
  { path: "/profile", key: "profile", label: "Profile", icon: "👤" },
];

export const LayoutWithNavBar = ({ children, wrapperClassName = "", containerClassName = "" }: LayoutProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = navItems.find((i) => i.path === pathname)?.key;

  return (
    <div className={cn("h-[100dvh] w-full overflow-hidden flex justify-center", wrapperClassName)}>
      <div className={cn("w-full max-w-[425px] flex flex-col items-center relative", containerClassName)}>
        {children}

        {/* Bottom Navbar */}
        <nav className="absolute bottom-0 left-0 w-full max-w-[425px] mx-auto right-0 bg-content1/90 backdrop-blur-md border-t border-content1-100/30 flex justify-around items-center py-3 px-4">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-150",
                active === item.key
                  ? "text-primary-200"
                  : "text-secondary-150 opacity-60 active:scale-90"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-h6 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
