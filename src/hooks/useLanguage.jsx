
import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    marketplace: {
      hero: {
        title: 'Discover Amazing Products',
        subtitle: 'Connect with local vendors and find unique products at the best prices',
        shopNow: 'Shop Now',
        becomeVendor: 'Become a Vendor'
      },
      stats: {
        products: 'Products',
        vendors: 'Vendors'
      },
      sections: {
        popularVendors: 'Popular Vendors',
        verifiedVendors: 'Trusted and verified businesses',
        featuredProducts: 'Featured Products',
        latestProducts: 'Latest additions to our marketplace',
         featured_products: 'Featured Products',
        popular_products: 'Popular Products',
        latest_products: 'Check out our latest products'
      },
      actions: {
        viewAllProducts: 'View All Products'
      },
      cta: {
        title: 'Ready to Start Your Journey?',
        subtitle: 'Join thousands of customers and vendors in our growing marketplace',
        getStarted: 'Get Started',
        sellWithUs: 'Sell With Us'
      },
      features: {
        quality_description: 'Carefully curated products from trusted campus vendors',
        secure_description: 'Safe and secure transactions with verified vendors',
        delivery_description: 'Fast delivery within the university campus',
        community_description: 'Supporting local student entrepreneurs and vendors'
      }
    },
    common: {
      whatsapp_order: 'WhatsApp Order',
      show_stats: 'Show Statistics',
    hide_stats: 'Hide Statistics',
    show_features: 'Show Features', 
    hide_features: 'Hide Features',
      login: 'Login',
      register: 'Register',
      cart: 'Cart',
      search: 'Search products...',
      language: 'Language',
      currency: 'TSh',
      add_to_cart: 'Add to Cart',
      buy_now: 'Buy Now',
      price: 'Price',
      quantity: 'Quantity',
      total: 'Total',
      checkout: 'Checkout',
      phone: 'Phone Number',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      business_name: 'Business Name',
      category: 'Category',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      admin: 'Admin',
      vendor: 'Vendor',
      customer: 'Customer',
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      messages: 'Messages',
      inbox: 'Inbox',
      send_message: 'Send Message',
      verify: 'Verify',
      verified: 'Verified',
      pending: 'Pending',
      status: 'Status',
      // New translations
      back_to_home: 'Back to Home',
      customer_information: 'Customer Information',
      delivery_address: 'Delivery Address / street',
      additional_details: 'Additional Details (Optional)',
      order_summary: 'Order Summary',
      email_order: 'Email Order',
      processing: 'Processing...',
      enter_your_full_address: 'Enter your full address for delivery',
      special_instructions: 'Any special instructions or additional information...',
      your_cart_is_empty: 'Your cart is empty',
      continue_shopping: 'Continue Shopping',
      campus_marketplace: 'Campus Marketplace',
      community: 'Community',
      disclaimer: 'Disclaimer',
      search: "Search",
      image_use_notice: 'Image Use Notice',
      purpose_of_website: 'Purpose of the Website',
      contact_information: 'Contact Information',
      thank_you_understanding: 'Thank you for understanding',
      quality_products: 'Quality Products',
      secure_shopping: 'Secure Shopping',
      campus_delivery: 'Campus Delivery',
      community_focus: 'Community Focus',
      happy_customers: 'Happy Customers',
      campus_coverage: 'Campus Coverage',
      why_choose_marketplace: 'Why Choose Our Marketplace?',
      built_for_campus: 'Built for the Campus Community',
      experience_convenience: 'Experience the convenience of shopping from verified campus vendors with secure transactions and fast delivery',
      join_thousands: 'Join thousands of satisfied campus community members',
      no_products_found: 'No products found',
      try_adjusting_search: 'Try adjusting your search terms',
      load_more_products: 'Load More Products',
      sort_by: 'Sort by',
      newest: 'Newest',
      price_low_high: 'Price: Low to High',
      price_high_low: 'Price: High to Low',
      highest_rated: 'Highest Rated',
      filters: 'Filters',
      search_products: 'Search products...',
      discover_amazing_products: 'Discover amazing products from verified vendors',
      full_name: 'Full Name',
      enter_your_full_name: 'Enter your full name',
      enter_your_email: 'Enter your email',
      enter_your_password: 'Enter your password',
      confirm_password: 'Confirm Password',
      confirm_your_password: 'Confirm your password',
      creating_account: 'Creating account...',
      already_have_account: 'Already have an account?',
      want_to_sell: 'Want to sell products?',
      become_a_vendor: 'Become a Vendor',
      welcome_back: 'Welcome back! Please sign in to your account',
      signing_in: 'Signing in...',
      dont_have_account: 'Don\'t have an account?',
      vendor_registration: 'Vendor Registration',
      admin_access: 'Admin Access',
      create_customer_account: 'Create your customer account to get started',
      no_featured_products: 'No Featured Products Yet',
      products_will_appear: 'Products will appear here once vendors start adding them',
      read_more: 'Read more',
      read_less: 'Read less',
      assistant: "Assistant",
    typeMessage: "Type your message...",
    trainBot: "Train Bot",
    exitTraining: "Exit Training"
    },
     login: {
    forgot_password: 'Forgot password?',
    remember_me: 'remember me'
  },
   navigation: {
      back: 'Back',
      about: 'About',
      products:'products'
    },
   vendor: {
      verified: 'Verified Seller',
      pending: 'Pending Verification',
      active: 'Active',
      inactive: 'Inactive',
      joined: 'Joined',
      noDescription: 'No description provided',
      about: 'About',
      availableProducts: 'Available Products',
      noProducts: 'No products available yet',
      businessDescription: 'Business Description',
      businessHistory: 'Business History',
      certifications: 'Certifications',
      noHistory: 'No history information provided',
      noCertifications: 'No certifications',
       noVerifiedVendors: 'No verified vendors available',
    verified: 'Verified',
    pending: 'Pending',
    active: 'Active',
    inactive: 'Inactive'
    },
    categories: {
      all: 'All Categories',
      electronics: 'Electronics',
      clothing: 'Clothing',
      home: 'Home',
      sports: 'Sports',
      books: 'Books',
      beauty: 'Beauty',
      toys: 'Toys & Games',
      food: 'Food & Beverages',
      health: 'Health',
      tools: 'Tools',
      other: 'Other'
    },
  forgot_password: {
    title: 'Reset your password',
    email_label: 'Email address',
    email_placeholder: 'Enter your email',
    submit: 'Send reset link',
    sending: 'Sending...',
    success_message: 'Password reset email sent! Check your inbox.',
    error_message: 'Failed to send reset email. Please try again.',
    instructions: 'We will send you a link to reset your password.',
    success_message: 'Password reset email sent!',
    check_spam_note: 'If you do not see it in your inbox, please check your spam folder.',
    spam_reminder_title: 'Can’t find the email?',
spam_reminder_text: 'If you don’t see our password reset email in your inbox, please check your spam or junk folder.',
success_message: 'We’ve sent a password reset email!',
check_spam_note: 'If it’s not in your inbox, be sure to check your spam folder.',

  }
  },
  sw: {
    marketplace: {
      hero: {
        title: 'Gundua Bidhaa za Kipekee',
        subtitle: 'Unganishwa na wachuuzi wa mitaani na upate bidhaa za kipekee kwa bei nzuri',
        shopNow: 'Nunua Sasa',
        becomeVendor: 'Kuwa Mchuuzi'
      },
      stats: {
        products: 'Bidhaa',
        vendors: 'Wachuuzi'
      },
      sections: {
        popularVendors: 'Wachuuzi Maarufu',
        verifiedVendors: 'Biashara zilizothibitishwa na kuaminika',
        featuredProducts: 'Bidhaa Maalum',
        latestProducts: 'Bidhaa mpya kwenye soko letu'
      },
      actions: {
        viewAllProducts: 'Ona Bidhaa Zote'
      },
      cta: {
        title: 'Uko Tayari Kuanza Safari Yako?',
        subtitle: 'Jiunge na maelfu ya wateja na wachuuzi katika soko letu linaloongezeka',
        getStarted: 'Anza',
        sellWithUs: 'Uza Pamoja Nasi'
      },
      features: {
        quality_description: 'Bidhaa zilizochaguliwa kwa makini kutoka kwa wachuuzi wa chuo kikuu wanaoaminika',
        secure_description: 'Miamala salama na iliyolindwa na wachuuzi waliodhibitishwa',
        delivery_description: 'Uwasilishaji wa haraka ndani ya chuo kikuu',
        community_description: 'Kuunga mkono wajasiriamali wa ndani na wachuuzi wa wanafunzi'
      }
    },
    common: {
      whatsapp_order: 'WhatsApp Order',
      show_stats: 'Onyesha Takwimu',
hide_stats: 'Ficha Takwimu',
show_features: 'Onyesha Vipengele',
hide_features: 'Ficha Vipengele',
      login: 'Ingia',
      register: 'Jisajili',
      cart: 'Mkoba',
      search: 'Tafuta bidhaa...',
      language: 'Lugha',
      currency: 'TSh',
      add_to_cart: 'Weka Mkobani',
      buy_now: 'Nunua Sasa',
      price: 'Bei',
      quantity: 'Idadi',
      total: 'Jumla',
      checkout: 'Maliza Ununuzi',
      phone: 'Nambari ya Simu',
      email: 'Barua Pepe',
      password: 'Nenosiri',
      name: 'Jina',
      business_name: 'Jina la Biashara',
      category: 'Aina',
      submit: 'Wasilisha',
      cancel: 'Ghairi',
      save: 'Hifadhi',
      delete: 'Futa',
      edit: 'Hariri',
      view: 'Ona',
      admin: 'Msimamizi',
      vendor: 'Mchuuzi',
      customer: 'Mteja',
      dashboard: 'Dashibodi',
      products: 'Bidhaa',
      orders: 'Maagizo',
      messages: 'Ujumbe',
      inbox: 'Sanduku la Ujumbe',
      send_message: 'Tuma Ujumbe',
      verify: 'Thibitisha',
      verified: 'Imethibitishwa',
      pending: 'Inasubiri',
      status: 'Hali',
      // New Swahili translations
      back_to_home: 'Rudi Nyumbani',
      customer_information: 'Taarifa za Mteja',
      delivery_address: 'Anwani ya Uwasilishaji / Mtaa',
      additional_details: 'Maelezo ya Ziada (Si Lazima)',
      order_summary: 'Muhtasari wa Agizo',
      email_order: 'Tuma Agizo kwa Barua Pepe',
      processing: 'Inachakatwa...',
      enter_your_full_address: 'Ingiza anwani yako kamili kwa uwasilishaji',
      special_instructions: 'Maelekezo maalum au taarifa za ziada...',
      your_cart_is_empty: 'Mkoba wako hauna kitu',
      continue_shopping: 'Endelea Kununua',
      campus_marketplace: 'Soko la Chuo Kikuu',
      community: 'Jamii',
      disclaimer: 'Kanusho',
      image_use_notice: 'Ilani ya Matumizi ya Picha',
      purpose_of_website: 'Madhumuni ya Tovuti',
      contact_information: 'Taarifa za Mawasiliano',
      thank_you_understanding: 'Asante kwa kuelewa',
      quality_products: 'Bidhaa za Ubora',
      secure_shopping: 'Ununuzi Salama',
      campus_delivery: 'Uwasilishaji wa Chuo Kikuu',
      community_focus: 'Kulenga Jamii',
      happy_customers: 'Wateja Wenye Furaha',
      campus_coverage: 'Kufunika Chuo Kikuu',
      why_choose_marketplace: 'Kwa Nini Uchague Soko Letu?',
      built_for_campus: 'Imeundwa kwa Jamii ya Chuo Kikuu',
      experience_convenience: 'Furahia urahisi wa kununua kutoka kwa wachuuzi wa chuo kikuu waliodhibitishwa na miamala salama na uwasilishaji wa haraka',
      join_thousands: 'Jiunge na maelfu ya wanajamii wa chuo kikuu wenye kuridhika',
      no_products_found: 'Hakuna bidhaa zilizopatikana',
      try_adjusting_search: 'Jaribu kubadilisha maneno ya utafutaji',
      load_more_products: 'Pakia Bidhaa Zaidi',
      sort_by: 'Panga kwa',
      newest: 'Mpya zaidi',
      price_low_high: 'Bei: Chini hadi Juu',
      price_high_low: 'Bei: Juu hadi Chini',
      highest_rated: 'Zilizo na Ukadiriaji wa Juu',
      filters: 'Vichujio',
      search_products: 'Tafuta bidhaa...',
      discover_amazing_products: 'Gundua bidhaa za Kipekee kutoka kwa wachuuzi waliodhibitishwa',
      full_name: 'Jina Kamili',
      enter_your_full_name: 'Ingiza jina lako kamili',
      enter_your_email: 'Ingiza barua pepe yako',
      enter_your_password: 'Ingiza nenosiri lako',
      confirm_password: 'Thibitisha Nenosiri',
      confirm_your_password: 'Thibitisha nenosiri lako',
      creating_account: 'Inaunda akaunti...',
      already_have_account: 'Tayari una akaunti?',
      want_to_sell: 'Unataka kuuza bidhaa?',
      become_a_vendor: 'Kuwa Mchuuzi',
      welcome_back: 'Karibu tena! Tafadhali ingia kwenye akaunti yako',
      signing_in: 'Inaingia...',
      dont_have_account: 'Huna akaunti?',
      vendor_registration: 'Usajili wa Mchuuzi',
      admin_access: 'Ufikiaji wa Msimamizi',
      create_customer_account: 'Unda akaunti yako ya mteja ili uanze',
      no_featured_products: 'Hakuna Bidhaa Maalum Bado',
      products_will_appear: 'Bidhaa zitaonekana hapa wachuuzi watakapoanzia kuziongeza',
      read_more: 'Soma zaidi',
      read_less: 'Soma kidogo',
      search: "Tafuta",
  assistant: "Msaidizi",
  typeMessage: "Andika ujumbe wako...",
  trainBot: "Fundisha Bot",
  exitTraining: "Toka Mafunzo"


    },
    login: {
  forgot_password: 'Umesahau nywila?',
  remember_me: 'nikumbuke'
},
 navigation: {
      back: 'Rudi',
      about: 'kuhusu',
      products:'bidhaa'
    },
 vendor: {
      verified: 'Muuzaji Aliyethibitishwa',
      pending: 'Inasubiri Uthibitisho',
      active: 'Inatumika',
      inactive: 'Haifanyi kazi',
      joined: 'Alijiunga',
      noDescription: 'Hakuna maelezo yaliyotolewa',
      about: 'Kuhusu',
      availableProducts: 'Bidhaa Zilizopo',
      noProducts: 'Hakuna bidhaa zilizopo bado',
      businessDescription: 'Maelezo ya Biashara',
      businessHistory: 'Historia ya Biashara',
      certifications: 'Vyetifikati',
      noHistory: 'Hakuna taarifa za historia zilizotolewa',
      noCertifications: 'Hakuna vyetifikati',
      noVerifiedVendors: 'Hakuna wauzaji waliothibitishwa waliopo',
verified: 'Imethibitishwa',
pending: 'Inasubiri',
active: 'Hai',
inactive: 'Haifanyi kazi'

    },
    categories: {
      all: 'Kategoria Zote',
      electronics: 'Elektroniki',
      clothing: 'Mavazi',
      home: 'Nyumba',
      sports: 'Michezo',
      books: 'Vitabu',
      beauty: 'Urembo',
      toys: 'Vichezo',
      food: 'Chakula & Vinywaji',
      health: 'Afya',
      tools: 'Vifaa',
      other: 'Nyingine'
    },
forgot_password: {
  title: 'Weka upya nywila yako',
  email_label: 'Anuani ya barua pepe',
  email_placeholder: 'Weka barua pepe yako',
  submit: 'Tuma kiungo cha kuweka upya',
  sending: 'Inatuma...',
  success_message: 'Barua pepe ya kuweka upya nywila imetumwa! Angalia kikasha chako.',
  error_message: 'Imeshindwa kutuma barua pepe ya kuweka upya. Tafadhali jaribu tena.',
  instructions: 'Tutakutumia kiungo cha kuweka upya nywila yako.',
  success_message: 'Barua pepe ya kuweka upya nenosiri imetumwa!',
check_spam_note: 'Kama huioni kwenye kikasha chako cha barua pepe, tafadhali angalia folda ya barua taka (spam).',
spam_reminder_title: 'Huwezi kuona barua pepe?',
spam_reminder_text: 'Tafadhali angalia folda ya barua taka au taka taka ikiwa hujaona barua pepe yetu ya kuweka upya nenosiri kwenye kikasha chako.',
success_message: 'Barua pepe ya kuweka upya nenosiri imetumwa!',
check_spam_note: 'Tafadhali angalia folda ya barua taka ikiwa huioni kwenye kikasha chako.',

}

  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('marketplace_language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setCurrentLanguage(lang);
      localStorage.setItem('marketplace_language', lang);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      changeLanguage, 
      t,
      translations: translations[currentLanguage]
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
