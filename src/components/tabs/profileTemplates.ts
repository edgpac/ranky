export type TemplateKey =
  | 'contractor'
  | 'restaurant'
  | 'store'
  | 'salon'
  | 'hotel'
  | 'doctor'
  | 'real_estate';

export interface AttributeField {
  id: string;
  label: string;
}

export interface ExtraField {
  id: string;
  label: string;
  type: 'url' | 'time';
  placeholder?: string;
}

export interface ProfileTemplate {
  key: TemplateKey;
  hoursLabel: string;
  showAddress: boolean;      // true = physical storefront address
  showServiceArea: boolean;  // true = SAB service area
  moreHoursToShow: string[]; // GBP hoursTypeId values to display (restaurant etc.)
  attributes: AttributeField[];
  extraFields: ExtraField[];
}

export const PROFILE_TEMPLATES: Record<TemplateKey, ProfileTemplate> = {
  contractor: {
    key: 'contractor',
    hoursLabel: 'Business Hours',
    showAddress: false,
    showServiceArea: true,
    moreHoursToShow: [],
    attributes: [],
    extraFields: [],
  },

  restaurant: {
    key: 'restaurant',
    hoursLabel: 'Dining Hours',
    showAddress: true,
    showServiceArea: false,
    moreHoursToShow: ['DELIVERY', 'TAKEOUT', 'KITCHEN', 'HAPPY_HOURS', 'BRUNCH', 'DRIVE_THROUGH'],
    attributes: [
      { id: 'dineIn',          label: 'Dine-in' },
      { id: 'takeout',         label: 'Takeout' },
      { id: 'delivery',        label: 'Delivery' },
      { id: 'outdoorSeating',  label: 'Outdoor seating' },
      { id: 'reservations',    label: 'Reservations' },
      { id: 'driveThrough',    label: 'Drive-through' },
    ],
    extraFields: [
      { id: 'menuUrl',  label: 'Menu URL',        type: 'url', placeholder: 'https://yourmenu.com' },
      { id: 'orderUrl', label: 'Online Order URL', type: 'url', placeholder: 'https://order.yourbusiness.com' },
    ],
  },

  store: {
    key: 'store',
    hoursLabel: 'Store Hours',
    showAddress: true,
    showServiceArea: false,
    moreHoursToShow: ['DELIVERY', 'PICKUP'],
    attributes: [
      { id: 'inStoreShopping', label: 'In-store shopping' },
      { id: 'inStorePickup',   label: 'In-store pickup' },
      { id: 'curbsidePickup',  label: 'Curbside pickup' },
      { id: 'delivery',        label: 'Delivery' },
    ],
    extraFields: [],
  },

  salon: {
    key: 'salon',
    hoursLabel: 'Salon Hours',
    showAddress: true,
    showServiceArea: false,
    moreHoursToShow: [],
    attributes: [
      { id: 'walkIns',             label: 'Accepts walk-ins' },
      { id: 'onlineAppointments',  label: 'Online appointments' },
    ],
    extraFields: [
      { id: 'appointmentUrl', label: 'Booking URL', type: 'url', placeholder: 'https://book.yoursite.com' },
    ],
  },

  hotel: {
    key: 'hotel',
    hoursLabel: 'Front Desk Hours',
    showAddress: true,
    showServiceArea: false,
    moreHoursToShow: [],
    attributes: [
      { id: 'pool',        label: 'Pool' },
      { id: 'fitnessCenter', label: 'Fitness center' },
      { id: 'freeWifi',    label: 'Free Wi-Fi' },
      { id: 'breakfast',   label: 'Breakfast included' },
      { id: 'petFriendly', label: 'Pet friendly' },
      { id: 'parking',     label: 'Parking' },
    ],
    extraFields: [
      { id: 'checkIn',  label: 'Check-in time',  type: 'time' },
      { id: 'checkOut', label: 'Check-out time', type: 'time' },
    ],
  },

  doctor: {
    key: 'doctor',
    hoursLabel: 'Office Hours',
    showAddress: true,
    showServiceArea: false,
    moreHoursToShow: ['ONLINE_SERVICE'],
    attributes: [
      { id: 'inPersonAppointments', label: 'In-person appointments' },
      { id: 'telehealth',           label: 'Online / Telehealth' },
      { id: 'acceptingPatients',    label: 'Accepting new patients' },
    ],
    extraFields: [
      { id: 'appointmentUrl', label: 'Booking URL', type: 'url', placeholder: 'https://book.yourpractice.com' },
    ],
  },

  real_estate: {
    key: 'real_estate',
    hoursLabel: 'Office Hours',
    showAddress: false,
    showServiceArea: true,
    moreHoursToShow: [],
    attributes: [],
    extraFields: [],
  },
};

