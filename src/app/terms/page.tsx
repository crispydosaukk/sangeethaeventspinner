import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F4F8F5] text-gray-900 flex flex-col">
      <Header />
      
      <main className="flex-1 py-28 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-emerald-200/80 p-8 md:p-12 shadow-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            Policy &amp; Guidelines
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 font-display">
            Terms &amp; Conditions — <span className="sangeetha-text-gradient">Sangeetha Events Pinner</span>
          </h1>
          
          <div className="space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base font-medium">
            <p>
              By proceeding with a booking or catering agreement with <strong className="text-gray-900">Sangeetha Events Pinner</strong>, you agree to the following terms and conditions:
            </p>
            
            <ul className="list-disc pl-6 space-y-4">
              <li>
                <strong className="text-gray-900">25% non-refundable catering deposit</strong> is required to secure the event date and booking slot. The final invoice balance must be cleared at least 24 to 72 hours prior to the event date.
              </li>
              <li>
                Quotations provided are strictly valid for <strong className="text-gray-900">7 days</strong> from the date issued.
              </li>
              <li>
                All freshly prepared authentic South Indian food procured for an event date is strictly to be consumed on the event day and <strong className="text-gray-900">not for resale or takeaway retailing</strong>, adhering to UK food hygiene standards.
              </li>
              <li>
                Live counter and buffet service pricing is based on standard operational service hours; additional hours must be agreed upon in advance.
              </li>
              <li>
                For external delivery and logistics, Sangeetha Events ensures highest food packaging standards; client assumes venue receipt verification on delivery handover.
              </li>
              <li>
                Any allergies or specific dietary requirements (e.g. Jain, nut-free, vegan) must be confirmed in writing at least 7 days before the event.
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
