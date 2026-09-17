export interface HeroTag {
  icon: string;
  text: string;
}

export interface HeroContent {
  badgeText: string;
  titleLine1: string;
  titleHighlight: string;
  subtitle: string;
  tags: HeroTag[];
  primaryBtnText: string;
  secondaryBtnText: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const DEFAULT_HERO_CONTENT: HeroContent = {
  badgeText: '100% PURE VEGETARIAN CATERING • PINNER & GREATER LONDON',
  titleLine1: 'Elevate Your Celebration With Authentic',
  titleHighlight: 'Sangeetha Events',
  subtitle: 'Experience the gold standard of authentic South Indian vegetarian hospitality. From sizzling live dosa stations to opulent royal banquet feasts, handcrafted with timeless recipes and world-renowned perfection.',
  tags: [
    { icon: '✨', text: 'Sizzling Live Dosa Party' },
    { icon: '👑', text: 'Curated Banquet Packages' },
    { icon: '⚡', text: '30 to 500+ Guest Capacity' }
  ],
  primaryBtnText: 'Explore Packages',
  secondaryBtnText: 'Instant Enquiry Form'
};

export const DEFAULT_FAQS: FaqItem[] = [
  {
    question: "Do you bring all the cooking equipment for live dosa catering?",
    answer: "Yes, we bring all the necessary cooking equipment, including the dosa tawa (griddle), gas burners, and cooking utensils. You do not need to provide any kitchen setup for cooking."
  },
  {
    question: "Do you provide plates, spoons, and napkins?",
    answer: "Yes, we provide standard disposable plates, spoons, and napkins as part of our package. For an upgraded premium experience, you can also opt for eco-friendly Palm Plates from our Extras list at £0.99 per person."
  },
  {
    question: "How are the charges calculated for dosa catering?",
    answer: "Charges are calculated on a per-person basis with a minimum guest requirement. Our weekday package (Monday to Friday) is £11.00 per person with a minimum of 35 guests. Our weekend and bank holiday package is £12.00 per person with a minimum of 40 guests."
  },
  {
    question: "Is there a transportation fee for catering services?",
    answer: "Yes, transportation charges may apply depending on the location of the event. Please share your event postcode when submitting your enquiry, and we will provide a precise transport quote."
  },
  {
    question: "How long do you serve food at an event?",
    answer: "Our standard live dosa counter service is for 2 hours. If you require food to be served for a longer duration, extra hours can be arranged in advance."
  },
  {
    question: "What do customers need to provide for the setup?",
    answer: "Customers must provide two serving tables (4ft x 4ft) and one power point."
  },
  {
    question: "What is the payment policy for booking live dosa catering?",
    answer: "We require a 30% deposit to secure your booking date. The remaining balance can be settled on or before the day of your event."
  },
  {
    question: "Can I customize the menu with additional items?",
    answer: "Absolutely! You can choose additional starters, mains, or desserts from our refined Extras list to customize the menu to your preference. These are charged on a per-person basis (unless stated otherwise)."
  },
  {
    question: "Do you provide tents or gazebos for outdoor catering?",
    answer: "Yes, we offer Gazebo Hire for a flat fee of £100.00 to protect the live counter setup from weather elements."
  },
  {
    question: "Do your dishes contain allergens such as nuts or sesame?",
    answer: "Some of our dishes may contain nuts, sesame, dairy, or other allergens. Please inform us of any severe food allergies or dietary restrictions when submitting your booking enquiry so we can prepare accordingly."
  }
];
