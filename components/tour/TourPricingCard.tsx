import React, { useMemo, useState } from 'react';
import { Tour } from '../../lib/services/tourService';
import { Link } from 'react-router-dom';

interface TourPricingCardProps {
    tour: Tour;
    selectedDate: Date | null;
    selectedDepartureId: string | null;
    onSelectDate: (date: Date) => void;
    onSelectDeparture: (id: string) => void;
    guestCount: number;
    onGuestChange: (amount: number) => void;
    calendarOpen: boolean;
    setCalendarOpen: (open: boolean) => void;
    children?: React.ReactNode;
    availableDates: Date[];
    departureYears: number[];
    monthNames: string[];
    filterYear: number | 'all';
    setFilterYear: (year: number | 'all') => void;
    filterMonth: number | 'all';
    setFilterMonth: (month: number | 'all') => void;
    formattedSelectedDate: string;
}

const WhatsAppIcon = () => (
    <svg className="w-5 h-5 fill-current text-green-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.38 1.25 4.81L2 22l5.3-1.38c1.37.74 2.93 1.18 4.59 1.18h.12c5.45 0 9.9-4.45 9.9-9.91s-4.45-9.9-9.9-9.9zM17.1 15.3c-.28-.14-1.68-.83-1.94-.93-.26-.1-.45-.14-.64.14-.19.28-.73.93-.9 1.12-.17.19-.34.22-.63.07-.29-.15-1.21-.45-2.3-1.42-.85-.76-1.42-1.7-1.59-1.99-.17-.29-.02-.45.12-.59.13-.13.28-.34.42-.51.14-.17.19-.28.28-.47.1-.19.05-.36-.02-.51s-.64-1.53-.87-2.1c-.23-.56-.47-.48-.64-.48-.17 0-.36-.02-.55-.02s-.5.07-.76.36c-.26.28-.98 1-1.2 2.38-.22 1.38.28 2.76.5 2.95.22.2.98 1.58 2.38 2.2a7.6 7.6 0 002.66 1.05c.82.23 1.3.18 1.69.05.47-.16 1.35-.9 1.54-1.76.19-.86.19-1.6.14-1.76-.05-.17-.19-.26-.42-.4z"/>
    </svg>
);

