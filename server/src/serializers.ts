// Shape DB records into safe client-facing objects (never leak passwordHash).

export function publicUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    role: user.role,
    avatar: user.avatar ?? null,
    ratingAvg: user.ratingAvg,
    ratingCount: user.ratingCount,
    driver: user.driver
      ? {
          id: user.driver.id,
          vehicleModel: user.driver.vehicleModel,
          plate: user.driver.plate,
          color: user.driver.color,
          seats: user.driver.seats,
          isOnline: user.driver.isOnline,
          lat: user.driver.lat,
          lng: user.driver.lng,
        }
      : null,
    wallet: user.wallet ? { balance: user.wallet.balance } : null,
  };
}

export function publicRide(ride: any) {
  return {
    id: ride.id,
    riderId: ride.riderId,
    driverId: ride.driverId ?? null,
    rider: ride.rider
      ? { id: ride.rider.id, name: ride.rider.name, ratingAvg: ride.rider.ratingAvg }
      : undefined,
    driver: ride.driver
      ? {
          id: ride.driver.id,
          name: ride.driver.name,
          ratingAvg: ride.driver.ratingAvg,
          vehicle: ride.driver.driver
            ? {
                model: ride.driver.driver.vehicleModel,
                plate: ride.driver.driver.plate,
                color: ride.driver.driver.color,
              }
            : undefined,
        }
      : undefined,
    pickup: { lat: ride.pickupLat, lng: ride.pickupLng, label: ride.pickupLabel },
    drop: { lat: ride.dropLat, lng: ride.dropLng, label: ride.dropLabel },
    model: ride.model,
    fixedFare: ride.fixedFare ?? null,
    offerFare: ride.offerFare ?? null,
    agreedFare: ride.agreedFare ?? null,
    distanceKm: ride.distanceKm,
    durationMin: ride.durationMin,
    status: ride.status,
    createdAt: ride.createdAt,
    matchedAt: ride.matchedAt ?? null,
    completedAt: ride.completedAt ?? null,
    bids: ride.bids?.map(publicBid),
    ratings: ride.ratings?.map((r: any) => ({
      byUserId: r.byUserId,
      toUserId: r.toUserId,
      stars: r.stars,
      comment: r.comment,
    })),
  };
}

export function publicBid(bid: any) {
  return {
    id: bid.id,
    rideId: bid.rideId,
    driverId: bid.driverId,
    amount: bid.amount,
    note: bid.note ?? null,
    status: bid.status,
    createdAt: bid.createdAt,
    driver: bid.driver
      ? {
          id: bid.driver.id,
          name: bid.driver.name,
          ratingAvg: bid.driver.ratingAvg,
          vehicle: bid.driver.driver
            ? {
                model: bid.driver.driver.vehicleModel,
                plate: bid.driver.driver.plate,
                color: bid.driver.driver.color,
              }
            : undefined,
        }
      : undefined,
  };
}
