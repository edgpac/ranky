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

// Keywords that map GBP category display names → template keys
const KEYWORD_MAP: Array<[string[], TemplateKey]> = [
  [['restaurant', 'cafe', 'cafeteria', 'bar', 'pub', 'pizza', 'sushi', 'bakery', 'food', 'dining', 'brewery', 'diner', 'bistro', 'buffet', 'noodle', 'taco', 'burger', 'seafood', 'steakhouse'], 'restaurant'],
  [['hotel', 'motel', 'hostel', 'inn', 'lodge', 'resort', 'bed and breakfast', 'b&b', 'vacation rental'], 'hotel'],
  [['salon', 'spa', 'barber', 'barbershop', 'beauty', 'nail', 'wax', 'hair', 'massage', 'tattoo', 'estheti'], 'salon'],
  [['doctor', 'dentist', 'dental', 'clinic', 'medical', 'health', 'physician', 'dermatologist', 'chiropractor', 'optometrist', 'pharmacy', 'therapist', 'pediatrician', 'orthodontist', 'hospital', 'urgent care'], 'doctor'],
  [['real estate', 'realtor', 'property management', 'broker', 'leasing', 'appraisal', 'mortgage', 'realty'], 'real_estate'],
  [['store', 'shop', 'boutique', 'market', 'grocery', 'hardware', 'furniture', 'bookstore', 'pet store', 'retail', 'supermarket', 'department store'], 'store'],
  [['contractor', 'handyman', 'electrician', 'plumber', 'hvac', 'painter', 'roofer', 'landscaper', 'cleaner', 'locksmith', 'pest control', 'remodel', 'carpenter', 'mason', 'window', 'flooring'], 'contractor'],
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
