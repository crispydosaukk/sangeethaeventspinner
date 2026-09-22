import React from 'react';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050B07] border-t border-emerald-900/30 text-gray-400 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center">
            <Image
              src="/assets/images/sangeetha-logo.png"
              alt="Sangeetha Veg Restaurant"
              width={160}
              height={58}
              className="object-contain filter brightness-110 drop-shadow-md"
              style={{ maxHeight: '52px', width: 'auto' }}
            />
          </div>
          <p className="text-sm text-gray-300 max-w-md leading-relaxed">
            Premier authentic South Indian pure vegetarian catering for weddings, corporate celebrations, birthday parties, and bespoke live dosa counters in Pinner, Greater London, Harrow &amp; surrounding areas.
          </p>
          <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Booking Enquiries Open for 2026 &amp; 2027 Events
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Quick Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#menus" className="hover:text-white transition-colors">Banquet Packages</a></li>
            <li><a href="#menus" className="hover:text-white transition-colors">Live Dosa Counter</a></li>
            <li><a href="#book" className="hover:text-white transition-colors">Book Now / Enquire</a></li>
            <li><a href="#faqs" className="hover:text-white transition-colors">Frequently Asked Questions</a></li>
          </ul>
        </div>

        {/* Col 3: Contact & Legal */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Connect &amp; Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="mailto:Svrpinneruk@gmail.com" className="hover:text-emerald-300 transition-colors flex items-center gap-2">
                <Icon name="EnvelopeIcon" size={14} /> Svrpinneruk@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+447507271506" className="hover:text-emerald-300 transition-colors flex items-center gap-2">
                <Icon name="PhoneIcon" size={14} /> +44 7507 271506
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</a>
            </li>
            <li>
              <a href="/admin" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Admin Staff Login &rarr;
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-emerald-950/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Sangeetha Events Pinner. All rights reserved.</p>
        <p className="flex items-center gap-1 text-gray-400">
          Crafted with authentic tradition &amp; visual excellence.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
