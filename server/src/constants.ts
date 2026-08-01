// Shared string-enum constants (SQLite has no native enums).

export const ROLE = { RIDER: 'RIDER', DRIVER: 'DRIVER' } as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

export const RIDE_MODEL = { FIXED: 'FIXED', BID: 'BID' } as const;
export type RideModel = (typeof RIDE_MODEL)[keyof typeof RIDE_MODEL];

export const RIDE_STATUS = {
  REQUESTED: 'REQUESTED',
  MATCHED: 'MATCHED',
  ARRIVING: 'ARRIVING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type RideStatus = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export const BID_STATUS = { OPEN: 'OPEN', ACCEPTED: 'ACCEPTED', REJECTED: 'REJECTED' } as const;

export const TXN_KIND = {
  TOPUP: 'TOPUP',
  RIDE_PAYMENT: 'RIDE_PAYMENT',
  RIDE_EARNING: 'RIDE_EARNING',
} as const;

// Pricing model (currency-agnostic units, shown as $).
export const PRICING = {
  BASE: 2.5,
  PER_KM: 1.1,
  PER_MIN: 0.25,
  MIN_FARE: 3.5,
  // rider bid suggestions expressed as a band around the fixed fare
  BID_LOW_FACTOR: 0.8,
  BID_HIGH_FACTOR: 1.15,
};

// Matching search radius in kilometers.
export const MATCH_RADIUS_KM = 8;
