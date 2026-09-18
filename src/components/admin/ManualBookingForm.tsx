"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import {
  NEW_PACKAGES as DEFAULT_PACKAGES,
  MENU_CATEGORIES as DEFAULT_MENU_CATEGORIES,
  LIVE_DOSA_PARTY_MENU as DEFAULT_LIVE_DOSA_PARTY_MENU,
  EXTRAS as DEFAULT_EXTRAS,
  TABLE_SERVICE as DEFAULT_TABLE_SERVICE,
  KIDS_PRICING as DEFAULT_KIDS_PRICING,
  STANDARD_SETUP as DEFAULT_STANDARD_SETUP,
  DRY_HIRE_PRICES as DEFAULT_DRY_HIRE_PRICES,
} from '@/app/data/menuData';
import { getKidsPriceFromList } from '@/utils/kidsPricing';

const EVENT_TYPES = [
  'Wedding',
  'Birthday',
  'Corporate',
  'Anniversary',
  'Graduation',
  'Reception',
  'Engagement',
  'Baby Shower',
  'Outdoor Dosa Party',
  'Pooja / Religious',
  'Other',
];

const SERVICE_TYPES = [
  'Party Hall Booking',
  'Outdoor Live Dosa Party',
  'Catering Delivery',
  'Dry Hire Only',
];

const TIME_SESSIONS = [
  { label: 'Lunch (12:00 PM – 5:00 PM)', value: '12:00 PM' },
  { label: 'Dinner (6:00 PM – 11:30 PM)', value: '6:00 PM' },
  { label: 'All Day (10:00 AM – 11:00 PM)', value: '10:00 AM' },
  { label: 'Custom Time', value: 'custom' },
];

const PRESET_EXTRA_CHARGES = [
  { label: 'Transportation / Delivery Fee', amount: 50, reason: 'Van delivery & logistics' },
  { label: 'Long Distance Transportation', amount: 100, reason: 'Mileage & long distance van logistics' },
  { label: 'Setup & Post-Event Cleaning Fee', amount: 150, reason: 'Hall setup, tablecloths & trash cleaning' },
  { label: 'Fuel / Mileage Surcharge', amount: 40, reason: 'Travel distance fuel cost' },
  { label: 'Late Night Collection Fee (After 11pm)', amount: 80, reason: 'Staff overtime late night equipment collection' },
  { label: 'Gazebo & Equipment Hire', amount: 100, reason: 'Outdoor gazebo setup & canopy structure' },
];

export interface AddOnMenuItem {
  id: string;
  category: string;
  name: string;
  cost: number;
  costType: 'per_person' | 'flat';
}

export interface ExtraChargeItem {
  id: string;
  label: string;
  amount: number;
  reason: string;
  isPreset?: boolean;
}

export interface ManualBookingFormProps {
  setCustomAlert: any;
  packages?: any[];
  extras?: any[];
  menuCategories?: any;
  liveDosaPartyMenu?: any;
  tableService?: any[];
  kidsPricing?: any[];
  dryHirePrices?: any[];
  onBookingCreated?: (booking: any) => void;
  depositPercentage?: number;
  timeSlots?: string[];
  partyHallTimeSlots?: string[];
  outdoorTimeSlots?: string[];
  initialData?: any;
  onUpdate?: (booking: any) => void;
  downloadInvoicePDF?: (booking: any, isDeposit?: boolean) => void;
  downloadMenuPDF?: (booking: any) => void;
  onClose?: () => void;
}

