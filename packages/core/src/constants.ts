import type { AutofillFieldType, RegexPatternEntry } from './types';

/** HTML5 autocomplete attribute → field type mapping. */
export const AUTOCOMPLETE_MAP: Record<string, AutofillFieldType> = {
  'given-name': 'firstName',
  'first-name': 'firstName',
  'family-name': 'lastName',
  'last-name': 'lastName',
  'honorific-prefix': 'honorific',
  name: 'firstName', // single name field fallback
  'cc-number': 'ccNumber',
  'cc-name': 'ccName',
  'cc-exp': 'ccExpiry',
  'cc-exp-month': 'ccExpiryMonth',
  'cc-exp-year': 'ccExpiryYear',
  'cc-csc': 'ccCCV',
  'cc-type': 'ccType',
  email: 'email',
  tel: 'phoneNumber',
  'tel-national': 'phoneNumber',
  'tel-country-code': 'phoneCountryCode',
  'address-line1': 'postalAddressLine1',
  'address-line2': 'postalAddressLine2',
  'address-level2': 'postalSuburb',
  'address-level1': 'postalState',
  'postal-code': 'postalPostCode',
  country: 'postalCountry',
  'country-name': 'postalCountry',
  'street-address': 'postalAddressLine1',
};

/** Heuristic regex patterns for field classification (order matters — more specific first). */
export const REGEX_PATTERNS: RegexPatternEntry[] = [
  // Credit card
  { pattern: /card.?num|cc.?num|cc-?number|\bpan\b/i, field: 'ccNumber' },
  { pattern: /card.?name|name.?on.?card|cc.?name|cardholder/i, field: 'ccName' },
  { pattern: /cvv|cvc|ccv|security.?code|card.?code|card.?verif|cvd|csv/i, field: 'ccCCV' },
  { pattern: /exp.*month|cc.?month|card.?month/i, field: 'ccExpiryMonth' },
  { pattern: /exp.*year|cc.?year|card.?year/i, field: 'ccExpiryYear' },
  { pattern: /expir.*dat|exp.?dat|cc.?exp(?!.*(?:month|year))/i, field: 'ccExpiry' },
  { pattern: /card.?type|cc.?type|payment.?method/i, field: 'ccType' },

  // Personal
  { pattern: /first.?name|given.?name|\bfname\b|Name_First|Name\.first/i, field: 'firstName' },
  {
    pattern: /last.?name|family.?name|surname|\blname\b|Name_Last|Name\.last/i,
    field: 'lastName',
  },
  {
    pattern: /middle.?name|Name_Middle|Name\.middle|\bmname\b|middle.?initial/i,
    field: 'middleName',
  },
  { pattern: /honorific|Name_Prefix|name.?prefix|salutation/i, field: 'honorific' },
  { pattern: /name.?suffix|Name_Suffix|\bsuffix\b/i, field: 'nameSuffix' },
  { pattern: /full.?name|your.?name|customer.?name|\bname\b/i, field: 'fullName' },

  // Contact
  { pattern: /e.?mail/i, field: 'email' },
  { pattern: /phone.?country|phone.?code|dial.?code|tel.?code/i, field: 'phoneCountryCode' },
  { pattern: /phone|mobile|\btel\b|telephone|Telecom.?Phone/i, field: 'phoneNumber' },

  // Address (more specific first)
  {
    pattern:
      /street.?line.?2|address.?2|address.?line.?2|\bapt\b|\bsuite\b|\bunit\b|\baddr2\b/i,
    field: 'postalAddressLine2',
  },
  {
    pattern: /street.?line.?1|address.?1|address.?line.?1|street.?addr|\baddr1\b/i,
    field: 'postalAddressLine1',
  },
  { pattern: /street.?line|street.?addr|\baddress\b/i, field: 'postalAddressLine1' },
  { pattern: /street.?num/i, field: 'postalStreetNumber' },
  { pattern: /street.?name/i, field: 'postalStreetName' },
  { pattern: /street.?type/i, field: 'postalStreetType' },
  { pattern: /city|suburb|\btown\b|locality|Postal_City/i, field: 'postalSuburb' },
  { pattern: /\bstate\b|province|\bregion\b|StateProv/i, field: 'postalState' },
  {
    pattern: /\bzip\b|postal.?code|postcode|\bpost.?code\b|PostalCode/i,
    field: 'postalPostCode',
  },
  { pattern: /country.?code|country.?name|\bcountry\b/i, field: 'postalCountry' },
];

/** Input type attribute → field type fallback. */
export const TYPE_MAP: Record<string, AutofillFieldType> = {
  email: 'email',
  tel: 'phoneNumber',
};
