'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { collection, addDoc, onSnapshot, doc } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  NEW_PACKAGES as DEFAULT_NEW_PACKAGES,
  MENU_CATEGORIES as DEFAULT_MENU_CATEGORIES,
  LIVE_DOSA_PARTY_MENU as DEFAULT_LIVE_DOSA_PARTY_MENU,
  EXTRAS as DEFAULT_EXTRAS,
  TABLE_SERVICE as DEFAULT_TABLE_SERVICE,
  KIDS_PRICING as DEFAULT_KIDS_PRICING,
  STANDARD_SETUP as DEFAULT_STANDARD_SETUP,
  TERMS_AND_CONDITIONS as DEFAULT_TERMS_AND_CONDITIONS,
  DRY_HIRE_PRICES as DEFAULT_DRY_HIRE_PRICES,
} from '@/app/data/menuData';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_FAQS,
  HeroContent,
  FaqItem,
} from '@/app/data/defaultContent';

const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Graduation', 'Other'];

type MenuTab = 'packages' | 'menu' | 'live' | 'extras';

export default function HomePage() {
  const [menus, setMenus] = useState({
    NEW_PACKAGES: DEFAULT_NEW_PACKAGES,
    MENU_CATEGORIES: DEFAULT_MENU_CATEGORIES,
    LIVE_DOSA_PARTY_MENU: DEFAULT_LIVE_DOSA_PARTY_MENU,
    EXTRAS: DEFAULT_EXTRAS,
    TABLE_SERVICE: DEFAULT_TABLE_SERVICE,
    KIDS_PRICING: DEFAULT_KIDS_PRICING,
    STANDARD_SETUP: DEFAULT_STANDARD_SETUP,
    TERMS_AND_CONDITIONS: DEFAULT_TERMS_AND_CONDITIONS,
    DRY_HIRE_PRICES: DEFAULT_DRY_HIRE_PRICES,
  });

  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'menus'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMenus({
          NEW_PACKAGES: data.NEW_PACKAGES || data.BANQUET_PACKAGES || DEFAULT_NEW_PACKAGES,
          MENU_CATEGORIES: data.MENU_CATEGORIES || DEFAULT_MENU_CATEGORIES,
          LIVE_DOSA_PARTY_MENU: data.LIVE_DOSA_PARTY_MENU || DEFAULT_LIVE_DOSA_PARTY_MENU,
          EXTRAS: data.EXTRAS || DEFAULT_EXTRAS,
          TABLE_SERVICE: data.TABLE_SERVICE || DEFAULT_TABLE_SERVICE,
          KIDS_PRICING: data.KIDS_PRICING || DEFAULT_KIDS_PRICING,
          STANDARD_SETUP: data.STANDARD_SETUP || DEFAULT_STANDARD_SETUP,
          TERMS_AND_CONDITIONS: data.TERMS_AND_CONDITIONS || DEFAULT_TERMS_AND_CONDITIONS,
          DRY_HIRE_PRICES: data.DRY_HIRE_PRICES || DEFAULT_DRY_HIRE_PRICES,
        });
      }
    }, (err) => {
      console.warn("Firestore menu sync notice:", err.message);
    });
  }, []);

  const [pricingDetails, setPricingDetails] = useState({
    depositPercentage: 30,
  });

  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'pricing_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPricingDetails({
          depositPercentage: data.depositPercentage !== undefined ? data.depositPercentage : 30,
        });
      }
    }, (err) => {
      console.warn("Firestore pricing details sync notice:", err.message);
    });
  }, []);

  const [formSettings, setFormSettings] = useState({
    timeSlots: ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
    partyHallTimeSlots: ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
    outdoorTimeSlots: ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)']
  });

  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'form_settings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormSettings({
          timeSlots: data.timeSlots || ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
          partyHallTimeSlots: data.partyHallTimeSlots || data.timeSlots || ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)'],
          outdoorTimeSlots: data.outdoorTimeSlots || data.timeSlots || ['Lunch (12:00pm - 4:00pm)', 'Dinner (6:00pm - 11:30pm)']
        });
      }
    }, (err) => {
      console.warn("Firestore form settings sync notice:", err.message);
    });
  }, []);

  const [minGuests, setMinGuests] = useState(30);
  React.useEffect(() => {
    return onSnapshot(doc(db, 'site_data', 'venue_details'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMinGuests(Number(data.minGuests) || 30);
      }
    }, (err) => {
      console.warn("Firestore venue details sync notice:", err.message);
    });
  }, []);

  React.useEffect(() => {
    return onSnapshot(collection(db, 'blocked_dates'), (snapshot) => {
      const dates = snapshot.docs.map(doc => doc.id);
      setBlockedDates(dates);
    }, (err) => {
      console.warn("Firestore blocked dates sync notice:", err.message);
    });
  }, []);

  const [heroContent, setHeroContent] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);

  React.useEffect(() => {
    return onSnapshot(
      doc(db, 'site_data', 'hero_content'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeroContent({
            badgeText: data.badgeText !== undefined ? data.badgeText : DEFAULT_HERO_CONTENT.badgeText,
            titleLine1: data.titleLine1 !== undefined ? data.titleLine1 : DEFAULT_HERO_CONTENT.titleLine1,
            titleHighlight: data.titleHighlight !== undefined ? data.titleHighlight : DEFAULT_HERO_CONTENT.titleHighlight,
            subtitle: data.subtitle !== undefined ? data.subtitle : DEFAULT_HERO_CONTENT.subtitle,
            tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : DEFAULT_HERO_CONTENT.tags,
            primaryBtnText: data.primaryBtnText !== undefined ? data.primaryBtnText : DEFAULT_HERO_CONTENT.primaryBtnText,
            secondaryBtnText: data.secondaryBtnText !== undefined ? data.secondaryBtnText : DEFAULT_HERO_CONTENT.secondaryBtnText,
          });
        }
      },
      (err) => console.warn("Firestore hero_content notice:", err.message)
    );
  }, []);

  React.useEffect(() => {
    return onSnapshot(
      doc(db, 'site_data', 'faqs'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setFaqs(data.list);
          }
        }
      },
      (err) => console.warn("Firestore faqs notice:", err.message)
    );
  }, []);

  const { NEW_PACKAGES, MENU_CATEGORIES, LIVE_DOSA_PARTY_MENU, EXTRAS, TABLE_SERVICE, KIDS_PRICING, STANDARD_SETUP, TERMS_AND_CONDITIONS, DRY_HIRE_PRICES } = menus;

  const [bookingForm, setBookingForm] = useState({
    name: '', email: '', phone: '', eventType: '', serviceType: '', date: '', timeOfDay: '', guests: '', message: '', selectedPackage: '', postCode: '', address: ''
  });

  const handleEnquireNow = (packageName: string) => {
    setBookingForm(prev => ({ ...prev, selectedPackage: packageName }));
    const el = document.getElementById('book');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [submitted, setSubmitted] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<MenuTab>('packages');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customHomeAlert, setCustomHomeAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [phoneError, setPhoneError] = useState('');

  const validateUKPhone = (digits: string) => {
    const cleaned = digits.replace(/\s/g, '');
    if (cleaned === '') return true;
    if (/[^\d]/.test(cleaned)) return false;
    // Accept: 07XXXXXXXXX (10 local digits starting with 07) or 7XXXXXXXXX (9 local digits starting with 7)
    return /^(07\d{9}|7\d{9})$/.test(cleaned);
  };

  const handlePhoneChange = (digits: string) => {
    setBookingForm({ ...bookingForm, phone: digits });
    if (digits && !validateUKPhone(digits)) {
      setPhoneError('Enter a valid UK number (e.g. 07700 900000)');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingForm.phone && !validateUKPhone(bookingForm.phone)) {
      setPhoneError('Enter a valid UK number (e.g. 07700 900000)');
      return;
    }
    setIsSubmitting(true);
    if (blockedDates.includes(bookingForm.date)) {
      setCustomHomeAlert({
        message: "This date is unfortunately fully booked or unavailable. Please choose another date.",
        type: 'error'
      });
      setIsSubmitting(false);
      return;
    }
    try {
      const fullPhone = bookingForm.phone ? `+44${bookingForm.phone.replace(/^0/, '').replace(/\s/g, '')}` : '';
      const guestCount = Number(bookingForm.guests) || 0;
      
      if (guestCount < minGuests) {
        setCustomHomeAlert({
          message: `The minimum number of guests required is ${minGuests}. We cannot accept orders below this amount.`,
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      const selectedPkg = NEW_PACKAGES.find(p => p.name === bookingForm.selectedPackage);
      const isLiveDosa = bookingForm.selectedPackage === 'Outdoor Live Dosa Party';
      let selectedExtra = null;
      if (!selectedPkg && !isLiveDosa) {
         selectedExtra = EXTRAS?.find((e: any) => e.name === bookingForm.selectedPackage);
      }
      
      let baseAmount = 0;
      if (selectedPkg) {
        baseAmount = selectedPkg.pricePerPerson * guestCount;
      } else if (isLiveDosa) {
        // live dosa party base estimation
        let dosaPrice = 11.00;
        if (bookingForm.date) {
          const d = new Date(bookingForm.date);
          const day = d.getDay();
          if (day === 0 || day === 6) {
            dosaPrice = 12.00;
          }
        }
        baseAmount = dosaPrice * guestCount;
      } else if (selectedExtra) {
        baseAmount = selectedExtra.price;
      }
      
      const deposit = baseAmount > 0 ? Math.min(baseAmount, pricingDetails.depositPercentage) : 0;
      
      await addDoc(collection(db, 'booking_requests'), {
        name: bookingForm.name,
        email: bookingForm.email,
        phone: fullPhone,
        eventType: bookingForm.eventType,
        serviceType: bookingForm.serviceType,
        date: bookingForm.date,
        timeOfDay: bookingForm.timeOfDay,
        guests: guestCount,
        message: bookingForm.message,
        package: bookingForm.selectedPackage || 'Not Selected',
        postCode: bookingForm.postCode,
        address: bookingForm.address,
        baseAmount,
        deposit,
        extraCharges: [],
        createdAt: new Date().toISOString()
      });

      // Trigger email notification via Firebase Cloud Functions
      try {
        const sendBookingEmail = httpsCallable(functions, 'sendBookingEmail');
        await sendBookingEmail({
          name: bookingForm.name,
          email: bookingForm.email,
          phone: fullPhone,
          eventType: bookingForm.eventType,
          serviceType: bookingForm.serviceType,
          date: bookingForm.date,
          timeOfDay: bookingForm.timeOfDay,
          guests: guestCount,
          message: bookingForm.message,
          package: bookingForm.selectedPackage || 'Not Selected',
        });
      } catch (emailError) {
        console.error("Failed to send notification email:", emailError);
        // We do not stop the user flow if the email fails, as the booking is already recorded
      }

      setSubmitted(true);
      setPhoneError('');
      setBookingForm({ name: '', email: '', phone: '', eventType: '', serviceType: '', date: '', timeOfDay: '', guests: '', message: '', selectedPackage: '', postCode: '', address: '' });
    } catch (error: any) {
      console.error("Error submitting request: ", error);
      setCustomHomeAlert({
        message: "Error submitting: " + (error?.message || "Unknown error"),
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSection(prev => prev === key ? null : key);
  };

﻿  return (
    <div className="min-h-screen bg-[#070F0A] text-gray-100 overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header onOpenModal={() => {}} />

      {/* ─── HERO WITH ATMOSPHERIC BACKGROUND IMAGE ─── */}
      <section className="relative pt-28 pb-16 px-6 min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark Luxury Vignette Overlay */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{ backgroundImage: "url('/assets/images/hero-catering-bg.jpg')" }}
        />
        {/* Multilayered cinematic gradient overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/95 via-black/80 to-black/90 md:from-black/90 md:via-black/75 md:to-black/85" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0E0906] via-transparent to-black/60" />
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-6">

          {/* ── Left Column: Compelling Narrative ── */}
          <div className="flex-1 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 backdrop-blur-md shadow-lg shadow-emerald-950/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                {heroContent.badgeText}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              {heroContent.titleLine1} <br className="hidden sm:inline" />
              <span className="gold-text-gradient font-display">{heroContent.titleHighlight}</span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl lg:mx-0 mx-auto leading-relaxed">
              {heroContent.subtitle}
            </p>

            {/* Value Highlights Pill Tags */}
            <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-2">
              {heroContent.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-gray-300 backdrop-blur-md flex items-center gap-1.5"
                >
                  <span className="text-amber-400">{tag.icon}</span> {tag.text}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-3">
              <a
                href="#menus"
                className="text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl hover:shadow-red-500/25 hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
              >
                <span>{heroContent.primaryBtnText}</span>
                <Icon name="ArrowDownIcon" size={16} />
              </a>
              <a
                href="#book"
                className="glass-card-dark text-gray-200 hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:border-emerald-400/50 flex items-center justify-center gap-2"
              >
                <span>{heroContent.secondaryBtnText}</span>
                <Icon name="CalendarDaysIcon" size={16} />
              </a>
            </div>
          </div>
﻿          {/* ── Right Column: Modern Glassmorphic Booking Form ── */}
          <div id="book" className="w-full lg:w-[490px] flex-shrink-0">
            <div className="glass-card-gold rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 text-center mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                  <span>Request an Event Booking</span>
                </h2>
                <p className="text-xs text-amber-200/80 mt-1">
                  Fill in your event details below to receive a personalized quote within 24 hours.
                </p>
              </div>

              {customHomeAlert && (
                <div className={`mb-4 p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${customHomeAlert.type === 'error' ? 'bg-red-950/50 border-red-500/40 text-red-200' : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'}`}>
                  <Icon name={customHomeAlert.type === 'error' ? 'ExclamationTriangleIcon' : 'CheckCircleIcon'} size={18} />
                  <span>{customHomeAlert.message}</span>
                </div>
              )}

              {submitted ? (
                <div className="text-center py-10 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-md">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Icon name="CheckIcon" size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Booking Enquiry Received!</h3>
                  <p className="text-xs text-emerald-200/80 max-w-xs mx-auto mb-6 leading-relaxed">
                    Thank you for choosing Sangeetha Events Pinner. Our catering team will review your requirements and reach out promptly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md"
                    style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.name}
                        onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                        placeholder="e.g. Anand Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">UK Phone *</label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full bg-white/5 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-white/15 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20'}`}
                        placeholder="07700 900000"
                      />
                      {phoneError && <span className="text-[11px] text-red-400 mt-1 block">{phoneError}</span>}
                    </div>
                  </div>

                  {/* Email & Event Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                        placeholder="name@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Event Type *</label>
                      <select
                        required
                        value={bookingForm.eventType}
                        onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                        className="w-full bg-[#0A1810] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                      >
                        <option value="">Select type</option>
                        {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Service Type */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-200/90 mb-1">Service Format *</label>
                    <select
                      required
                      value={bookingForm.serviceType}
                      onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                      className="w-full bg-[#0A1810] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                    >
                      <option value="">Select Service Type</option>
                      <option value="Outdoor Catering">Outdoor Catering (At your venue / home)</option>
                      <option value="Party Hall Booking">In-House Party Hall Booking (Pinner)</option>
                    </select>
                  </div>

                  {/* Address & Postcode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Event Address *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.address}
                        onChange={(e) => setBookingForm({ ...bookingForm, address: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                        placeholder="Street / Hall Address"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Event Postcode *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.postCode}
                        onChange={(e) => setBookingForm({ ...bookingForm, postCode: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                        placeholder="e.g. RG1 1AA"
                      />
                    </div>
                  </div>

                  {/* Preferred Package */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-200/90 mb-1 flex items-center justify-between">
                      <span>Preferred Catering Package</span>
                      {bookingForm.selectedPackage && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-amber-300 border border-emerald-500/30">
                          Selected
                        </span>
                      )}
                    </label>
                    <select
                      value={bookingForm.selectedPackage}
                      onChange={(e) => setBookingForm({ ...bookingForm, selectedPackage: e.target.value })}
                      className="w-full bg-[#0A1810] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                    >
                      <option value="">No specific package – help me choose</option>
                      <optgroup label="── Banquet Packages ──">
                        {NEW_PACKAGES.map((pkg) => (
                          <option key={pkg.id} value={pkg.name}>
                            {pkg.name} — £{pkg.pricePerPerson}/guest
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="── Live Dosa Experience ──">
                        <option value="Live Dosa Party (Weekday: £11 / Weekend: £12)">Live Dosa Party Counter</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Date, Time & Guest count */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="w-full bg-[#0A1810] border border-white/15 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Time Slot *</label>
                      <select
                        required
                        value={bookingForm.timeOfDay}
                        onChange={(e) => setBookingForm({ ...bookingForm, timeOfDay: e.target.value })}
                        className="w-full bg-[#0A1810] border border-white/15 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                      >
                        <option value="">Select Time</option>
                        {formSettings.timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-200/90 mb-1">Guests * (Min {minGuests})</label>
                      <input
                        type="number"
                        required
                        min={minGuests}
                        max={500}
                        value={bookingForm.guests}
                        onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all"
                        placeholder={`Min ${minGuests}`}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-emerald-200/90 mb-1">Special Preferences / Dietary Notes</label>
                    <textarea
                      rows={2}
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 transition-all resize-none"
                      placeholder="e.g. Jain dietary preferences, additional dessert stations, spice level..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-red-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed text-sm"
                    style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Processing Enquiry...
                      </span>
                    ) : (
                      <>
                        <Icon name="CalendarDaysIcon" size={17} />
                        <span>Submit Booking Enquiry</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ─── HIGHLIGHT METRICS STRIP ─── */}
      <section className="relative z-20 py-8 px-6 border-y border-white/10 bg-[#0A160F]">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '500+', label: 'Celebrations Hosted' },
            { value: '500', label: 'Max Guest Capacity' },
            { value: '4.9 ★', label: 'Average Client Rating' },
            { value: '100%', label: 'Pure Veg Fresh Preparation' },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-extrabold gold-text-gradient">{stat.value}</div>
              <div className="text-xs text-gray-400 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
﻿      {/* ─── CATERING SERVICES SECTION ─── */}
      <section id="services" className="py-20 px-6 bg-[#070F0A]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              Our Core Services
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Bespoke Catering Tailored For Every Occasion</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Whether celebrating a wedding, milestone birthday, or hosting an intimate family ceremony, we provide comprehensive catering setups with authentic heritage taste.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="glass-card-dark rounded-3xl p-8 hover:border-emerald-400/40 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-amber-400 text-2xl group-hover:scale-110 transition-transform">
                  🥞
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Live Dosa Party Experience</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  On-site master chefs preparing sizzling hot crisp dosas, uthappams, piping sambar, and an assortment of fresh chutneys directly in front of your guests.
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">From £11.00 / guest</span>
                <a href="#book" onClick={() => handleEnquireNow('Live Dosa Party (Weekday: £11 / Weekend: £12)')} className="text-xs font-bold text-white hover:text-emerald-300 flex items-center gap-1">
                  Enquire Now →
                </a>
              </div>
            </div>

            {/* Service 2 */}
            <div className="glass-card-dark rounded-3xl p-8 hover:border-emerald-400/40 transition-all duration-300 group flex flex-col justify-between border-emerald-500/30 shadow-lg shadow-emerald-950/20">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-2xl group-hover:scale-110 transition-transform">
                  🍛
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Grand Banquet Packages</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Sumptuous multi-course feast featuring premium starters, aromatic curries, traditional biryanis, warm breads, and artisanal Indian desserts.
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">5 Distinct Packages</span>
                <a href="#menus" className="text-xs font-bold text-white hover:text-emerald-300 flex items-center gap-1">
                  View Packages →
                </a>
              </div>
            </div>

            {/* Service 3 */}
            <div className="glass-card-dark rounded-3xl p-8 hover:border-emerald-400/40 transition-all duration-300 group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-amber-400 text-2xl group-hover:scale-110 transition-transform">
                  🏛️
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">Party Hall &amp; Dry Hire</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Dedicated in-house banquet facilities equipped with dining seating, audio systems, ambient lighting, and full kitchen amenities in Pinner & Greater London.
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 mt-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-400">Full Setup &amp; Service</span>
                <a href="#book" onClick={() => handleEnquireNow('In-House Party Hall')} className="text-xs font-bold text-white hover:text-emerald-300 flex items-center gap-1">
                  Enquire Hall →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MENUS & PACKAGES SHOWCASE ─── */}
      <section id="menus" className="py-20 px-6 bg-[#050B07] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              Transparent Pricing &amp; Menus
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Carefully Crafted Banquet Packages</h2>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Every package is designed to delight your guests with genuine South Indian gourmet flavours. Select any package to pre-fill your booking enquiry.
            </p>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {([
              { id: 'packages', label: '🎁 Banquet Packages' },
              { id: 'menu', label: '🍛 Detailed Menu Items' },
              { id: 'live', label: '🍳 Live Dosa Counter' },
            ] as { id: MenuTab; label: string }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMenuTab(tab.id)}
                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${activeMenuTab === tab.id ? 'text-white shadow-xl shadow-emerald-950/40 scale-105' : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}
                style={activeMenuTab === tab.id ? { background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' } : {}}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: PACKAGES */}
          {activeMenuTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {NEW_PACKAGES.map((pkg: any) => (
                <div
                  key={pkg.id}
                  className="glass-card-dark rounded-3xl p-7 flex flex-col justify-between hover:border-emerald-400/50 hover:-translate-y-1 transition-all duration-300 relative group"
                >
                  {pkg.tag && (
                    <div className="absolute top-5 right-5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-600/90 text-white shadow-md">
                      {pkg.tag}
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-3xl font-extrabold gold-text-gradient">£{pkg.pricePerPerson}</span>
                      <span className="text-xs text-gray-400 font-medium">/ person</span>
                      {pkg.guestLabel && <span className="text-[11px] text-amber-300/80 ml-2">({pkg.guestLabel})</span>}
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-400/90 mb-3">Included Courses:</div>
                      <ul className="space-y-2.5">
                        {pkg.items.map((item: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-2.5 leading-relaxed">
                            <span className="text-amber-400 mt-0.5 font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {pkg.complimentary && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-amber-300 italic mb-6">
                        🎁 {pkg.complimentary}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleEnquireNow(pkg.name)}
                    className="w-full py-3 rounded-xl font-bold text-white text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-red-500/20 flex items-center justify-center gap-2 group-hover:scale-[1.01]"
                    style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
                  >
                    <span>Enquire with this Package</span>
                    <Icon name="ArrowRightIcon" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: DETAILED MENU CATEGORIES */}
          {activeMenuTab === 'menu' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {MENU_CATEGORIES && Object.entries(MENU_CATEGORIES).map(([catKey, cat]: [string, any]) => (
                <div key={catKey} className="glass-card-dark rounded-2xl border border-white/10 overflow-hidden transition-all">
                  <button
                    onClick={() => toggleSection(catKey)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🍲</span>
                      <div>
                        <h4 className="text-base font-bold text-white">{cat.title || catKey}</h4>
                        <span className="text-xs text-amber-400">{cat.items?.length || 0} Specialties Available</span>
                      </div>
                    </div>
                    <Icon name={expandedSection === catKey ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={20} className="text-gray-400" />
                  </button>
                  {expandedSection === catKey && (
                    <div className="px-6 pb-6 pt-2 border-t border-white/10 bg-black/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {cat.items?.map((dish: string, idx: number) => (
                          <div key={idx} className="text-xs text-gray-300 flex items-center gap-2 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{dish}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: LIVE DOSA PARTY MENU */}
          {activeMenuTab === 'live' && (
            <div className="glass-card-dark rounded-3xl p-8 max-w-4xl mx-auto border border-emerald-500/30">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20">
                  Interactive Live Cooking Counter
                </span>
                <h3 className="text-2xl font-bold text-white mt-2">Live Dosa Party Inclusions</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Weekday: £11.00/person (Min 35 guests) • Weekend/Bank Holiday: £12.00/person (Min 40 guests)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">Sizzling Dosa Varieties</h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li>• Plain Crisp Golden Dosa</li>
                    <li>• Traditional Masala Dosa (Potato filling)</li>
                    <li>• Paneer Masala Dosa</li>
                    <li>• Mysore Masala Dosa (Spicy red chutney)</li>
                    <li>• Onion / Ghee Roast Dosa</li>
                    <li>• Uthappam Varieties (Onion, Tomato, Mixed Veg)</li>
                  </ul>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">Accompaniments &amp; Extras</h4>
                  <ul className="space-y-2 text-xs text-gray-300">
                    <li>• Steaming Piping Hot Vegetable Sambar</li>
                    <li>• Coconut Chutney &amp; Tomato Chutney</li>
                    <li>• Spicy Mint/Coriander Chutney</li>
                    <li>• Complimentary Idlis or Medu Vada (Package dependent)</li>
                    <li>• Authentic Filter Coffee Service (Available on request)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => handleEnquireNow('Live Dosa Party (Weekday: £11 / Weekend: £12)')}
                  className="px-8 py-3.5 rounded-xl font-bold text-white text-xs uppercase tracking-wider shadow-lg hover:shadow-red-500/25 transition-all"
                  style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
                >
                  Book Live Dosa Party Now
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS ─── */}
      <section id="faqs" className="py-20 px-6 bg-[#070F0A]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-gray-400 text-sm">Everything you need to know about our outdoor and live catering setups.</p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => {
              const faqKey = `faq-${idx}`;
              const isOpen = expandedSection === faqKey;
              return (
                <div key={idx} className="glass-card-dark rounded-2xl border border-white/10 overflow-hidden transition-all">
                  <button
                    onClick={() => toggleSection(faqKey)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-semibold text-white">{faq.question}</span>
                    <Icon name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={18} className="text-amber-400 flex-shrink-0" />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs text-gray-300 leading-relaxed border-t border-white/10 bg-black/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