export default function ManualBookingForm({
  setCustomAlert,
  packages = DEFAULT_PACKAGES,
  extras = DEFAULT_EXTRAS,
  menuCategories = DEFAULT_MENU_CATEGORIES,
  liveDosaPartyMenu = DEFAULT_LIVE_DOSA_PARTY_MENU,
  tableService = DEFAULT_TABLE_SERVICE,
  kidsPricing = DEFAULT_KIDS_PRICING,
  dryHirePrices = DEFAULT_DRY_HIRE_PRICES,
  onBookingCreated,
  depositPercentage = 30,
  timeSlots = [],
  partyHallTimeSlots = [],
  outdoorTimeSlots = [],
  initialData,
  onUpdate,
  downloadInvoicePDF,
  downloadMenuPDF,
  onClose,
}: ManualBookingFormProps) {
  const isEditMode = !!initialData;
  const editingId = initialData?.id || null;

  // ── Step State (1: Customer & Guests, 2: Menu & Add-ons, 3: Pricing & Extras, 4: Confirmed / Tracker) ──
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(initialData ? 4 : 1);
  const [viewMode, setViewMode] = useState<'form' | 'tracker'>(initialData ? 'tracker' : 'form');
  const [loading, setLoading] = useState(false);
  const [internalId, setInternalId] = useState<string | null>(editingId);

  // ── Step 1: Customer & Event Details ──
  const [customerDetails, setCustomerDetails] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    eventType: initialData?.eventType || 'Wedding',
    customEventType: '',
    serviceType: initialData?.serviceType || 'Party Hall Booking',
    date: initialData?.date || '',
    timeSession: initialData?.timeOfDay || initialData?.time || '6:00 PM',
    customTime: '',
    adults: (initialData?.adults ?? initialData?.guests) || 50,
    kids4to10: initialData?.kids4to10 || initialData?.kids || 0,
    kidsUnder4: initialData?.kidsUnder4 || 0,
    postCode: initialData?.postCode || '',
    address: initialData?.address || '',
    notes: initialData?.message || initialData?.notes || '',
  });

  const [phoneError, setPhoneError] = useState('');
  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});

  // ── Package Selection ──
  const [selectedPackageId, setSelectedPackageId] = useState<string>(() => {
    if (initialData?.package) {
      const match = packages.find((p: any) => p.name === initialData.package || p.id === initialData.package);
      if (match) return match.id;
      if (initialData.package.toLowerCase().includes('dosa')) return 'live_dosa';
      return 'custom';
    }
    return packages[1]?.id || packages[0]?.id || 'package14';
  });

  const [selectedPackageCustomPrice, setSelectedPackageCustomPrice] = useState<number | string>(
    initialData?.packagePricePerPerson || 14
  );

  // ── Price Overrides & Flexibility (With Required Reasons) ──
  // Adult / Package Rate Override
  const [packagePriceOverride, setPackagePriceOverride] = useState<number | string | null>(
    initialData?.pricePerPersonOverride ?? initialData?.pricePerPerson ?? null
  );
  const [packagePriceOverrideReason, setPackagePriceOverrideReason] = useState<string>(
    initialData?.pricePerPersonOverrideReason || ''
  );
  const [showPackagePriceEditor, setShowPackagePriceEditor] = useState<boolean>(false);

  // Kids (3–10 yrs) Rate Override
  const [kidsPriceOverride, setKidsPriceOverride] = useState<number | string | null>(
    initialData?.kidsPriceOverride ?? initialData?.kidsPricePerPerson ?? null
  );
  const [kidsPriceOverrideReason, setKidsPriceOverrideReason] = useState<string>(
    initialData?.kidsPriceOverrideReason || ''
  );
  const [showKidsPriceEditor, setShowKidsPriceEditor] = useState<boolean>(false);

  // Kids under 2/4 yrs Rate Override
  const [kidsUnder4PriceOverride, setKidsUnder4PriceOverride] = useState<number | string | null>(
    initialData?.kidsUnder4PriceOverride ?? null
  );
  const [kidsUnder4PriceOverrideReason, setKidsUnder4PriceOverrideReason] = useState<string>(
    initialData?.kidsUnder4PriceOverrideReason || ''
  );
  const [showKidsUnder4PriceEditor, setShowKidsUnder4PriceEditor] = useState<boolean>(false);

  // Find currently selected package object
  const currentPackage = useMemo(() => {
    if (selectedPackageId === 'live_dosa') {
      let livePrice = 11.0;
      if (customerDetails.date) {
        const d = new Date(customerDetails.date);
        const day = d.getDay();
        if (day === 0 || day === 6) livePrice = 12.0;
      }
      return {
        id: 'live_dosa',
        name: 'Outdoor Live Dosa Party',
        pricePerPerson: livePrice,
        kidsPrice: 8,
        minGuests: 35,
        guestLabel: 'Minimum 35 Persons (Weekday) / 40 (Weekend)',
        tag: 'Live Chef Stations Included',
        items: [
          'Plain Dosa (LIVE)', 'Masala Dosa (LIVE)', 'Onion Chilli Uthappam (LIVE)',
          'Idly (or) Veg Biryani', 'Medhu Vada (LIVE)', 'Chutneys & Sambar'
        ],
        complimentary: 'Accompaniments, Chutneys & Sambar Complimentary',
        color: '#E06D43',
      };
    }
    if (selectedPackageId === 'custom') {
      return {
        id: 'custom',
        name: 'Custom Package',
        pricePerPerson: Number(selectedPackageCustomPrice || 0),
        kidsPrice: Math.round(Number(selectedPackageCustomPrice || 0) * 0.6),
        minGuests: 30,
        guestLabel: 'Custom Negotiated Package',
        tag: 'Manual Pricing',
        items: [],
        complimentary: '',
        color: '#6B7280',
      };
    }
    return packages.find((p: any) => p.id === selectedPackageId || p.name === selectedPackageId) || packages[0];
  }, [packages, selectedPackageId, selectedPackageCustomPrice, customerDetails.date]);

  // Dynamic Kids Price Per Head for selected package
  const defaultKidsPrice = useMemo(() => {
    const directKidsPrice = (currentPackage as any)?.kidsPrice;
    const pkgName = selectedPackageId === 'custom' ? 'Custom' : currentPackage?.name;
    return getKidsPriceFromList(kidsPricing, pkgName, directKidsPrice);
  }, [kidsPricing, currentPackage, selectedPackageId]);

  // Base Package rate per head
  const defaultPackagePricePerPerson = selectedPackageId === 'custom'
    ? Number(selectedPackageCustomPrice || 0)
    : currentPackage?.pricePerPerson || 14;

  // Effective per-head rates
  const effectivePackagePrice = (packagePriceOverride !== null && packagePriceOverride !== '')
    ? Number(packagePriceOverride)
    : defaultPackagePricePerPerson;

  const effectiveKidsPrice = (kidsPriceOverride !== null && kidsPriceOverride !== '')
    ? Number(kidsPriceOverride)
    : defaultKidsPrice;

  const effectiveKidsUnder4Price = (kidsUnder4PriceOverride !== null && kidsUnder4PriceOverride !== '')
    ? Number(kidsUnder4PriceOverride)
    : 0;

  // Total guests
  const totalGuests = Number(customerDetails.adults || 0) + Number(customerDetails.kids4to10 || 0) + Number(customerDetails.kidsUnder4 || 0);

  // ── Step 2: Menu Selection ──
  // Selected standard dishes by category
  const [selectedDishes, setSelectedDishes] = useState<Record<string, string[]>>(() => {
    if (initialData?.selectedMenuItems && typeof initialData.selectedMenuItems === 'object') {
      return initialData.selectedMenuItems;
    }
    return {
      staters: [],
      vegMains: [],
      riceAndNoodles: [],
      paneerMains: [],
      breads: [],
      dhal: [],
      dessert: [],
      liveDosa: [],
    };
  });

  // ── Add-on Field for Every Menu Items List ──
  // Custom extra dishes added under any menu category with optional cost
  const [addOnMenuItems, setAddOnMenuItems] = useState<AddOnMenuItem[]>(() => {
    if (Array.isArray(initialData?.addOnMenuItems)) {
      return initialData.addOnMenuItems;
    }
    return [];
  });

  // Inputs for adding a custom add-on dish per category
  const [newAddOnName, setNewAddOnName] = useState<Record<string, string>>({});
  const [newAddOnCost, setNewAddOnCost] = useState<Record<string, string>>({});
  const [newAddOnCostType, setNewAddOnCostType] = useState<Record<string, 'per_person' | 'flat'>>({});

  // ── Step 3: Extras, Extra Charges (Transportation, etc.), Discounts ──
  // Selected Live Counter / Event Extras (with custom price overrides & reasons)
  const [selectedExtras, setSelectedExtras] = useState<{
    name: string;
    price: number;
    defaultPrice: number;
    isCustomPrice?: boolean;
    reason?: string;
  }[]>(() => {
    if (Array.isArray(initialData?.selectedExtras)) {
      return initialData.selectedExtras;
    }
    return [];
  });

  // Table Service Charges
  const [selectedTableServices, setSelectedTableServices] = useState<{
    service: string;
    price: string;
    customAmount?: number;
    reason?: string;
  }[]>(() => {
    if (Array.isArray(initialData?.selectedTableServices)) {
      return initialData.selectedTableServices;
    }
    return [];
  });

  // Hall / Venue Hire Option (with custom price override & reason)
  const [selectedHallOption, setSelectedHallOption] = useState<{
    label: string;
    amount: number;
    defaultAmount: number;
    isCustomAmount?: boolean;
    reason?: string;
  } | null>(() => {
    if (initialData?.selectedHallOption) return initialData.selectedHallOption;
    return null;
  });

  // ── Extra Charges Field (Transportation, Delivery, Cleaning, etc.) ──
  const [extraChargesList, setExtraChargesList] = useState<ExtraChargeItem[]>(() => {
    if (Array.isArray(initialData?.extraCharges)) {
      return initialData.extraCharges.map((ec: any, idx: number) => ({
        id: ec.id || `extra-${idx}-${Date.now()}`,
        label: ec.label || 'Extra Charge',
        amount: Number(ec.amount || 0),
        reason: ec.reason || '',
        isPreset: !!ec.isPreset,
      }));
    }
    return [];
  });

  const [newExtraChargeLabel, setNewExtraChargeLabel] = useState('');
  const [newExtraChargeAmount, setNewExtraChargeAmount] = useState('');
  const [newExtraChargeReason, setNewExtraChargeReason] = useState('');

  // ── Discounts ──
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>(
    initialData?.discount?.type || 'none'
  );
  const [discountValue, setDiscountValue] = useState<string>(
    initialData?.discount?.value?.toString() || ''
  );
  const [discountReason, setDiscountReason] = useState<string>(
    initialData?.discount?.reason || ''
  );

  // ── Payments & Status ──
  const [customDepositAmount, setCustomDepositAmount] = useState<string>(
    initialData?.deposit ? initialData.deposit.toString() : ''
  );
  const [depositPaid, setDepositPaid] = useState<boolean>(initialData?.depositPaid || false);
  const [finalPaymentPaid, setFinalPaymentPaid] = useState<boolean>(initialData?.finalPaymentPaid || false);
  const [paymentChoice, setPaymentChoice] = useState<'advance' | 'full' | 'pending'>(
    initialData?.finalPaymentPaid ? 'full' : (initialData?.depositPaid ? 'advance' : 'advance')
  );
  const [paymentMethodDeposit, setPaymentMethodDeposit] = useState<string>(
    initialData?.paymentMethodDeposit || 'Bank Transfer'
  );
  const [paymentMethodFinal, setPaymentMethodFinal] = useState<string>(
    initialData?.paymentMethodFinal || 'Bank Transfer'
  );
  const [paymentProofDeposit, setPaymentProofDeposit] = useState<string>(
    initialData?.paymentProofDeposit || ''
  );
  const [paymentProofFinal, setPaymentProofFinal] = useState<string>(
    initialData?.paymentProofFinal || ''
  );

  // ── Calculations ──
  // Food subtotal
  const adultFoodTotal = Number(customerDetails.adults || 0) * effectivePackagePrice;
  const kidsFoodTotal = Number(customerDetails.kids4to10 || 0) * effectiveKidsPrice;
  const kidsUnder4FoodTotal = Number(customerDetails.kidsUnder4 || 0) * effectiveKidsUnder4Price;

  // Add-on menu items cost
  const addOnsTotal = useMemo(() => {
    return addOnMenuItems.reduce((sum, item) => {
      if (item.costType === 'per_person') {
        return sum + (Number(customerDetails.adults || 0) * Number(item.cost || 0));
      }
      return sum + Number(item.cost || 0);
    }, 0);
  }, [addOnMenuItems, customerDetails.adults]);

  const foodBaseAmount = adultFoodTotal + kidsFoodTotal + kidsUnder4FoodTotal + addOnsTotal;

  // Extras total (Live counters, appetizers, desserts)
  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce((sum, item) => sum + Number(item.price || 0), 0);
  }, [selectedExtras]);

  // Table service total
  const tableServiceTotal = useMemo(() => {
    return selectedTableServices.reduce((sum, item) => {
      const amt = item.customAmount ?? (parseFloat(item.price.replace(/[^\d.]/g, '')) || 0);
      return sum + (amt * Number(customerDetails.adults || 0));
    }, 0);
  }, [selectedTableServices, customerDetails.adults]);

  // Hall total
  const hallTotal = selectedHallOption ? Number(selectedHallOption.amount || 0) : 0;

  // Extra charges total (Transportation, delivery, cleaning, etc.)
  const extraChargesTotal = useMemo(() => {
    return extraChargesList.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [extraChargesList]);

  // Subtotal before discount
  const subtotalBeforeDiscount = foodBaseAmount + extrasTotal + tableServiceTotal + hallTotal + extraChargesTotal;

  // Discount amount
  const discountAmount = useMemo(() => {
    if (discountType === 'none') return 0;
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      return Math.round((subtotalBeforeDiscount * val) / 100);
    }
    return Math.min(subtotalBeforeDiscount, val);
  }, [discountType, discountValue, subtotalBeforeDiscount]);

  // Grand total
  const grandTotal = Math.max(0, subtotalBeforeDiscount - discountAmount);

  // Suggested Deposit
  const standardSuggestedDeposit = useMemo(() => {
    if (!grandTotal || grandTotal <= 0) return 0;
    if (depositPercentage && depositPercentage > 0 && depositPercentage <= 100) {
      return Math.round((grandTotal * depositPercentage) / 100);
    }
    return Math.min(grandTotal, 500);
  }, [grandTotal, depositPercentage]);

  const effectiveDeposit = useMemo(() => {
    if (paymentChoice === 'full') return grandTotal;
    if (paymentChoice === 'pending') return 0;
    if (customDepositAmount !== '' && !isNaN(Number(customDepositAmount))) {
      return Math.min(grandTotal, Math.max(0, Number(customDepositAmount)));
    }
    return standardSuggestedDeposit;
  }, [paymentChoice, grandTotal, customDepositAmount, standardSuggestedDeposit]);

  const balanceRemaining = useMemo(() => {
    if (paymentChoice === 'full' || finalPaymentPaid) return 0;
    if (paymentChoice === 'pending') return grandTotal;
    return Math.max(0, grandTotal - (depositPaid ? effectiveDeposit : 0));
  }, [paymentChoice, finalPaymentPaid, grandTotal, depositPaid, effectiveDeposit]);

  // ── Transparent Price Overrides & Reasons Audit List ──
  const activePriceOverridesList = useMemo(() => {
    const list: { title: string; original: number; custom: number; reason: string; category: string }[] = [];

    // Adult rate override
    if (packagePriceOverride !== null && packagePriceOverride !== '' && Number(packagePriceOverride) !== defaultPackagePricePerPerson) {
      list.push({
        title: `Adult Head Rate (${currentPackage?.name || 'Package'})`,
        original: defaultPackagePricePerPerson,
        custom: Number(packagePriceOverride),
        reason: packagePriceOverrideReason.trim() || 'Custom negotiated rate',
        category: 'Adult Rate',
      });
    }

    // Kids rate override
    if (kidsPriceOverride !== null && kidsPriceOverride !== '' && Number(kidsPriceOverride) !== defaultKidsPrice) {
      list.push({
        title: 'Kids Head Rate (3–10 yrs)',
        original: defaultKidsPrice,
        custom: Number(kidsPriceOverride),
        reason: kidsPriceOverrideReason.trim() || 'Custom kids portion rate',
        category: 'Kids Rate',
      });
    }

    // Infants rate override
    if (kidsUnder4PriceOverride !== null && kidsUnder4PriceOverride !== '' && Number(kidsUnder4PriceOverride) !== 0) {
      list.push({
        title: 'Infants Head Rate (Under 2/4 yrs)',
        original: 0,
        custom: Number(kidsUnder4PriceOverride),
        reason: kidsUnder4PriceOverrideReason.trim() || 'Custom infant meal fee',
        category: 'Infants Rate',
      });
    }

    // Hall option override
    if (selectedHallOption && (selectedHallOption.isCustomAmount || selectedHallOption.reason)) {
      list.push({
        title: `Hall Hire (${selectedHallOption.label})`,
        original: selectedHallOption.defaultAmount,
        custom: Number(selectedHallOption.amount || 0),
        reason: selectedHallOption.reason || 'Custom venue arrangement',
        category: 'Venue / Hall',
      });
    }

    // Selected Extras overrides
    selectedExtras.forEach((ex) => {
      if (ex.isCustomPrice || ex.reason) {
        list.push({
          title: `Extra: ${ex.name}`,
          original: ex.defaultPrice,
          custom: Number(ex.price || 0),
          reason: ex.reason || 'Custom extra pricing',
          category: 'Extras',
        });
      }
    });

    // Extra Charges (Transportation, etc.)
    extraChargesList.forEach((ec) => {
      list.push({
        title: ec.label,
        original: 0,
        custom: Number(ec.amount || 0),
        reason: ec.reason || 'Additional service / transportation fee',
        category: 'Extra Charges / Logistics',
      });
    });

    // Discounts
    if (discountType !== 'none' && discountAmount > 0) {
      list.push({
        title: `Discount (${discountType === 'percentage' ? `${discountValue}%` : `£${discountValue}`})`,
        original: 0,
        custom: -discountAmount,
        reason: discountReason.trim() || 'Promotional / management discount',
        category: 'Discount',
      });
    }

    return list;
  }, [
    packagePriceOverride,
    defaultPackagePricePerPerson,
    packagePriceOverrideReason,
    currentPackage,
    kidsPriceOverride,
    defaultKidsPrice,
    kidsPriceOverrideReason,
    kidsUnder4PriceOverride,
    kidsUnder4PriceOverrideReason,
    selectedHallOption,
    selectedExtras,
    extraChargesList,
    discountType,
    discountValue,
    discountAmount,
    discountReason,
  ]);

    // ── Category quota resolver based on selected package ──
  const getCategoryAllowedCount = (pkg: any, categoryKey: string): number => {
    if (!pkg || !pkg.items || !Array.isArray(pkg.items)) return 999;
    const keyMatchMap: Record<string, RegExp> = {
      staters: /stater|starter/i,
      vegMains: /veg\s*main/i,
      riceAndNoodles: /rice|noodle/i,
      paneerMains: /paneer/i,
      breads: /bread|roti|naan/i,
      dhal: /dhal|dal|lentil/i,
      dessert: /dessert|sweet/i,
    };
    const regex = keyMatchMap[categoryKey];
    if (!regex) return 999;

    for (const item of pkg.items) {
      if (regex.test(item)) {
        const match = String(item).match(/^(\d+)/);
        if (match) return parseInt(match[1], 10);
      }
    }
    return 0; // Category not included in this package
  };

  // ── Handlers for Menu & Add-ons ──
  const toggleDishSelection = (categoryKey: string, dishName: string) => {
    setSelectedDishes(prev => {
      const currentList = prev[categoryKey] || [];
      if (currentList.includes(dishName)) {
        return { ...prev, [categoryKey]: currentList.filter(d => d !== dishName) };
      }
      const maxAllowed = getCategoryAllowedCount(currentPackage, categoryKey);
      if (maxAllowed === 0) {
        setCustomAlert({
          message: `${categoryKey === 'dhal' ? 'Dhal' : 'This category'} is not included in ${currentPackage?.name || 'this package'}. To add dishes for this category, please use the Add-on / Extra Dishes field below!`,
          type: 'warning'
        });
        return prev;
      }
      if (currentList.length >= maxAllowed) {
        const catLabel = categoryKey === 'staters' ? 'Staters' : categoryKey === 'vegMains' ? 'Vegetarian Mains' : categoryKey === 'paneerMains' ? 'Paneer Mains' : categoryKey;
        setCustomAlert({
          message: `${currentPackage?.name || 'Package'} allows maximum ${maxAllowed} ${catLabel}. You already selected ${maxAllowed}. To add more dishes, please use the "Add-on / Extra Dishes" field below!`,
          type: 'warning'
        });
        return prev;
      }
      return { ...prev, [categoryKey]: [...currentList, dishName] };
    });
  };

  const handleAddCustomAddOnDish = (categoryKey: string) => {
    const name = (newAddOnName[categoryKey] || '').trim();
    if (!name) {
      setCustomAlert({ message: 'Please enter a name for the add-on item.', type: 'warning' });
      return;
    }
    const cost = parseFloat(newAddOnCost[categoryKey] || '0') || 0;
    const costType = newAddOnCostType[categoryKey] || 'per_person';

    const newItem: AddOnMenuItem = {
      id: `addon-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: categoryKey,
      name,
      cost,
      costType,
    };

    setAddOnMenuItems(prev => [...prev, newItem]);
    setNewAddOnName(prev => ({ ...prev, [categoryKey]: '' }));
    setNewAddOnCost(prev => ({ ...prev, [categoryKey]: '' }));
    setCustomAlert({ message: `Added "${name}" to ${categoryKey} add-ons.`, type: 'success' });
  };

  const handleRemoveAddOnDish = (id: string) => {
    setAddOnMenuItems(prev => prev.filter(i => i.id !== id));
  };

  // ── Handlers for Extra Charges (Transportation, etc.) ──
  const handleAddPresetExtraCharge = (preset: { label: string; amount: number; reason: string }) => {
    const newItem: ExtraChargeItem = {
      id: `ec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label: preset.label,
      amount: preset.amount,
      reason: preset.reason,
      isPreset: true,
    };
    setExtraChargesList(prev => [...prev, newItem]);
    setCustomAlert({ message: `Added "${preset.label}" (£${preset.amount}).`, type: 'success' });
  };

  const handleAddCustomExtraCharge = () => {
    const label = newExtraChargeLabel.trim();
    if (!label) {
      setCustomAlert({ message: 'Please enter a charge description (e.g. Transportation Fee).', type: 'warning' });
      return;
    }
    const amount = parseFloat(newExtraChargeAmount) || 0;
    if (amount <= 0) {
      setCustomAlert({ message: 'Please enter a valid charge amount.', type: 'warning' });
      return;
    }

    const newItem: ExtraChargeItem = {
      id: `ec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      label,
      amount,
      reason: newExtraChargeReason.trim() || 'Custom logistics / event surcharge',
      isPreset: false,
    };

    setExtraChargesList(prev => [...prev, newItem]);
    setNewExtraChargeLabel('');
    setNewExtraChargeAmount('');
    setNewExtraChargeReason('');
    setCustomAlert({ message: `Added "${label}" (£${amount}).`, type: 'success' });
  };

  const handleRemoveExtraCharge = (id: string) => {
    setExtraChargesList(prev => prev.filter(i => i.id !== id));
  };

  // ── Timestamped Receipt Canvas Upload ──
  const handleFileUpload = async (file: File, type: 'deposit' | 'final') => {
    try {
      setLoading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const img = new window.Image();
      img.src = reader.result as string;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 900;
      const MAX_HEIGHT = 900;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dateText = `Sangeetha Events • Uploaded: ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`;
        ctx.font = 'bold 14px sans-serif';
        const textWidth = ctx.measureText(dateText).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(10, height - 36, textWidth + 24, 26);
        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(dateText, 20, height - 23);
      }

      const url = canvas.toDataURL('image/jpeg', 0.8);
      if (type === 'deposit') {
        setPaymentProofDeposit(url);
      } else {
        setPaymentProofFinal(url);
      }

      if (internalId) {
        const updateField = type === 'deposit' ? 'paymentProofDeposit' : 'paymentProofFinal';
        await setDoc(doc(db, 'booking_requests', internalId), { [updateField]: url, updatedAt: new Date().toISOString() }, { merge: true });
        await setDoc(doc(db, 'bookings', internalId), { [updateField]: url, updatedAt: new Date().toISOString() }, { merge: true });
      }

      setCustomAlert({ message: `${type === 'deposit' ? 'Deposit' : 'Final'} payment screenshot uploaded and saved!`, type: 'success' });
    } catch (err: any) {
      console.error(err);
      setCustomAlert({ message: 'Failed to process screenshot.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1 Validation ──
  const handleValidateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!customerDetails.name.trim()) errors.name = 'Full Name is required.';
    if (!customerDetails.phone.trim()) errors.phone = 'Phone number is required.';
    if (!customerDetails.date) errors.date = 'Event Date is required.';
    if (!customerDetails.adults || Number(customerDetails.adults) <= 0) errors.adults = 'At least 1 adult guest required.';

    setStep1Errors(errors);
    if (Object.keys(errors).length > 0) {
      setCustomAlert({ message: 'Please complete all required fields.', type: 'warning' });
      return false;
    }
    return true;
  };

  // ── Helpers to Generate Current PDFs (Deposit Invoice, Final Invoice, Kitchen Sheet) ──
  const handleGenerateCurrentInvoice = (isDepositInvoice: boolean) => {
    if (!downloadInvoicePDF) return;
    const currentBookingData: any = {
      ...customerDetails,
      id: internalId || 'DRAFT',
      name: customerDetails.name.trim(),
      email: customerDetails.email.trim(),
      phone: customerDetails.phone.trim(),
      eventType: customerDetails.eventType === 'Other' && customerDetails.customEventType ? customerDetails.customEventType : customerDetails.eventType,
      serviceType: customerDetails.serviceType,
      date: customerDetails.date,
      timeOfDay: customerDetails.timeSession === 'custom' ? customerDetails.customTime : customerDetails.timeSession,
      time: customerDetails.timeSession === 'custom' ? customerDetails.customTime : customerDetails.timeSession,
      adults: Number(customerDetails.adults || 0),
      kids4to10: Number(customerDetails.kids4to10 || 0),
      kidsUnder4: Number(customerDetails.kidsUnder4 || 0),
      guests: totalGuests,
      package: currentPackage?.name || 'Bronze Package',
      selectedMenu: currentPackage?.name || 'Bronze Package',
      pricePerPerson: effectivePackagePrice,
      kidsPrice: effectiveKidsPrice,
      selectedMenuItems: selectedDishes,
      addOnMenuItems,
      selectedExtras,
      selectedTableServices,
      selectedHallOption,
      extraCharges: extraChargesList,
      discount: discountType !== 'none' ? {
        type: discountType,
        value: parseFloat(discountValue) || 0,
        amount: discountAmount,
        reason: discountReason.trim(),
      } : null,
      baseAmount: foodBaseAmount,
      extrasAmount: extrasTotal,
      extraChargesAmount: extraChargesTotal,
      subtotalBeforeDiscount,
      discountAmount,
      totalAmount: grandTotal,
      grandTotal,
      deposit: effectiveDeposit,
      depositPaid: paymentChoice === 'full' || depositPaid,
      finalPaymentPaid: paymentChoice === 'full' || finalPaymentPaid,
      paymentMethodDeposit,
      paymentMethodFinal,
      paymentProofDeposit,
      paymentProofFinal,
      postCode: customerDetails.postCode.trim(),
      address: customerDetails.address.trim(),
      notes: customerDetails.notes.trim(),
      message: customerDetails.notes.trim(),
      status: paymentChoice === 'full' || finalPaymentPaid ? 'completed' : (depositPaid ? 'deposit_confirmed' : 'new_enquiry'),
    };
    downloadInvoicePDF(currentBookingData, isDepositInvoice);
  };

  const handleGenerateCurrentMenuPDF = () => {
    if (!downloadMenuPDF) return;
    const currentBookingData: any = {
      ...customerDetails,
      id: internalId || 'DRAFT',
      selectedMenuItems: selectedDishes,
      addOnMenuItems,
      adults: Number(customerDetails.adults || 0),
      kids4to10: Number(customerDetails.kids4to10 || 0),
      kidsUnder4: Number(customerDetails.kidsUnder4 || 0),
      guests: totalGuests,
    };
    downloadMenuPDF(currentBookingData);
  };

  // ── Save / Submit Booking to Firestore ──
  const handleSaveBooking = async () => {
    if (!customerDetails.name || !customerDetails.phone || !customerDetails.date) {
      setCustomAlert({ message: 'Name, Phone, and Event Date are required.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const bookingPayload: any = {
        name: customerDetails.name.trim(),
        email: customerDetails.email.trim(),
        phone: customerDetails.phone.trim(),
        eventType: customerDetails.eventType === 'Other' && customerDetails.customEventType ? customerDetails.customEventType : customerDetails.eventType,
        serviceType: customerDetails.serviceType,
        date: customerDetails.date,
        timeOfDay: customerDetails.timeSession === 'custom' ? customerDetails.customTime : customerDetails.timeSession,
        time: customerDetails.timeSession === 'custom' ? customerDetails.customTime : customerDetails.timeSession,
        adults: Number(customerDetails.adults || 0),
        kids4to10: Number(customerDetails.kids4to10 || 0),
        kidsUnder4: Number(customerDetails.kidsUnder4 || 0),
        guests: totalGuests,
        package: currentPackage?.name || 'Bronze Package',
        selectedMenu: currentPackage?.name || 'Bronze Package',
        pricePerPerson: effectivePackagePrice,
        defaultPackagePricePerPerson,
        pricePerPersonOverride: packagePriceOverride !== null ? Number(packagePriceOverride) : null,
        pricePerPersonOverrideReason: packagePriceOverrideReason.trim(),
        kidsPricePerPerson: effectiveKidsPrice,
        defaultKidsPrice,
        kidsPriceOverride: kidsPriceOverride !== null ? Number(kidsPriceOverride) : null,
        kidsPriceOverrideReason: kidsPriceOverrideReason.trim(),
        kidsUnder4PricePerPerson: effectiveKidsUnder4Price,
        kidsUnder4PriceOverrideReason: kidsUnder4PriceOverrideReason.trim(),
        selectedMenuItems: selectedDishes,
        addOnMenuItems,
        selectedExtras,
        selectedTableServices,
        selectedHallOption,
        extraCharges: extraChargesList,
        discount: discountType !== 'none' ? {
          type: discountType,
          value: parseFloat(discountValue) || 0,
          amount: discountAmount,
          reason: discountReason.trim(),
        } : null,
        baseAmount: foodBaseAmount,
        extrasAmount: extrasTotal,
        extraChargesAmount: extraChargesTotal,
        subtotalBeforeDiscount,
        discountAmount,
        totalAmount: grandTotal,
        grandTotal,
        deposit: effectiveDeposit,
        depositPaid,
        finalPaymentPaid,
        paymentMethodDeposit,
        paymentMethodFinal,
        paymentProofDeposit,
        paymentProofFinal,
        postCode: customerDetails.postCode.trim(),
        address: customerDetails.address.trim(),
        notes: customerDetails.notes.trim(),
        message: customerDetails.notes.trim(),
        activePriceOverridesList,
        status: finalPaymentPaid ? 'completed' : (depositPaid ? 'deposit_confirmed' : 'new_enquiry'),
        source: initialData?.source || 'direct_booking',
        updatedAt: new Date().toISOString(),
      };

      if (!isEditMode) {
        bookingPayload.createdAt = new Date().toISOString();
      }

      let finalDocId = internalId;

      if (isEditMode && editingId) {
        await setDoc(doc(db, 'booking_requests', editingId), bookingPayload, { merge: true });
        await setDoc(doc(db, 'bookings', editingId), bookingPayload, { merge: true });
        setCustomAlert({ message: 'Booking updated successfully!', type: 'success' });
        if (onUpdate) onUpdate({ ...bookingPayload, id: editingId });
      } else {
        const docRef = await addDoc(collection(db, 'booking_requests'), bookingPayload);
        finalDocId = docRef.id;
        await setDoc(doc(db, 'bookings', docRef.id), { ...bookingPayload, id: docRef.id });
        setInternalId(docRef.id);
        setCustomAlert({ message: `Manual booking #${docRef.id.slice(-6).toUpperCase()} created successfully!`, type: 'success' });
        if (onBookingCreated) onBookingCreated({ ...bookingPayload, id: docRef.id });
      }

      setCurrentStep(4);
      setViewMode('tracker');
    } catch (err: any) {
      console.error(err);
      setCustomAlert({ message: `Error saving booking: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Helper WhatsApp Quote
  const generateWhatsAppQuoteText = () => {
    const firstName = customerDetails.name.split(' ')[0] || 'Customer';
    let text = `Hi ${firstName}, here is your event quote from *Sangeetha Events Pinner*:\n\n`;
    text += `📅 *Date:* ${customerDetails.date} (${customerDetails.timeSession})\n`;
    text += `👥 *Guests:* ${customerDetails.adults} Adults · ${customerDetails.kids4to10} Kids · ${customerDetails.kidsUnder4} Infants (Total ${totalGuests})\n`;
    text += `🍱 *Package:* ${currentPackage?.name} at £${effectivePackagePrice}/adult · £${effectiveKidsPrice}/kid\n\n`;

    if (addOnMenuItems.length > 0) {
      text += `✨ *Add-on Dishes:*\n`;
      addOnMenuItems.forEach(item => {
        text += `• ${item.name} (${item.costType === 'per_person' ? `+£${item.cost}/guest` : `+£${item.cost} flat`})\n`;
      });
      text += `\n`;
    }

    if (extraChargesList.length > 0) {
      text += `🚚 *Logistics & Extra Charges:*\n`;
      extraChargesList.forEach(ec => {
        text += `• ${ec.label}: £${ec.amount}${ec.reason ? ` (${ec.reason})` : ''}\n`;
      });
      text += `\n`;
    }

    if (selectedExtras.length > 0) {
      text += `🎪 *Live Counters & Extras:*\n`;
      selectedExtras.forEach(ex => {
        text += `• ${ex.name}: £${ex.price}\n`;
      });
      text += `\n`;
    }

    if (discountAmount > 0) {
      text += `🏷️ *Discount Applied:* -£${discountAmount.toLocaleString()}${discountReason ? ` (${discountReason})` : ''}\n\n`;
    }

    text += `💰 *Estimated Total:* £${grandTotal.toLocaleString()} (Excl. VAT)\n`;
    text += `💳 *Deposit Required:* £${effectiveDeposit.toLocaleString()}\n\n`;
    text += `Please reply to confirm and secure your event date! 🙏`;
    return encodeURIComponent(text);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-5xl mx-auto">
      {/* ── TOP HEADER BAR ── */}
      <div className="bg-gradient-to-r from-[#ED1C24] via-[#D3141B] to-[#9C0C11] text-white p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Icon name="CalendarDaysIcon" size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {isEditMode ? 'Edit Direct Booking' : 'Direct Booking & Event Planner'}
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Sangeetha Events Luxury Event Management • Dynamic Pricing, Logistics & Add-ons
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {internalId && (
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === 'form' ? 'tracker' : 'form')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/30 text-white transition-all flex items-center gap-1.5"
            >
              <Icon name={viewMode === 'form' ? 'QueueListIcon' : 'PencilSquareIcon'} size={14} />
              {viewMode === 'form' ? 'View Tracker' : 'Edit Details'}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          )}
        </div>
      </div>

      {/* ── 3-STEP PROGRESS STEPPER (When in form mode) ── */}
      {viewMode === 'form' && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2.5 transition-colors ${currentStep === 1 ? 'text-[#ED1C24] font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 1
                  ? 'bg-[#ED1C24] text-white shadow-md ring-4 ring-red-100'
                  : currentStep > 1
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {currentStep > 1 ? <Icon name="CheckIcon" size={14} /> : '1'}
              </div>
              <span className="text-xs sm:text-sm hidden sm:inline">Event &amp; Guests</span>
            </button>

            <div className={`flex-1 h-0.5 mx-3 ${currentStep > 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => {
                if (handleValidateStep1()) setCurrentStep(2);
              }}
              className={`flex items-center gap-2.5 transition-colors ${currentStep === 2 ? 'text-[#ED1C24] font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 2
                  ? 'bg-[#ED1C24] text-white shadow-md ring-4 ring-red-100'
                  : currentStep > 2
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {currentStep > 2 ? <Icon name="CheckIcon" size={14} /> : '2'}
              </div>
              <span className="text-xs sm:text-sm hidden sm:inline">Menu &amp; Add-ons</span>
            </button>

            <div className={`flex-1 h-0.5 mx-3 ${currentStep > 2 ? 'bg-emerald-500' : 'bg-gray-200'}`} />

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => {
                if (handleValidateStep1()) setCurrentStep(3);
              }}
              className={`flex items-center gap-2.5 transition-colors ${currentStep === 3 ? 'text-[#ED1C24] font-bold' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                currentStep === 3
                  ? 'bg-[#ED1C24] text-white shadow-md ring-4 ring-red-100'
                  : currentStep > 3
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {currentStep > 3 ? <Icon name="CheckIcon" size={14} /> : '3'}
              </div>
              <span className="text-xs sm:text-sm hidden sm:inline">Pricing &amp; Logistics</span>
            </button>
          </div>
        </div>
      )}

      {/* ── BODY CONTENT ── */}
      <div className="p-5 md:p-8">
        {/* ========================================================================= */}
        {/* STEP 1: EVENT DETAILS, PACKAGE SELECTION & DYNAMIC HEAD RATES           */}
        {/* ========================================================================= */}
        {viewMode === 'form' && currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1.1 PACKAGE SELECTION CARDS DIRECTLY AT TOP */}
            <div className="bg-red-50/40 border border-red-200/60 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="SparklesIcon" size={18} className="text-[#ED1C24]" />
                    Select Sangeetha Events Package
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Adult and Kids rates automatically adapt based on your selected package.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-900 border border-red-200">
                  {currentPackage?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {packages.map((pkg: any) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const pkgKids = (pkg as any).kidsPrice || getKidsPriceFromList(kidsPricing, pkg.name);
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setPackagePriceOverride(null);
                        setKidsPriceOverride(null);
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#ED1C24] bg-white shadow-md ring-2 ring-red-100 scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/30'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900 truncate">{pkg.name}</div>
                        {pkg.tag && (
                          <div className="text-[9px] font-semibold text-red-600 line-clamp-1 mt-0.5">{pkg.tag}</div>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-sm font-black text-[#ED1C24]">£{pkg.pricePerPerson}</div>
                        <div className="text-[10px] text-gray-500">/adult · Kids: £{pkgKids}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Outdoor Live Dosa Party Package */}
                <div
                  onClick={() => {
                    setSelectedPackageId('live_dosa');
                    setPackagePriceOverride(null);
                    setKidsPriceOverride(null);
                  }}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    selectedPackageId === 'live_dosa'
                      ? 'border-[#ED1C24] bg-white shadow-md ring-2 ring-red-100 scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50/30'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-gray-900">Live Dosa Party</div>
                    <div className="text-[9px] font-semibold text-emerald-600 mt-0.5">Live Station</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-sm font-black text-[#ED1C24]">£11–£12</div>
                    <div className="text-[10px] text-gray-500">/adult · Kids: £8</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 1.2 GUEST COUNT & HEAD RATES WITH INLINE "EDIT RATE" DRAWERS */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <div>
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Icon name="UsersIcon" size={16} className="text-amber-700" />
                    Guest Counts &amp; Per-Head Rates
                  </span>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    Adult and Kids rates automatically resolve from the package. Click &quot;Edit Rate&quot; to customize any price with a reason.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                  Total Guests: {totalGuests}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Adults */}
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800">
                      Adult Guests (Full Price) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPackagePriceEditor(!showPackagePriceEditor)}
                      className="text-[11px] font-bold text-[#ED1C24] hover:underline flex items-center gap-1"
                    >
                      <Icon name="PencilSquareIcon" size={12} />
                      {packagePriceOverride !== null ? 'Custom Rate' : 'Edit Rate'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={customerDetails.adults}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, adults: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 font-black text-gray-900"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>Rate:</span>
                    <span className="font-bold text-amber-900">
                      £{effectivePackagePrice}/adult
                      {packagePriceOverride !== null && (
                        <span className="line-through text-gray-400 font-normal ml-1.5">£{defaultPackagePricePerPerson}</span>
                      )}
                    </span>
                  </div>

                  {/* Inline Adult Rate Override Drawer */}
                  {showPackagePriceEditor && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">Custom Adult Rate:</span>
                        {packagePriceOverride !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setPackagePriceOverride(null);
                              setPackagePriceOverrideReason('');
                            }}
                            className="text-[10px] text-red-600 hover:underline font-semibold"
                          >
                            Reset to £{defaultPackagePricePerPerson}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                        <input
                          type="number"
                          min={0}
                          value={packagePriceOverride !== null ? packagePriceOverride : defaultPackagePricePerPerson}
                          onChange={(e) => setPackagePriceOverride(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-6 pr-2 py-1.5 border border-amber-300 rounded-lg text-xs font-bold text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-amber-900 mb-0.5">Reason for Edit:</label>
                        <input
                          type="text"
                          placeholder="e.g. Negotiated group discount for 100+ guests"
                          value={packagePriceOverrideReason}
                          onChange={(e) => setPackagePriceOverrideReason(e.target.value)}
                          className="w-full border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Kids (3–10 Yrs) */}
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800">
                      Kids (3–10 Yrs)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKidsPriceEditor(!showKidsPriceEditor)}
                      className="text-[11px] font-bold text-[#ED1C24] hover:underline flex items-center gap-1"
                    >
                      <Icon name="PencilSquareIcon" size={12} />
                      {kidsPriceOverride !== null ? 'Custom Rate' : 'Edit Rate'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={customerDetails.kids4to10}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, kids4to10: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 font-black text-gray-900"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>Rate:</span>
                    <span className="font-bold text-amber-900">
                      £{effectiveKidsPrice}/kid
                      {kidsPriceOverride !== null && (
                        <span className="line-through text-gray-400 font-normal ml-1.5">£{defaultKidsPrice}</span>
                      )}
                    </span>
                  </div>

                  {/* Inline Kids Rate Override Drawer */}
                  {showKidsPriceEditor && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">Custom Kids Rate:</span>
                        {kidsPriceOverride !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setKidsPriceOverride(null);
                              setKidsPriceOverrideReason('');
                            }}
                            className="text-[10px] text-red-600 hover:underline font-semibold"
                          >
                            Reset to £{defaultKidsPrice}
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                        <input
                          type="number"
                          min={0}
                          value={kidsPriceOverride !== null ? kidsPriceOverride : defaultKidsPrice}
                          onChange={(e) => setKidsPriceOverride(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-6 pr-2 py-1.5 border border-amber-300 rounded-lg text-xs font-bold text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-amber-900 mb-0.5">Reason for Edit:</label>
                        <input
                          type="text"
                          placeholder="e.g. Smaller portion discount"
                          value={kidsPriceOverrideReason}
                          onChange={(e) => setKidsPriceOverrideReason(e.target.value)}
                          className="w-full border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Infants (Under 2/4 Yrs) */}
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800">
                      Infants (Under 2 Yrs)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowKidsUnder4PriceEditor(!showKidsUnder4PriceEditor)}
                      className="text-[11px] font-bold text-[#ED1C24] hover:underline flex items-center gap-1"
                    >
                      <Icon name="PencilSquareIcon" size={12} />
                      {kidsUnder4PriceOverride !== null ? 'Custom Fee' : 'Edit'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={customerDetails.kidsUnder4}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, kidsUnder4: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 font-black text-gray-900"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>Rate:</span>
                    <span className="font-bold text-emerald-600">
                      {effectiveKidsUnder4Price === 0 ? 'Free' : `£${effectiveKidsUnder4Price}/infant`}
                    </span>
                  </div>

                  {/* Inline Infants Rate Override Drawer */}
                  {showKidsUnder4PriceEditor && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">Infant Surcharge:</span>
                        {kidsUnder4PriceOverride !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setKidsUnder4PriceOverride(null);
                              setKidsUnder4PriceOverrideReason('');
                            }}
                            className="text-[10px] text-red-600 hover:underline font-semibold"
                          >
                            Reset to Free
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                        <input
                          type="number"
                          min={0}
                          value={kidsUnder4PriceOverride !== null ? kidsUnder4PriceOverride : 0}
                          onChange={(e) => setKidsUnder4PriceOverride(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-6 pr-2 py-1.5 border border-amber-300 rounded-lg text-xs font-bold text-gray-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-amber-900 mb-0.5">Reason for Fee:</label>
                        <input
                          type="text"
                          placeholder="e.g. High-chair fee or specific meal requirement"
                          value={kidsUnder4PriceOverrideReason}
                          onChange={(e) => setKidsUnder4PriceOverrideReason(e.target.value)}
                          className="w-full border border-amber-200 rounded-lg px-2.5 py-1.5 text-[11px] bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 1.3 CLIENT & EVENT DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={customerDetails.name}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                {step1Errors.name && <p className="text-xs text-red-600 mt-1">{step1Errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 07700 900101"
                  value={customerDetails.phone}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                {step1Errors.phone && <p className="text-xs text-red-600 mt-1">{step1Errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. client@example.com"
                  value={customerDetails.email}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Event Type
                </label>
                <select
                  value={customerDetails.eventType}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, eventType: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {customerDetails.eventType === 'Other' && (
                  <input
                    type="text"
                    placeholder="Specify Event Type..."
                    value={customerDetails.customEventType}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, customEventType: e.target.value })}
                    className="w-full mt-2 border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                )}
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  value={customerDetails.date}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                {step1Errors.date && <p className="text-xs text-red-600 mt-1">{step1Errors.date}</p>}
              </div>

              {/* Time Session */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Time Session / Timings
                </label>
                <select
                  value={customerDetails.timeSession}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, timeSession: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                >
                  {TIME_SESSIONS.map(ts => (
                    <option key={ts.value} value={ts.value}>{ts.label}</option>
                  ))}
                </select>
                {customerDetails.timeSession === 'custom' && (
                  <input
                    type="text"
                    placeholder="e.g. 1:00 PM – 7:00 PM"
                    value={customerDetails.customTime}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, customTime: e.target.value })}
                    className="w-full mt-2 border border-gray-300 rounded-xl px-3.5 py-2 text-sm"
                  />
                )}
              </div>

              {/* Postcode */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Venue Postcode
                </label>
                <input
                  type="text"
                  placeholder="e.g. HA0 2AF"
                  value={customerDetails.postCode}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, postCode: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none uppercase"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Full Venue Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 142 High Street, Wembley"
                  value={customerDetails.address}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Special Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                Event Notes &amp; Dietary Requirements
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Jain food options required for 15 guests, bride entrance at 7:30 PM..."
                value={customerDetails.notes}
                onChange={(e) => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            {/* Next Button */}
            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (handleValidateStep1()) setCurrentStep(2);
                }}
                className="px-6 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#ED1C24] to-[#C41219] hover:shadow-lg transition-all flex items-center gap-2"
              >
                Continue to Menu &amp; Add-ons
                <Icon name="ArrowRightIcon" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MADRAS FLAVOURS MENU SELECTION + ADD-ON FIELD PER CATEGORY        */}
        {/* ========================================================================= */}
        {viewMode === 'form' && currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Package Requirements Notice */}
            <div className="bg-red-50/60 border border-red-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-red-600 text-white">
                    {currentPackage?.name}
                  </span>
                  <span className="text-xs text-gray-600 font-semibold">
                    £{effectivePackagePrice}/adult · £{effectiveKidsPrice}/kid
                  </span>
                </div>
                {currentPackage?.items && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentPackage.items.map((itemStr: string, idx: number) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-white border border-red-200 text-gray-800 font-medium">
                        ✓ {itemStr}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs text-gray-500 block">Total Selected Dishes:</span>
                <span className="text-lg font-black text-[#ED1C24]">
                  {Object.values(selectedDishes).flat().length + addOnMenuItems.length} items
                </span>
              </div>
            </div>

            {/* CATEGORIES LIST WITH ADD-ON FIELD FOR EVERY CATEGORY */}
            <div className="space-y-6">
              {[
                { key: 'staters', label: 'Staters / Starters', icon: 'SparklesIcon', items: menuCategories.staters || [] },
                { key: 'vegMains', label: 'Vegetarian Mains', icon: 'BeakerIcon', items: menuCategories.vegMains || [] },
                { key: 'riceAndNoodles', label: 'Rice & Noodles', icon: 'GlobeAltIcon', items: menuCategories.riceAndNoodles || [] },
                { key: 'paneerMains', label: 'Paneer Mains', icon: 'FireIcon', items: menuCategories.paneerMains || [] },
                { key: 'breads', label: 'Breads', icon: 'CakeIcon', items: menuCategories.breads || [] },
                { key: 'dhal', label: 'Dhal / Lentils', icon: 'HeartIcon', items: menuCategories.dhal || [] },
                { key: 'dessert', label: 'Desserts', icon: 'StarIcon', items: menuCategories.dessert || [] },
              ].map((category) => {
                const selectedInThisCategory = selectedDishes[category.key] || [];
                const addOnsInThisCategory = addOnMenuItems.filter(item => item.category === category.key);
                const maxAllowed = getCategoryAllowedCount(currentPackage, category.key);
                const isLimitReached = selectedInThisCategory.length >= maxAllowed && maxAllowed < 999;

                return (
                  <div key={category.key} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-red-50 text-[#ED1C24]">
                          <Icon name={category.icon} size={18} />
                        </div>
                        <h4 className="font-extrabold text-sm text-gray-900">{category.label}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {maxAllowed < 999 && (
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                            maxAllowed === 0
                              ? 'bg-gray-100 text-gray-500 border border-gray-200'
                              : isLimitReached
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {maxAllowed === 0
                              ? '0 in package (Use Add-on below)'
                              : `${selectedInThisCategory.length} / ${maxAllowed} selected ${isLimitReached ? '✓ (Quota Met)' : ''}`}
                          </span>
                        )}
                        {addOnsInThisCategory.length > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                            +${addOnsInThisCategory.length} Add-on
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Standard Dishes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {category.items.map((dishName: string) => {
                        const isChecked = selectedInThisCategory.includes(dishName);
                        const isBlocked = !isChecked && isLimitReached && maxAllowed < 999;
                        return (
                          <label
                            key={dishName}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-red-50/80 border-red-400 font-bold text-red-950 shadow-2xs'
                                : isBlocked
                                ? 'bg-gray-50/30 border-gray-200/60 text-gray-400 opacity-70 hover:opacity-100'
                                : 'bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleDishSelection(category.key, dishName)}
                              className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                            />
                            <span className="flex-1 select-none">{dishName}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* ── CRITICAL FEATURE: ADD-ON FIELD FOR THIS MENU CATEGORY ── */}
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 bg-amber-50/40 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Icon name="PlusCircleIcon" size={15} className="text-amber-700" />
                          Add-on / Extra Dishes for {category.label}
                        </span>
                        <span className="text-[10px] text-amber-800/80">
                          Add custom dishes not in the standard list with optional extra cost
                        </span>
                      </div>

                      {/* Display already added add-ons for this category */}
                      {addOnsInThisCategory.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {addOnsInThisCategory.map((addOn) => (
                            <div
                              key={addOn.id}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-gray-800 shadow-2xs"
                            >
                              <span>{addOn.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-extrabold">
                                {addOn.cost > 0
                                  ? (addOn.costType === 'per_person' ? `+£${addOn.cost}/pax` : `+£${addOn.cost} flat`)
                                  : 'Included'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveAddOnDish(addOn.id)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                                title="Remove Add-on"
                              >
                                <Icon name="TrashIcon" size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Custom Add-on Input Row */}
                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Enter custom add-on ${category.label.toLowerCase()} dish...`}
                          value={newAddOnName[category.key] || ''}
                          onChange={(e) => setNewAddOnName({ ...newAddOnName, [category.key]: e.target.value })}
                          className="flex-1 w-full border border-amber-300 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">£</span>
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              placeholder="Extra Cost"
                              value={newAddOnCost[category.key] || ''}
                              onChange={(e) => setNewAddOnCost({ ...newAddOnCost, [category.key]: e.target.value })}
                              className="w-full pl-6 pr-2 py-1.5 border border-amber-300 rounded-xl text-xs bg-white font-bold"
                            />
                          </div>

                          <select
                            value={newAddOnCostType[category.key] || 'per_person'}
                            onChange={(e) => setNewAddOnCostType({ ...newAddOnCostType, [category.key]: e.target.value as any })}
                            className="border border-amber-300 rounded-xl px-2 py-1.5 text-xs bg-white font-medium"
                          >
                            <option value="per_person">/ Guest</option>
                            <option value="flat">Flat Fee</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleAddCustomAddOnDish(category.key)}
                            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1"
                          >
                            <Icon name="PlusIcon" size={13} />
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Outdoor Live Dosa Items (if Dosa Party package selected or available) */}
              {(selectedPackageId === 'live_dosa' || true) && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                        <Icon name="FireIcon" size={18} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-900">Live Dosa Party Items (Live Cooking Stations)</h4>
                        <p className="text-[10px] text-gray-500">Includes fresh live dosas, idly, vada, chutneys and sambar</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      Live Counters
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(liveDosaPartyMenu.items || []).map((dishName: string) => {
                      const isChecked = (selectedDishes.liveDosa || []).includes(dishName);
                      return (
                        <label
                          key={dishName}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-orange-50/80 border-orange-400 font-bold text-orange-950 shadow-2xs'
                              : 'bg-gray-50/50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDishSelection('liveDosa', dishName)}
                            className="rounded text-orange-600 focus:ring-orange-500 h-4 w-4"
                          />
                          <span className="flex-1 select-none">{dishName}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Add-on field for Live Dosa Items */}
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200 bg-orange-50/40 rounded-xl p-3.5 space-y-3">
                    <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                      <Icon name="PlusCircleIcon" size={15} className="text-orange-700" />
                      Add-on / Custom Live Items (e.g. Cheese Dosa, Rava Dosa, Special Chutney)
                    </span>

                    {/* Display existing add-ons for Live Dosa */}
                    {addOnMenuItems.filter(i => i.category === 'liveDosa').length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {addOnMenuItems.filter(i => i.category === 'liveDosa').map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-orange-300 text-xs font-bold text-gray-800 shadow-2xs"
                          >
                            <span>{addOn.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-900 font-extrabold">
                              {addOn.cost > 0
                                ? (addOn.costType === 'per_person' ? `+£${addOn.cost}/pax` : `+£${addOn.cost} flat`)
                                : 'Included'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAddOnDish(addOn.id)}
                              className="text-red-500 hover:text-red-700 p-0.5"
                            >
                              <Icon name="TrashIcon" size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter custom live item (e.g. Paneer Dosa, Chilli Garlic Dosa)..."
                        value={newAddOnName.liveDosa || ''}
                        onChange={(e) => setNewAddOnName({ ...newAddOnName, liveDosa: e.target.value })}
                        className="flex-1 w-full border border-orange-300 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none"
                      />
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">£</span>
                          <input
                            type="number"
                            min={0}
                            placeholder="Cost"
                            value={newAddOnCost.liveDosa || ''}
                            onChange={(e) => setNewAddOnCost({ ...newAddOnCost, liveDosa: e.target.value })}
                            className="w-full pl-6 pr-2 py-1.5 border border-orange-300 rounded-xl text-xs bg-white font-bold"
                          />
                        </div>
                        <select
                          value={newAddOnCostType.liveDosa || 'per_person'}
                          onChange={(e) => setNewAddOnCostType({ ...newAddOnCostType, liveDosa: e.target.value as any })}
                          className="border border-orange-300 rounded-xl px-2 py-1.5 text-xs bg-white font-medium"
                        >
                          <option value="per_person">/ Guest</option>
                          <option value="flat">Flat Fee</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAddCustomAddOnDish('liveDosa')}
                          className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs whitespace-nowrap"
                        >
                          Add Live Item
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Icon name="ArrowLeftIcon" size={16} />
                Back to Event &amp; Guests
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#ED1C24] to-[#C41219] hover:shadow-lg transition-all flex items-center gap-2"
              >
                Continue to Pricing &amp; Logistics
                <Icon name="ArrowRightIcon" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: EXTRAS, EXTRA CHARGES (TRANSPORTATION), DISCOUNTS & AUDIT         */}
        {/* ========================================================================= */}
        {viewMode === 'form' && currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 3.1 EXTRA CHARGES FIELD (TRANSPORTATION, DELIVERY, CLEANING, ETC.) */}
            <div className="bg-gradient-to-br from-red-50/50 via-white to-orange-50/30 border-2 border-red-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="TruckIcon" size={18} className="text-[#ED1C24]" />
                    Extra Charges &amp; Transportation Fees
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add delivery, van transportation, cleaning, or custom logistics charges.
                  </p>
                </div>
                <span className="text-sm font-black text-[#ED1C24]">
                  Total: £{extraChargesTotal.toLocaleString()}
                </span>
              </div>

              {/* Preset Quick-Add Buttons */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                  Quick Preset Charges:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EXTRA_CHARGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPresetExtraCharge(preset)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 text-gray-800 shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <Icon name="PlusIcon" size={13} className="text-red-600" />
                      {preset.label} <strong className="text-[#ED1C24]">£{preset.amount}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Extra Charges List */}
              {extraChargesList.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <span className="text-[11px] font-bold text-gray-600 block">Applied Extra Charges:</span>
                  {extraChargesList.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between bg-white border border-red-200 rounded-xl p-3 shadow-2xs"
                    >
                      <div className="flex-1 pr-3">
                        <div className="text-xs font-bold text-gray-900">{charge.label}</div>
                        {charge.reason && (
                          <div className="text-[11px] text-gray-500 italic mt-0.5">Note: {charge.reason}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">£</span>
                          <input
                            type="number"
                            min={0}
                            value={charge.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setExtraChargesList(prev => prev.map(c => c.id === charge.id ? { ...c, amount: val } : c));
                            }}
                            className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-[#ED1C24] bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraCharge(charge.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove Charge"
                        >
                          <Icon name="TrashIcon" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Extra Charge Creator */}
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <Icon name="PlusCircleIcon" size={14} className="text-red-600" />
                  Add Custom Surcharge / Transportation Fee
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Charge Description (e.g. Van Delivery to Wembley)..."
                    value={newExtraChargeLabel}
                    onChange={(e) => setNewExtraChargeLabel(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">£</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Amount (£)"
                      value={newExtraChargeAmount}
                      onChange={(e) => setNewExtraChargeAmount(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Reason / Logistics note..."
                    value={newExtraChargeReason}
                    onChange={(e) => setNewExtraChargeReason(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomExtraCharge}
                    className="px-4 py-1.5 rounded-lg bg-[#ED1C24] hover:bg-[#C41219] text-white font-bold text-xs"
                  >
                    Add Charge
                  </button>
                </div>
              </div>
            </div>

            {/* 3.2 LIVE COUNTERS & EVENT EXTRAS (WITH CUSTOM PRICE & REASON EDITORS) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="SquaresPlusIcon" size={18} className="text-[#ED1C24]" />
                    Live Counters &amp; Event Extras
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select add-on live stations or equipment. Click &quot;Custom Price&quot; to override any rate with a reason.
                  </p>
                </div>
                <span className="text-sm font-black text-[#ED1C24]">
                  Total: £{extrasTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {extras.map((extraItem: any) => {
                  const existing = selectedExtras.find(e => e.name === extraItem.name);
                  const isSelected = !!existing;

                  return (
                    <div
                      key={extraItem.name}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#ED1C24] bg-red-50/40 shadow-2xs'
                          : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExtras(prev => [
                                  ...prev,
                                  {
                                    name: extraItem.name,
                                    price: extraItem.price,
                                    defaultPrice: extraItem.price,
                                  }
                                ]);
                              } else {
                                setSelectedExtras(prev => prev.filter(item => item.name !== extraItem.name));
                              }
                            }}
                            className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                          />
                          <span>{extraItem.name}</span>
                        </label>
                        <span className="text-xs font-black text-[#ED1C24]">
                          £{existing?.price ?? extraItem.price}
                        </span>
                      </div>

                      {/* Inline Custom Price Editor for this Extra */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-red-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-600">Edit Extra Price:</span>
                            {existing.isCustomPrice && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExtras(prev => prev.map(item => item.name === extraItem.name ? {
                                    ...item,
                                    price: item.defaultPrice,
                                    isCustomPrice: false,
                                    reason: '',
                                  } : item));
                                }}
                                className="text-[10px] text-red-600 hover:underline"
                              >
                                Reset (£{existing.defaultPrice})
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[11px]">£</span>
                              <input
                                type="number"
                                min={0}
                                value={existing.price}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSelectedExtras(prev => prev.map(item => item.name === extraItem.name ? {
                                    ...item,
                                    price: val,
                                    isCustomPrice: true,
                                  } : item));
                                }}
                                className="w-full pl-5 pr-1.5 py-1 border border-gray-300 rounded text-xs font-bold"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Reason for rate..."
                              value={existing.reason || ''}
                              onChange={(e) => {
                                const r = e.target.value;
                                setSelectedExtras(prev => prev.map(item => item.name === extraItem.name ? {
                                  ...item,
                                  reason: r,
                                  isCustomPrice: true,
                                } : item));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-[11px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.3 TABLE SERVICE CHARGES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="SparklesIcon" size={18} className="text-[#ED1C24]" />
                    Table Service Charges (Optional)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Per-person serving staff charges.
                  </p>
                </div>
                <span className="text-sm font-black text-[#ED1C24]">
                  Total: £{tableServiceTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tableService.map((ts) => {
                  const existing = selectedTableServices.find(item => item.service === ts.service);
                  const isChecked = !!existing;

                  return (
                    <div
                      key={ts.service}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'border-red-400 bg-red-50/60 font-bold'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                      }`}
                    >
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTableServices(prev => [...prev, { service: ts.service, price: ts.price }]);
                            } else {
                              setSelectedTableServices(prev => prev.filter(item => item.service !== ts.service));
                            }
                          }}
                          className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                        />
                        <span className="flex-1">{ts.service}</span>
                      </label>
                      <div className="text-[11px] text-[#ED1C24] font-black mt-1 pl-6">
                        {ts.price}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.4 DISCOUNT SECTION (APPLIED BEFORE DEPOSIT & FINAL INVOICE) */}
            <div className="bg-white border-2 border-emerald-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                    <Icon name="TagIcon" size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                      1. Discount (Applied Before Deposit &amp; Final Invoice)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Discounts directly reduce the subtotal before calculating the required deposit and final invoice balance.
                    </p>
                  </div>
                </div>
                {discountAmount > 0 ? (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                    -£{discountAmount.toLocaleString()} Deducted
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-gray-400">
                    Optional
                  </span>
                )}
              </div>

              {/* Running Calculation Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Subtotal Before Discount</span>
                  <span className="text-sm font-extrabold text-gray-900">£{subtotalBeforeDiscount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Discount Deduction</span>
                  <span className="text-sm font-extrabold text-emerald-600">
                    {discountAmount > 0 ? `-£${discountAmount.toLocaleString()}` : '£0'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase font-bold">Net Total (After Discount)</span>
                  <span className="text-sm font-extrabold text-gray-900">£{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                </div>

                {discountType !== 'none' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Discount Value ({discountType === 'percentage' ? '%' : '£'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 150'}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Reason for Discount * <span className="text-red-500">(Required)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Returning client loyalty, seasonal promotion, negotiated group discount..."
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3.5 ADVANCE DEPOSIT SECTION (APPLIED AFTER DISCOUNT, BEFORE FINAL INVOICE) */}
            <div className="bg-white border-2 border-amber-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                    <Icon name="BanknotesIcon" size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                      2. Advance Deposit &amp; Payment Terms
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Calculated on net grand total (£{grandTotal.toLocaleString()}) after discount.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-gray-500">Deposit:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    £{effectiveDeposit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 3 Payment Options (referencing Honeymoon) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'advance',
                    title: 'Pay Advance / Deposit',
                    subtitle: `Suggested (30%): £${standardSuggestedDeposit.toLocaleString()}`,
                    badge: 'Standard Policy',
                    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
                  },
                  {
                    id: 'full',
                    title: 'Pay Full Amount Now',
                    subtitle: `£${grandTotal.toLocaleString()} collected now`,
                    badge: 'Fully Paid & Scheduled',
                    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  },
                  {
                    id: 'pending',
                    title: 'Deposit Pending',
                    subtitle: '£0 collected now',
                    badge: 'Pay Later / Pending',
                    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
                  },
                ].map((opt) => {
                  const isSelected = paymentChoice === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => {
                        setPaymentChoice(opt.id as any);
                        if (opt.id === 'full') {
                          setDepositPaid(true);
                          setFinalPaymentPaid(true);
                        } else if (opt.id === 'pending') {
                          setDepositPaid(false);
                          setFinalPaymentPaid(false);
                        } else {
                          setFinalPaymentPaid(false);
                          if (!customDepositAmount || Number(customDepositAmount) <= 0) {
                            setCustomDepositAmount(standardSuggestedDeposit.toString());
                          }
                        }
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400 shadow-sm'
                          : 'border-gray-200 bg-gray-50/40 hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-gray-900">{opt.title}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Icon name="CheckIcon" size={10} />}
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-amber-800">{opt.subtitle}</div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border ${opt.badgeColor}`}>
                        {opt.badge}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Deposit Inputs & Presets (when paymentChoice === 'advance') */}
              {paymentChoice === 'advance' && (
                <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Icon name="BanknotesIcon" size={15} className="text-amber-700" />
                      Advance Deposit Amount Required (£):
                    </label>
                    <span className="text-[11px] text-amber-800 font-semibold bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                      Standard Policy: £{standardSuggestedDeposit.toLocaleString()} (30% of Net Total)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">£</span>
                      <input
                        type="number"
                        min="0"
                        max={grandTotal}
                        value={customDepositAmount !== '' ? customDepositAmount : standardSuggestedDeposit}
                        onChange={(e) => setCustomDepositAmount(e.target.value)}
                        placeholder={standardSuggestedDeposit.toString()}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="flex items-center gap-4 px-3 py-2 bg-white rounded-xl border border-gray-200">
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={depositPaid}
                          onChange={(e) => setDepositPaid(e.target.checked)}
                          className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                        />
                        Deposit Received / Confirmed
                      </label>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-gray-500 font-medium">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setCustomDepositAmount(standardSuggestedDeposit.toString())}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 transition-colors shadow-2xs"
                    >
                      30% Policy (£{standardSuggestedDeposit.toLocaleString()})
                    </button>
                    {grandTotal > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCustomDepositAmount(Math.round(grandTotal * 0.25).toString())}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors shadow-2xs"
                        >
                          25% (£{Math.round(grandTotal * 0.25).toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomDepositAmount(Math.round(grandTotal * 0.50).toString())}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition-colors shadow-2xs"
                        >
                          50% (£{Math.round(grandTotal * 0.50).toLocaleString()})
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Deposit Payment Method</label>
                  <select
                    value={paymentMethodDeposit}
                    onChange={(e) => setPaymentMethodDeposit(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="Bank Transfer">Bank Transfer (BACS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit / Debit Card">Credit / Debit Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 flex items-center justify-between">
                    <span className="text-gray-500">Balance for Final Invoice:</span>
                    <span className="font-extrabold text-sm text-gray-900">£{balanceRemaining.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3.6 FINAL INVOICE & COMPLETE ORDER PREVIEW (AFTER DISCOUNT & DEPOSIT) */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="DocumentCheckIcon" size={20} className="text-[#ED1C24]" />
                    <h3 className="text-base font-black uppercase tracking-wider text-white">
                      3. Final Invoice &amp; Financial Breakdown
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Itemized billing statement after applying discount and deducting advance deposit.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Final Invoice Total</span>
                  <span className="text-2xl font-black text-[#ED1C24]">
                    £{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Itemized Lines */}
              <div className="space-y-2 text-xs border-b border-gray-800 pb-4">
                <div className="flex justify-between text-gray-300">
                  <span>Adult Catering ({customerDetails.adults || 0} × £{effectivePackagePrice}):</span>
                  <span className="font-bold text-white">£{adultFoodTotal.toLocaleString()}</span>
                </div>

                {Number(customerDetails.kids4to10 || 0) > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Kids Catering ({customerDetails.kids4to10} × £{effectiveKidsPrice}):</span>
                    <span className="font-bold text-white">+£{kidsFoodTotal.toLocaleString()}</span>
                  </div>
                )}

                {Number(customerDetails.kidsUnder4 || 0) > 0 && effectiveKidsUnder4Price > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Infants ({customerDetails.kidsUnder4} × £{effectiveKidsUnder4Price}):</span>
                    <span className="font-bold text-white">+£{kidsUnder4FoodTotal.toLocaleString()}</span>
                  </div>
                )}

                {addOnMenuItems.length > 0 && (
                  <div className="flex justify-between text-teal-300">
                    <span>Add-on Custom Dishes ({addOnMenuItems.length} items):</span>
                    <span className="font-bold">+£{addOnsTotal.toLocaleString()}</span>
                  </div>
                )}

                {extrasTotal > 0 && (
                  <div className="flex justify-between text-purple-300">
                    <span>Live Counters &amp; Extras ({selectedExtras.length} items):</span>
                    <span className="font-bold">+£{extrasTotal.toLocaleString()}</span>
                  </div>
                )}

                {tableServiceTotal > 0 && (
                  <div className="flex justify-between text-blue-300">
                    <span>Table Service ({selectedTableServices.length} items):</span>
                    <span className="font-bold">+£{tableServiceTotal.toLocaleString()}</span>
                  </div>
                )}

                {extraChargesList.map((charge, idx) => (
                  <div key={idx} className="flex justify-between text-amber-300">
                    <span>+ {charge.label}:</span>
                    <span className="font-bold">£{charge.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* 5-Step Financial Progression (Subtotal -> Discount -> Grand Total -> Deposit -> Final Balance Due) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-gray-800/80 rounded-xl border border-gray-700 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">Subtotal</span>
                  <span className="font-bold text-white text-sm">£{subtotalBeforeDiscount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-400 block text-[10px] uppercase font-semibold">Discount</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {discountAmount > 0 ? `-£${discountAmount.toLocaleString()}` : '£0'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-300 block text-[10px] uppercase font-semibold">Grand Total</span>
                  <span className="font-black text-white text-sm">£{grandTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-amber-400 block text-[10px] uppercase font-semibold">Deposit ({paymentChoice === 'full' ? '100%' : (depositPaid ? 'Paid' : 'Due')})</span>
                  <span className="font-bold text-amber-400 text-sm">£{effectiveDeposit.toLocaleString()}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-red-400 block text-[10px] uppercase font-semibold">Final Invoice Due</span>
                  <span className="font-black text-[#ED1C24] text-base">£{balanceRemaining.toLocaleString()}</span>
                </div>
              </div>

              {/* 3 PDFs Toolbar in Step 3 (referencing Honeymoon) */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                    Event Documents &amp; Invoices:
                  </span>
                  <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    3 PDFs Available
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {downloadMenuPDF && (
                    <button
                      type="button"
                      onClick={handleGenerateCurrentMenuPDF}
                      className="px-3 py-2 rounded-xl border border-amber-700/80 bg-amber-950/40 hover:bg-amber-900/60 font-bold text-amber-200 text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                      title="Generate Chef Kitchen Sheet / Menu PDF"
                    >
                      <Icon name="DocumentTextIcon" size={15} className="text-amber-400" />
                      1. Menu / Kitchen PDF
                    </button>
                  )}

                  {downloadInvoicePDF && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleGenerateCurrentInvoice(true)}
                        className="px-3 py-2 rounded-xl border border-emerald-700/80 bg-emerald-950/40 hover:bg-emerald-900/60 font-bold text-emerald-200 text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                        title="Generate Official Deposit Invoice PDF"
                      >
                        <Icon name="DocumentTextIcon" size={15} className="text-emerald-400" />
                        2. Deposit Invoice PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGenerateCurrentInvoice(false)}
                        className="px-3 py-2 rounded-xl border border-blue-700/80 bg-blue-950/40 hover:bg-blue-900/60 font-bold text-blue-200 text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                        title="Generate Complete Final Invoice PDF"
                      >
                        <Icon name="DocumentCheckIcon" size={15} className="text-blue-400" />
                        3. Final Invoice PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 3.7 TRANSPARENT PRICE ADJUSTMENTS & REASONS AUDIT CARD (REFER HONEYMOON) */}
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Icon name="ShieldCheckIcon" size={20} className="text-amber-800" />
                  <h4 className="font-black text-sm text-amber-950 uppercase tracking-wide">
                    Transparent Price Adjustments &amp; Audit Reasons
                  </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950">
                  {activePriceOverridesList.length} Active Adjustments
                </span>
              </div>

              {activePriceOverridesList.length === 0 ? (
                <p className="text-xs text-amber-900/70 italic">
                  No pricing overrides or special fees applied. Standard package pricing active.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-amber-200 text-amber-900/80 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2 pr-3">Item / Adjustment</th>
                        <th className="py-2 px-3">Original</th>
                        <th className="py-2 px-3">Custom</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 pl-3">Logged Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200/60 font-medium text-amber-950">
                      {activePriceOverridesList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-amber-100/50">
                          <td className="py-2.5 pr-3 font-bold">{row.title}</td>
                          <td className="py-2.5 px-3 text-gray-500">{row.original > 0 ? `£${row.original}` : '—'}</td>
                          <td className="py-2.5 px-3 font-extrabold text-[#ED1C24]">{row.custom < 0 ? `-£${Math.abs(row.custom)}` : `£${row.custom}`}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/90 text-amber-950">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-2.5 pl-3 italic text-gray-700">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Icon name="ArrowLeftIcon" size={16} />
                Back to Event &amp; Guests
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#ED1C24] to-[#C41219] hover:shadow-lg transition-all flex items-center gap-2"
              >
                Continue to Pricing &amp; Logistics
                <Icon name="ArrowRightIcon" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: EXTRAS, EXTRA CHARGES (TRANSPORTATION), DISCOUNTS & AUDIT         */}
        {/* ========================================================================= */}
        {viewMode === 'form' && currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 3.1 EXTRA CHARGES FIELD (TRANSPORTATION, DELIVERY, CLEANING, ETC.) */}
            <div className="bg-gradient-to-br from-red-50/50 via-white to-orange-50/30 border-2 border-red-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="TruckIcon" size={18} className="text-[#ED1C24]" />
                    Extra Charges &amp; Transportation Fees
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add delivery, van transportation, cleaning, or custom logistics charges.
                  </p>
                </div>
                <span className="text-sm font-black text-[#ED1C24]">
                  Total: £{extraChargesTotal.toLocaleString()}
                </span>
              </div>

              {/* Preset Quick-Add Buttons */}
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                  Quick Preset Charges:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_EXTRA_CHARGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddPresetExtraCharge(preset)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-red-50 border border-gray-300 hover:border-red-300 text-gray-800 shadow-2xs transition-all flex items-center gap-1.5"
                    >
                      <Icon name="PlusIcon" size={13} className="text-red-600" />
                      {preset.label} <strong className="text-[#ED1C24]">£{preset.amount}</strong>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Extra Charges List */}
              {extraChargesList.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <span className="text-[11px] font-bold text-gray-600 block">Applied Extra Charges:</span>
                  {extraChargesList.map((charge) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between bg-white border border-red-200 rounded-xl p-3 shadow-2xs"
                    >
                      <div className="flex-1 pr-3">
                        <div className="text-xs font-bold text-gray-900">{charge.label}</div>
                        {charge.reason && (
                          <div className="text-[11px] text-gray-500 italic mt-0.5">Note: {charge.reason}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">£</span>
                          <input
                            type="number"
                            min={0}
                            value={charge.amount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setExtraChargesList(prev => prev.map(c => c.id === charge.id ? { ...c, amount: val } : c));
                            }}
                            className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-[#ED1C24] bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraCharge(charge.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove Charge"
                        >
                          <Icon name="TrashIcon" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom Extra Charge Creator */}
              <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-2.5">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <Icon name="PlusCircleIcon" size={14} className="text-red-600" />
                  Add Custom Surcharge / Transportation Fee
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Charge Description (e.g. Van Delivery to Wembley)..."
                    value={newExtraChargeLabel}
                    onChange={(e) => setNewExtraChargeLabel(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">£</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Amount (£)"
                      value={newExtraChargeAmount}
                      onChange={(e) => setNewExtraChargeAmount(e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Reason / Logistics note..."
                    value={newExtraChargeReason}
                    onChange={(e) => setNewExtraChargeReason(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCustomExtraCharge}
                    className="px-4 py-1.5 rounded-lg bg-[#ED1C24] hover:bg-[#C41219] text-white font-bold text-xs"
                  >
                    Add Charge
                  </button>
                </div>
              </div>
            </div>

            {/* 3.2 LIVE COUNTERS & EVENT EXTRAS (WITH CUSTOM PRICE & REASON EDITORS) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="SquaresPlusIcon" size={18} className="text-[#ED1C24]" />
                    Live Counters &amp; Event Extras
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select add-on live stations or equipment. Click &quot;Custom Price&quot; to override any rate with a reason.
                  </p>
                </div>
                <span className="text-sm font-black text-[#ED1C24]">
                  Total: £{extrasTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {extras.map((extraItem: any) => {
                  const existing = selectedExtras.find(e => e.name === extraItem.name);
                  const isSelected = !!existing;

                  return (
                    <div
                      key={extraItem.name}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[#ED1C24] bg-red-50/40 shadow-2xs'
                          : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-900 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExtras(prev => [
                                  ...prev,
                                  {
                                    name: extraItem.name,
                                    price: extraItem.price,
                                    defaultPrice: extraItem.price,
                                  }
                                ]);
                              } else {
                                setSelectedExtras(prev => prev.filter(item => item.name !== extraItem.name));
                              }
                            }}
                            className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                          />
                          <span>{extraItem.name}</span>
                        </label>
                        <span className="text-xs font-black text-[#ED1C24]">
                          £{existing?.price ?? extraItem.price}
                        </span>
                      </div>

                      {/* Inline Custom Price Editor for this Extra */}
                      {isSelected && (
                        <div className="mt-2.5 pt-2 border-t border-red-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-gray-600">Edit Extra Price:</span>
                            {existing.isCustomPrice && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExtras(prev => prev.map(item => item.name === extraItem.name ? {
                                    ...item,
                                    price: item.defaultPrice,
                                    isCustomPrice: false,
                                    reason: '',
                                  } : item));
                                }}
                                className="text-[10px] text-red-600 hover:underline"
                              >
                                Reset (£{existing.defaultPrice})
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[11px]">£</span>
                              <input
                                type="number"
                                min={0}
                                value={existing.price}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setSelectedExtras(prev => prev.map(item => item.name === extraItem.name ? {
                                    ...item,
                                    price: val,
                                    isCustomPrice: true,
                                  } : item));
                                }}
                                className="w-full pl-5 pr-1.5 py-1 border border-gray-300 rounded text-xs font-bold"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Reason for rate..."
                              value={existing.reason || ''}
                              onChange={(e) => {
                                const r = e.target.value;
                                setSelectedExtras(prev => prev.map(item => item.name === extraItem.name ? {
                                  ...item,
                                  reason: r,
                                  isCustomPrice: true,
                                } : item));
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-[11px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.3 TABLE SERVICE CHARGES */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Icon name="SparklesIcon" size={18} className="text-[#ED1C24]" />
                    Table Service Charges (Optional)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Per-person serving staff charges.
                  </p>
                </div>
                <span className="text-sm font-black text-[#ED1C24]">
                  Total: £{tableServiceTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tableService.map((ts) => {
                  const existing = selectedTableServices.find(item => item.service === ts.service);
                  const isChecked = !!existing;

                  return (
                    <div
                      key={ts.service}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'border-red-400 bg-red-50/60 font-bold'
                          : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100'
                      }`}
                    >
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTableServices(prev => [...prev, { service: ts.service, price: ts.price }]);
                            } else {
                              setSelectedTableServices(prev => prev.filter(item => item.service !== ts.service));
                            }
                          }}
                          className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                        />
                        <span className="flex-1">{ts.service}</span>
                      </label>
                      <div className="text-[11px] text-[#ED1C24] font-black mt-1 pl-6">
                        {ts.price}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.4 DISCOUNTS SECTION (WITH REASON) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Icon name="TagIcon" size={18} className="text-[#ED1C24]" />
                  Discount (Optional with Required Reason)
                </h3>
                {discountAmount > 0 && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    -£{discountAmount.toLocaleString()} Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="none">No Discount</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (£)</option>
                  </select>
                </div>

                {discountType !== 'none' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Discount Value ({discountType === 'percentage' ? '%' : '£'})
                      </label>
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. 10"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Discount *</label>
                      <input
                        type="text"
                        placeholder="e.g. Returning family client, referral coupon..."
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 3.5 TRANSPARENT PRICE ADJUSTMENTS & REASONS AUDIT CARD (REFER HONEYMOON) */}
            <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <Icon name="ShieldCheckIcon" size={20} className="text-amber-800" />
                  <h4 className="font-black text-sm text-amber-950 uppercase tracking-wide">
                    Transparent Price Adjustments &amp; Audit Reasons
                  </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950">
                  {activePriceOverridesList.length} Active Adjustments
                </span>
              </div>

              {activePriceOverridesList.length === 0 ? (
                <p className="text-xs text-amber-900/70 italic">
                  No pricing overrides or special fees applied. Standard package pricing active.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-amber-200 text-amber-900/80 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2 pr-3">Item / Adjustment</th>
                        <th className="py-2 px-3">Original</th>
                        <th className="py-2 px-3">Custom</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 pl-3">Logged Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200/60 font-medium text-amber-950">
                      {activePriceOverridesList.map((row, idx) => (
                        <tr key={idx} className="hover:bg-amber-100/50">
                          <td className="py-2.5 pr-3 font-bold">{row.title}</td>
                          <td className="py-2.5 px-3 text-gray-500">{row.original > 0 ? `£${row.original}` : '—'}</td>
                          <td className="py-2.5 px-3 font-extrabold text-[#ED1C24]">{row.custom < 0 ? `-£${Math.abs(row.custom)}` : `£${row.custom}`}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200/90 text-amber-950">
                              {row.category}
                            </span>
                          </td>
                          <td className="py-2.5 pl-3 italic text-gray-700">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 3.6 FINANCIAL SUMMARY & DEPOSIT */}
            <div className="bg-gray-900 text-white rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  Event Grand Total Breakdown
                </span>
                <span className="text-2xl font-black text-white">
                  £{grandTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block">Food &amp; Add-ons:</span>
                  <span className="font-bold text-white text-sm">£{foodBaseAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Extras &amp; Table Service:</span>
                  <span className="font-bold text-white text-sm">£{(extrasTotal + tableServiceTotal).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Transportation &amp; Charges:</span>
                  <span className="font-bold text-amber-400 text-sm">£{extraChargesTotal.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Discount Deduction:</span>
                  <span className="font-bold text-emerald-400 text-sm">-£{discountAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Deposit Inputs */}
              <div className="border-t border-gray-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/80 rounded-xl p-3.5 border border-gray-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Deposit Required (£):</span>
                    <span className="text-[10px] text-gray-400">Suggested (30%): £{standardSuggestedDeposit}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">£</span>
                    <input
                      type="number"
                      value={effectiveDeposit}
                      onChange={(e) => setCustomDepositAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm font-bold text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="bg-gray-800/80 rounded-xl p-3.5 border border-gray-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300">Remaining Balance:</span>
                    <span className="text-xs font-black text-amber-400">£{balanceRemaining.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={depositPaid}
                        onChange={(e) => setDepositPaid(e.target.checked)}
                        className="rounded text-[#ED1C24] focus:ring-red-500 h-4 w-4"
                      />
                      Deposit Paid
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={finalPaymentPaid}
                        onChange={(e) => setFinalPaymentPaid(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                      />
                      Final Paid (Completed)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Icon name="ArrowLeftIcon" size={16} />
                Back to Menu Selection
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSaveBooking}
                className="px-8 py-3.5 rounded-xl font-extrabold text-sm text-white bg-gradient-to-r from-[#ED1C24] to-[#9C0C11] hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>Saving Booking...</>
                ) : (
                  <>
                    <Icon name="CheckCircleIcon" size={18} />
                    {isEditMode ? 'Update Event Booking' : 'Confirm & Create Booking'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: TRACKER & CONFIRMED EVENT VIEW                                    */}
        {/* ========================================================================= */}
        {viewMode === 'tracker' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 4-Step Milestone Tracker */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Event Milestone Progress</span>
                  <h3 className="text-lg font-black text-gray-900 mt-0.5">
                    {customerDetails.name} • {customerDetails.eventType}
                  </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  finalPaymentPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : depositPaid
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {finalPaymentPaid ? 'Event Confirmed & Paid' : depositPaid ? 'Deposit Received' : 'Deposit Pending'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative mb-8">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#ED1C24] to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: finalPaymentPaid ? '100%' : depositPaid ? '66%' : '33%' }}
                />
                <div className="relative flex justify-between">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500 text-white font-bold text-xs ring-4 ring-white shadow">
                      ✓
                    </div>
                    <span className="text-xs font-bold text-gray-900 mt-2">1. Booking Created</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow ${
                      depositPaid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                    }`}>
                      {depositPaid ? '✓' : '2'}
                    </div>
                    <span className="text-xs font-bold text-gray-900 mt-2">2. Deposit (£{effectiveDeposit})</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow ${
                      finalPaymentPaid ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {finalPaymentPaid ? '✓' : '3'}
                    </div>
                    <span className="text-xs font-bold text-gray-900 mt-2">3. Final Balance</span>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-xs text-gray-500 block">Event Schedule</span>
                  <span className="text-sm font-extrabold text-gray-900 block mt-1">
                    📅 {customerDetails.date} ({customerDetails.timeSession})
                  </span>
                  <span className="text-xs text-gray-600 mt-1 block">
                    👥 {customerDetails.adults} Adults · {customerDetails.kids4to10} Kids
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-xs text-gray-500 block">Package &amp; Rates</span>
                  <span className="text-sm font-extrabold text-[#ED1C24] block mt-1">
                    {currentPackage?.name}
                  </span>
                  <span className="text-xs text-gray-600 mt-1 block">
                    £{effectivePackagePrice}/adult · £{effectiveKidsPrice}/kid
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-1">
                  <span className="text-xs text-gray-500 font-bold block mb-1">Financial Breakdown</span>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold">£{subtotalBeforeDiscount.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Discount ({discountReason || 'Discount'}):</span>
                      <span>-£{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-black text-gray-900 pt-1 border-t border-gray-200">
                    <span>Grand Total:</span>
                    <span className="text-sm font-extrabold text-[#ED1C24]">£{grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-amber-700 font-bold">
                    <span>Deposit:</span>
                    <span>£{effectiveDeposit.toLocaleString()} ({depositPaid || paymentChoice === 'full' ? 'Paid' : 'Pending'})</span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-700 font-bold">
                    <span>Final Invoice Balance:</span>
                    <span>£{balanceRemaining.toLocaleString()} ({finalPaymentPaid || paymentChoice === 'full' ? 'Paid' : 'Due'})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Proofs Upload & Review */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Deposit Proof */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-gray-900">Deposit Payment Proof</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${depositPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {depositPaid ? 'Confirmed' : 'Pending'}
                  </span>
                </div>

                {paymentProofDeposit ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                    <img src={paymentProofDeposit} alt="Deposit Proof" className="w-full h-full object-cover" />
                    <a
                      href={paymentProofDeposit}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                    >
                      View Full Size
                    </a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-xs">
                    No deposit receipt uploaded yet.
                  </div>
                )}

                <label className="block">
                  <span className="sr-only">Upload Deposit Receipt</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'deposit');
                      }
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-[#ED1C24] hover:file:bg-red-100 cursor-pointer"
                  />
                </label>
              </div>

              {/* Final Balance Proof */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-gray-900">Final Balance Payment Proof</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${finalPaymentPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                    {finalPaymentPaid ? 'Fully Paid' : 'Balance Outstanding'}
                  </span>
                </div>

                {paymentProofFinal ? (
                  <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                    <img src={paymentProofFinal} alt="Final Proof" className="w-full h-full object-cover" />
                    <a
                      href={paymentProofFinal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                    >
                      View Full Size
                    </a>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 text-xs">
                    No final payment receipt uploaded yet.
                  </div>
                )}

                <label className="block">
                  <span className="sr-only">Upload Final Receipt</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], 'final');
                      }
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-[#ED1C24] hover:file:bg-red-100 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setViewMode('form');
                  setCurrentStep(1);
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Icon name="PencilSquareIcon" size={14} />
                Edit Full Booking Details
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/${customerDetails.phone.replace(/\D/g, '')}?text=${generateWhatsAppQuoteText()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#25D366] hover:bg-[#1EBE5D] transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={15} />
                  Send WhatsApp Quote
                </a>

                {downloadInvoicePDF && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleGenerateCurrentInvoice(true)}
                      className="px-4 py-2 rounded-xl font-bold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 shadow-2xs transition-all"
                      title="Download Official Deposit Invoice PDF"
                    >
                      <Icon name="DocumentTextIcon" size={15} className="text-emerald-600" />
                      Deposit Invoice PDF
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGenerateCurrentInvoice(false)}
                      className="px-4 py-2 rounded-xl font-bold text-xs text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 flex items-center gap-1.5 shadow-2xs transition-all"
                      title="Download Complete Final Invoice PDF"
                    >
                      <Icon name="DocumentCheckIcon" size={15} className="text-blue-600" />
                      Final Invoice PDF
                    </button>
                  </>
                )}

                {downloadMenuPDF && (
                  <button
                    type="button"
                    onClick={handleGenerateCurrentMenuPDF}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-1.5 shadow-2xs transition-all"
                    title="Download Chef Kitchen Sheet"
                  >
                    <Icon name="DocumentTextIcon" size={15} className="text-red-600" />
                    Chef Kitchen Sheet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
