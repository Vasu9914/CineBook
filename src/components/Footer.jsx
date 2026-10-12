import React from 'react';
import { Film, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-[#080b12] border-t border-slate-800 text-slate-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">
                Cine<span className="text-red-500">Book</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your ultimate movie ticket booking destination. Experience IMAX, Dolby Atmos, and 4DX with seamless real-time seat reservation.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Movies</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-red-400 transition-colors">Now Showing</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Upcoming Releases</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">IMAX Experience</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Trending Top Rated</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Cinemas</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-red-400 transition-colors">PVR Cinemas</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">INOX Multiplex</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Cinepolis India</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Theatre Locator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-red-400 transition-colors">Help & FAQs</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-red-400 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CineBook Ticket Booking System. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Crafted with <Heart className="w-3.5 h-3.5 text-red-500 mx-1 fill-red-500" /> for cinema lovers
          </p>
        </div>
      </div>
    </footer>
  );
};