// Keywords that map GBP category display names or free-text → template keys.
// Evaluated top-to-bottom; first match wins.
const KEYWORD_MAP: Array<[string[], TemplateKey]> = [
  [['restaurant', 'cafe', 'cafeteria', 'bar', 'pub', 'pizza', 'sushi', 'bakery', 'food truck', 'catering', 'dining', 'brewery', 'diner', 'bistro', 'buffet', 'noodle', 'taco', 'burger', 'seafood', 'steakhouse', 'ice cream', 'gelato', 'bbq', 'barbecue', 'grill', 'sandwich', 'breakfast', 'brunch', 'juice bar', 'smoothie', 'coffee', 'dessert', 'pastry', 'donut', 'churro', 'food', 'kitchen'], 'restaurant'],
  [['hotel', 'motel', 'hostel', 'inn', 'lodge', 'resort', 'bed and breakfast', 'b&b', 'vacation rental', 'airbnb'], 'hotel'],
  [['salon', 'spa', 'barber', 'barbershop', 'beauty', 'nail', 'wax', 'waxing', 'hair', 'massage', 'tattoo', 'estheti', 'grooming', 'skincare', 'lash', 'eyebrow', 'brow', 'manicure', 'pedicure', 'facial', 'threading', 'permanent makeup', 'microblading'], 'salon'],
  [['doctor', 'dentist', 'dental', 'clinic', 'medical', 'health', 'physician', 'dermatologist', 'chiropractor', 'optometrist', 'pharmacy', 'therapist', 'pediatrician', 'orthodontist', 'hospital', 'urgent care', 'counseling', 'psychiatr', 'psycholog', 'physical therapy', 'occupational therapy', 'speech therapy', 'nutritionist', 'dietitian', 'acupuncture', 'vision'], 'doctor'],
  [['real estate', 'realtor', 'property management', 'broker', 'leasing', 'appraisal', 'mortgage', 'realty', 'land developer', 'title company'], 'real_estate'],
  [['store', 'shop', 'boutique', 'market', 'grocery', 'hardware', 'furniture', 'bookstore', 'pet store', 'retail', 'supermarket', 'department store', 'thrift', 'consignment', 'antique', 'gift shop', 'toy store', 'sporting goods', 'electronics store', 'auto parts', 'vape', 'dispensary', 'nursery', 'garden center'], 'store'],
  // contractor is last and also the default — covers all service-area businesses
  [['contractor', 'handyman', 'electrician', 'plumber', 'hvac', 'painter', 'roofer', 'landscaper', 'cleaner', 'cleaning', 'locksmith', 'pest control', 'remodel', 'carpenter', 'mason', 'window', 'flooring', 'tiling', 'drywall', 'insulation', 'fencing', 'irrigation', 'pool service', 'solar', 'generator', 'garage door', 'appliance repair', 'dog walker', 'dog walking', 'pet sit', 'dog sit', 'dog trainer', 'pet trainer', 'animal', 'towing', 'auto repair', 'mechanic', 'moving', 'junk removal', 'hauling', 'delivery', 'courier', 'tutoring', 'coaching', 'instructor', 'music lesson', 'photography', 'videography', 'mobile', 'event planner', 'wedding', 'dj', 'caricature', 'entertainer', 'cleaning service', 'janitorial', 'pressure wash', 'window wash'], 'contractor'],
];

/** Normalize any GBP category name or stored business_type → ProfileTemplate */
export function resolveTemplate(businessType: string): ProfileTemplate {
  if (!businessType) return PROFILE_TEMPLATES.contractor;
  const lower = businessType.toLowerCase();
  for (const [keywords, key] of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return PROFILE_TEMPLATES[key];
    }
  }
  return PROFILE_TEMPLATES.contractor;
}
