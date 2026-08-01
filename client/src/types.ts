export type Role = 'RIDER' | 'DRIVER';
export type RideModel = 'FIXED' | 'BID';
export type RideStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'ARRIVING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Vehicle {
  model: string;
  plate: string;
  color: string;
}

export interface DriverProfile {
  id: string;
  vehicleModel: string;
  plate: string;
  color: string;
  seats: number;
  isOnline: boolean;
  lat: number | null;
  lng: number | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  avatar: string | null;
  ratingAvg: number;
  ratingCount: number;
  driver: DriverProfile | null;
  wallet: { balance: number } | null;
}

export interface Point {
  lat: number;
  lng: number;
  label: string;
}

export interface PartyRef {
  id: string;
  name: string;
  ratingAvg: number;
  vehicle?: Vehicle;
}

export interface Bid {
  id: string;
  rideId: string;
  driverId: string;
  amount: number;
  note: string | null;
  status: 'OPEN' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  driver?: PartyRef;
}

export interface Ride {
  id: string;
  riderId: string;
  driverId: string | null;
  rider?: PartyRef;
  driver?: PartyRef;
  pickup: Point;
  drop: Point;
  model: RideModel;
  fixedFare: number | null;
  offerFare: number | null;
  agreedFare: number | null;
  distanceKm: number;
  durationMin: number;
  status: RideStatus;
  createdAt: string;
  matchedAt: string | null;
  completedAt: string | null;
  bids?: Bid[];
  ratings?: { byUserId: string; toUserId: string; stars: number; comment: string | null }[];
  driverDistanceKm?: number;
}

export interface Estimate {
  distanceKm: number;
  durationMin: number;
  fixedFare: number;
  suggestedBid: { low: number; recommended: number; high: number };
}

export interface Transaction {
  id: string;
  amount: number;
  kind: 'TOPUP' | 'RIDE_PAYMENT' | 'RIDE_EARNING';
  note: string | null;
  rideId: string | null;
  createdAt: string;
}
