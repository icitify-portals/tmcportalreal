// Comprehensive list of all countries with phone prefixes
export interface Country {
  name: string
  code: string
  phonePrefix: string
  flag?: string
}

export const countries: Country[] = [
  { name: "Nigeria", code: "NG", phonePrefix: "+234" },
  { name: "Afghanistan", code: "AF", phonePrefix: "+93" },
  { name: "Albania", code: "AL", phonePrefix: "+355" },
  { name: "Algeria", code: "DZ", phonePrefix: "+213" },
  { name: "Argentina", code: "AR", phonePrefix: "+54" },
  { name: "Australia", code: "AU", phonePrefix: "+61" },
  { name: "Austria", code: "AT", phonePrefix: "+43" },
  { name: "Bangladesh", code: "BD", phonePrefix: "+880" },
  { name: "Belgium", code: "BE", phonePrefix: "+32" },
  { name: "Brazil", code: "BR", phonePrefix: "+55" },
  { name: "Canada", code: "CA", phonePrefix: "+1" },
  { name: "China", code: "CN", phonePrefix: "+86" },
  { name: "Egypt", code: "EG", phonePrefix: "+20" },
  { name: "France", code: "FR", phonePrefix: "+33" },
  { name: "Germany", code: "DE", phonePrefix: "+49" },
  { name: "Ghana", code: "GH", phonePrefix: "+233" },
  { name: "India", code: "IN", phonePrefix: "+91" },
  { name: "Indonesia", code: "ID", phonePrefix: "+62" },
  { name: "Iran", code: "IR", phonePrefix: "+98" },
  { name: "Iraq", code: "IQ", phonePrefix: "+964" },
  { name: "Italy", code: "IT", phonePrefix: "+39" },
  { name: "Japan", code: "JP", phonePrefix: "+81" },
  { name: "Kenya", code: "KE", phonePrefix: "+254" },
  { name: "Malaysia", code: "MY", phonePrefix: "+60" },
  { name: "Mexico", code: "MX", phonePrefix: "+52" },
  { name: "Netherlands", code: "NL", phonePrefix: "+31" },
  { name: "Pakistan", code: "PK", phonePrefix: "+92" },
  { name: "Philippines", code: "PH", phonePrefix: "+63" },
  { name: "Poland", code: "PL", phonePrefix: "+48" },
  { name: "Russia", code: "RU", phonePrefix: "+7" },
  { name: "Saudi Arabia", code: "SA", phonePrefix: "+966" },
  { name: "South Africa", code: "ZA", phonePrefix: "+27" },
  { name: "South Korea", code: "KR", phonePrefix: "+82" },
  { name: "Spain", code: "ES", phonePrefix: "+34" },
  { name: "Sudan", code: "SD", phonePrefix: "+249" },
  { name: "Tanzania", code: "TZ", phonePrefix: "+255" },
  { name: "Thailand", code: "TH", phonePrefix: "+66" },
  { name: "Turkey", code: "TR", phonePrefix: "+90" },
  { name: "Uganda", code: "UG", phonePrefix: "+256" },
  { name: "Ukraine", code: "UA", phonePrefix: "+380" },
  { name: "United Kingdom", code: "GB", phonePrefix: "+44" },
  { name: "United States", code: "US", phonePrefix: "+1" },
  { name: "Vietnam", code: "VN", phonePrefix: "+84" },
  { name: "Yemen", code: "YE", phonePrefix: "+967" },
  // Add more countries as needed - this is a sample list
  // For production, you might want to use a comprehensive library
]

// Get country by code
export function getCountryByCode(code: string): Country | undefined {
  return countries.find((c) => c.code === code)
}

// Get country by phone prefix
export function getCountryByPhonePrefix(prefix: string): Country | undefined {
  return countries.find((c) => c.phonePrefix === prefix)
}

// Get default country (Nigeria)
export function getDefaultCountry(): Country {
  return countries.find((c) => c.code === "NG") || countries[0]
}


