import React from "react";
import { LogOut, FileText, List } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/review"
          className="flex items-center gap-2 text-2xl font-bold"
        >
          <FileText className="w-6 h-6" />
          ReviewAI
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/review" className="hover:text-indigo-200 transition">
            New Review
          </Link>
          <Link
            to="/my-reviews"
            className="hover:text-indigo-200 transition flex items-center gap-1"
          >
            <List className="w-5 h-5" /> My Reviews
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-100 transition font-semibold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