const TourPricingCard: React.FC<TourPricingCardProps> = ({
    tour,
    selectedDate,
    selectedDepartureId,
    onSelectDate,
    onSelectDeparture,
    guestCount,
    onGuestChange,
    calendarOpen,
    setCalendarOpen,
    children, // Calendar component
    availableDates,
    departureYears,
    monthNames,
    filterYear,
    setFilterYear,
    filterMonth,
    setFilterMonth,
    formattedSelectedDate
}) => {
    // Determine base price based on selection
    const { basePrice, fees, totalPrice, discountApplied } = useMemo(() => {
        let price = tour.price;
        let discount = 0;
        const fees = 100; // Fixed fee for now

        // 1. Check for Seasonal Pricing (if fixed departure selected)
        if (selectedDepartureId && tour.seasonal_prices) {
            // In a real scenario, we'd find the departure price from the departure object directly
            // But here we might need to look it up if it's not passed directly. 
            // However, the parent component logic seemed to assume seasonal_prices ARE the departures.
            // Let's stick to the logic:
            const departure = tour.seasonal_prices?.find(sp => sp.id === selectedDepartureId);
            if (departure) {
                price = departure.price;
            }
        } 
        // 2. Check for Group Discounts
        else if (tour.group_discounts && tour.group_discounts.length > 0) {
            // Find applicable discount for current guest count
            const applicableDiscount = tour.group_discounts
                .filter(d => guestCount >= d.min_guests && guestCount <= d.max_guests)
                .sort((a, b) => b.discount_percentage - a.discount_percentage)[0];

            if (applicableDiscount) {
                discount = (price * applicableDiscount.discount_percentage) / 100;
                price = price - discount;
            }
        }

        const totalBase = price * guestCount;
        const total = totalBase > 0 ? totalBase + fees : 0;

        return { 
            basePrice: price, 
            fees, 
            totalPrice: total,
            discountApplied: discount > 0
        };
    }, [tour, selectedDepartureId, guestCount]);

    const isBookingOptionSelected = selectedDate || selectedDepartureId;

    // Helper to filter departures for the list
    const filteredDepartures = useMemo(() => {
        if (!tour.seasonal_prices) return [];
        return tour.seasonal_prices.map(sp => ({
            id: sp.id,
            startDate: new Date(sp.start_date),
            endDate: new Date(sp.end_date),
            price: sp.price,
            spotsLeft: 10 // Mock data
        })).filter(dep => {
            const yearMatch = filterYear === 'all' || dep.startDate.getFullYear() === filterYear;
            const monthMatch = filterMonth === 'all' || dep.startDate.getMonth() === filterMonth;
            return yearMatch && monthMatch;
        }).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }, [tour.seasonal_prices, filterYear, filterMonth]);

    return (
        <div className="bg-surface-dark rounded-3xl border border-white/5 p-6 shadow-xl shadow-black/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-xl font-bold text-white mb-6 relative z-10">Select Your Trip</h3>
            <div className="space-y-4 relative z-10">
                
                {/* Private Trip Selection */}
                <div className="relative">
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Book a Private Trip</label>
                    <button 
                        type="button"
                        onClick={() => setCalendarOpen(!calendarOpen)}
                        className={`w-full bg-surface-darker border rounded-xl px-4 py-3 text-left flex justify-between items-center outline-none cursor-pointer transition-colors ${selectedDate ? 'border-primary' : 'border-white/10'}`}
                    >
                        <span className={`${selectedDate ? 'text-white' : 'text-text-secondary'}`}>{formattedSelectedDate}</span>
                        <span className="material-symbols-outlined text-text-secondary">calendar_month</span>
                    </button>
                    {calendarOpen && children}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-grow h-px bg-white/10"></div>
                    <span className="text-xs font-bold text-text-secondary">OR</span>
                    <div className="flex-grow h-px bg-white/10"></div>
                </div>
                
                {/* Fixed Departure Selection */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Join a Fixed Departure</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="relative">
                            <select
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                aria-label="Filter by year"
                                className="w-full bg-surface-darker border border-white/10 rounded-md font-medium text-white text-sm appearance-none cursor-pointer py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            >
                                <option value="all">All Years</option>
                                {departureYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span className="material-symbols-outlined text-text-secondary text-base absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                        <div className="relative">
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                aria-label="Filter by month"
                                className="w-full bg-surface-darker border border-white/10 rounded-md font-medium text-white text-sm appearance-none cursor-pointer py-2 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                            >
                                <option value="all">All Months</option>
                                {monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
                            </select>
                            <span className="material-symbols-outlined text-text-secondary text-base absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-2 custom-scrollbar">
                        {filteredDepartures.length > 0 ? (
                            filteredDepartures.map(dep => {
                                const isSelected = selectedDepartureId === dep.id;
                                const isLowOnSpots = dep.spotsLeft <= 4;
                                const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
                                
                                const today = new Date();
                                const fortyFiveDaysFromNow = new Date();
                                fortyFiveDaysFromNow.setDate(today.getDate() + 45);
                                const isDepartingSoon = dep.startDate > today && dep.startDate <= fortyFiveDaysFromNow;

                                let urgencyBadge = null;
                                if (isDepartingSoon) {
                                    urgencyBadge = (
                                        <div className="absolute top-0 right-3 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-primary/30 z-10">
                                            Departing Soon
                                        </div>
                                    );
                                } else if (isLowOnSpots) {
                                    urgencyBadge = (
                                        <div className="absolute top-0 right-3 -translate-y-1/2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg shadow-yellow-500/30 z-10">
                                            Filling Fast
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={dep.id}
                                        onClick={() => onSelectDeparture(dep.id)}
                                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'bg-primary/10 border-primary' : 'bg-surface-darker border-transparent hover:border-white/20'}`}
                                    >
                                        {urgencyBadge}
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-white text-sm">{formatDate(dep.startDate)} - {formatDate(dep.endDate)}</p>
                                            <p className="font-bold text-white text-sm">${dep.price}</p>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs font-bold ${isLowOnSpots ? 'text-yellow-400' : 'text-text-secondary'}`}>
                                                {isLowOnSpots ? `Only ${dep.spotsLeft} spots left!` : `${dep.spotsLeft} spots available`}
                                            </p>
                                            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-white/20'}`}>
                                                {isSelected && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-text-secondary text-sm p-4 bg-surface-darker rounded-xl">
                                No departures match your filter.
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Guest Counter */}
                <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Guests</label>
                    <div className="flex items-center bg-surface-darker border border-white/10 rounded-xl px-4 py-2">
                        <button onClick={() => onGuestChange(-1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary text-white flex items-center justify-center transition-colors" type="button" aria-label="Decrease guests">-</button>
                        <span className="flex-grow text-center text-white font-bold">{guestCount} Guest{guestCount > 1 && 's'}</span>
                        <button onClick={() => onGuestChange(1)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary text-white flex items-center justify-center transition-colors" type="button" aria-label="Increase guests">+</button>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="py-4 border-t border-white/10 mt-2">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-text-secondary">
                            Base Price ({guestCount} Guest{guestCount > 1 && 's'})
                            {discountApplied && <span className="ml-2 text-xs text-green-400 font-bold">Discount Applied!</span>}
                        </span>
                        <span className="text-white font-medium">${(basePrice * guestCount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-text-secondary">Permits &amp; Fees</span>
                        <span className="text-white font-medium">${totalPrice > 0 ? fees : 0}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-2xl font-black text-primary">${totalPrice.toLocaleString()}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                    <Link 
                        to={isBookingOptionSelected ? "/booking/checkout" : "#"}
                        state={isBookingOptionSelected ? {
                            tourId: tour.id,
                            tourName: tour.name,
                            tourImage: tour.featured_image,
                            selectedDate: selectedDate?.toISOString(),
                            selectedDepartureId,
                            guestCount,
                            basePrice,
                            totalPrice
                        } : undefined}
                        className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group ${isBookingOptionSelected ? 'bg-primary hover:bg-primary-dark shadow-primary/20' : 'bg-gray-600 cursor-not-allowed'}`}
                        onClick={(e) => !isBookingOptionSelected && e.preventDefault()}
                        aria-disabled={!isBookingOptionSelected}
                    >
                        {isBookingOptionSelected ? 'Book Now' : 'Choose Your Dates'}
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                </div>

                {/* Support Contact */}
                <div className="text-center pt-4 border-t border-white/10 !mt-6">
                    <p className="text-sm text-text-secondary mb-2">Need any help? Contact us on</p>
                    <a href="https://wa.me/9779800000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-white font-bold group">
                        <WhatsAppIcon />
                        <span>+977 980 000 0000</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TourPricingCard;