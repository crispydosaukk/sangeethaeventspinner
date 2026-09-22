'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';

interface HeaderProps {
  onOpenModal?: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#F4F8F5]/95 border-b border-emerald-950/10 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center group py-0.5">
          <Image
            src="/assets/images/sangeetha-logo.png"
            alt="Sangeetha Veg Restaurant"
            width={180}
            height={62}
            className="object-contain transition-transform duration-300 group-hover:scale-105"
            style={{ maxHeight: '54px', width: 'auto' }}
            priority
          />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          <a href="#menus" className="text-gray-700 hover:text-[#06874D] transition-colors font-medium">Menus &amp; Packages</a>
          <a href="#faqs" className="text-gray-700 hover:text-[#06874D] transition-colors font-medium">FAQs</a>
          <a href="/admin" className="text-[#06874D] hover:text-emerald-900 px-3.5 py-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 hover:bg-emerald-100/80 transition-all text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06874D] animate-pulse"></span>
            Admin Portal
          </a>
          <a
            href="#book"
            className="text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
          >
            <span>Book / Enquire</span>
            <Icon name="ArrowRightIcon" size={14} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <Icon name={menuOpen ? 'XMarkIcon' : 'Bars3Icon'} size={22} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden backdrop-blur-2xl bg-[#F4F8F5] border-t border-emerald-950/10 px-6 py-5 flex flex-col gap-4 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <a href="#menus" className="text-gray-800 hover:text-[#06874D] text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>Menus &amp; Packages</a>
          <a href="#faqs" className="text-gray-800 hover:text-[#06874D] text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>FAQs</a>
          <a href="/admin" className="text-[#06874D] hover:text-emerald-900 text-sm font-medium py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>
            <span className="w-2 h-2 rounded-full bg-[#06874D]"></span>
            Admin Portal
          </a>
          <a
            href="#book"
            className="text-white font-semibold px-5 py-3 rounded-xl text-sm text-center shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
            onClick={() => setMenuOpen(false)}
          >
            Get a Quote / Book Now
          </a>
        </div>
      )}
    </nav>
  );
};

export default Header;
