import {
  Hospital,
  LogIn,
  LogOut,
  Menu,
  UserPlus,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

import { auth } from "@/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import LandingPage from "@/pages/Landing";
import PatientFlow from "@/pages/PatientFlow";

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Failed to logout");
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#020817] border-b fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <Hospital size={28} className="text-primary" />
          <h1 className="hidden md:block font-extrabold text-2xl">
            PulseOps
          </h1>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-4">
            <Link to="/dashboard" className="text-sm">Dashboard</Link>
            <Link to="/patient-flow" className="text-sm">Patient Inflow/Outflow</Link>
            <Link to="/scheduling" className="text-sm">Surgical Schedule</Link>
            <Link to="/inventory" className="text-sm">Pharmacy Inventory</Link>
          </nav>

          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer h-9 w-9">
                  <AvatarImage src={user.photoURL || ""} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>
                  Logged in as
                  <div className="font-semibold truncate">
                    {user.displayName || user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !loading && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-800 text-white" onClick={() => navigate("/register")}>
                  Register
                </Button>
              </div>
            )
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <MobileNavbar user={user} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

const MobileNavbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const go = (path) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav className="mt-6 flex flex-col gap-3">
          <button onClick={() => go("/")}> Home </button>
          <button onClick={() => go("/dashboard")}> Dashboard </button>
          <button onClick={() => go("/patient-flow")}> Patient Flow </button>
          <button onClick={() => go("/scheduling")}> Surgical Schedule </button>
          <button onClick={() => go("/inventory")}> Pharmacy Inventory </button>

          <div className="border-t my-3" />

          {user ? (
            <Button variant="destructive" onClick={onLogout}>
              <LogOut /> Logout
            </Button>
          ) : (
            <>
              <Button onClick={() => go("/login")}>
                <LogIn /> Login
              </Button>
              <Button variant="outline" onClick={() => go("/register")}>
                <UserPlus /> Register
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
