
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCountries } from '../lib/utils/countries';

const countryOptions = getCountries();

const addons = [
    { id: 'privateRoom', name: 'Private Room Upgrade', price: 350, description: 'Guaranteed single occupancy room in Kathmandu and teahouses during the trek.' },
    { id: 'porter', name: 'Extra Porter Weight (10kg)', price: 150, description: 'Increase your luggage allowance. We’ll carry one heavy item for you.' },
    { id: 'helicopter', name: 'Helicopter Return', price: 900, description: 'Skip the descent and fly back to Kathmandu with breathtaking aerial views.' },
    { id: 'transfer', name: 'Private Luxury Transfer', price: 60, description: 'Premium airport pickup and drop-off in a private vehicle.' },
];

const CheckoutPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const bookingData = location.state as {
        tourId: string;
        tourName: string;
        tourImage: string;
        selectedDate: string;
        selectedDepartureId: string | null;
        guestCount: number;
        basePrice: number;
        totalPrice: number;
    } | undefined;

    const [numTravelers, setNumTravelers] = useState(bookingData?.guestCount || 2);
    const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({
        privateRoom: true,
        transfer: true,
    });
    const [paymentMethod, setPaymentMethod] = useState<'full' | 'partial'>('full');

    // Redirect if no booking data is present (optional, or show default/empty state)
    useEffect(() => {
        if (!bookingData) {
            // Uncomment to enforce selection flow
            // navigate('/');
        }
    }, [bookingData, navigate]);

    const handleAddonToggle = (addonId: string) => {
        setSelectedAddons(prev => ({ ...prev, [addonId]: !prev[addonId] }));
    };

    const calculation = useMemo(() => {
        // Use passed basePrice or default to 1200
        const unitPrice = bookingData?.basePrice || 1200;
        const basePrice = numTravelers * unitPrice;
        const permitsAndFees = numTravelers * 50;
        let addonsTotal = 0;
        addons.forEach(addon => {
            if (selectedAddons[addon.id]) {
                addonsTotal += addon.price;
            }
        });
        const earlyBirdDiscount = -500; // This logic might need to be dynamic too
        const subtotal = basePrice + permitsAndFees + addonsTotal + earlyBirdDiscount;
        const taxes = subtotal * 0.10;
        const totalDue = subtotal + taxes;
        const partialAmount = totalDue * 0.30;

        return {
            basePrice,
            permitsAndFees,
            addonsTotal,
            earlyBirdDiscount,
            subtotal,
            taxes,
            totalDue,
            partialAmount,
        };
    }, [numTravelers, selectedAddons, bookingData]);

    const travelerForms = Array.from({ length: numTravelers }, (_, i) => (
        <div key={i} className={`bg-surface-darker/60 rounded-xl p-6 ${i > 0 ? 'mt-4' : ''}`}>
             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">{i + 1}</div>
                    <h4 className="font-bold text-white">{i === 0 ? 'Primary Traveler' : `Traveler ${i + 1}`}</h4>
                </div>
                {i > 0 && (
                     <button 
                        onClick={() => setNumTravelers(n => Math.max(1, n - 1))}
                        className="text-xs font-bold text-primary hover:underline"
                    >
                        Remove
                    </button>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-text-secondary mb-1 block">Full Name</label>
                    <input type="text" placeholder="John Doe" className="w-full bg-surface-dark border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                </div>
                 <div>
                    <label className="text-xs text-text-secondary mb-1 block">Date of Birth</label>
                    <input type="text" placeholder="mm/dd/yyyy" className="w-full bg-surface-dark border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                </div>
                 <div>
                    <label className="text-xs text-text-secondary mb-1 block">Passport Number</label>
                    <input type="text" placeholder="A1234567" className="w-full bg-surface-dark border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                </div>
                 <div>
                    <label className="text-xs text-text-secondary mb-1 block">Nationality</label>
                    <select className="w-full bg-surface-dark border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition">
                        <option>Select Country</option>
                        {countryOptions.map(c => <option key={c.code}>{c.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                     <label className="text-xs text-text-secondary mb-1 block">Dietary or Special Requests</label>
                    <textarea placeholder="E.g., Vegetarian, Gluten-free, Allergies..." rows={2} className="w-full bg-surface-dark border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition"></textarea>
                </div>
             </div>
        </div>
    ));

    return (
         <>
            <header className="relative -mt-[100px] min-h-[40vh] flex items-end justify-center overflow-hidden rounded-b-2xl md:rounded-b-[3rem]">
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url('${bookingData?.tourImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRhAgmyafMtZInsKcZjC6PERny9fQkTYXnQc2xe3Dn2hSTQ2D2bEPyiLHkfuqDOIamvdyHiV6lOBJgYm_mzEkiQeGcxj6XcjWqapph7IcKty8Mcbs7CdDGengbgwALm5rAVVQmydirCKo5JLlaeh-L3z0AJYecOSmxkI8TpR7pMITU12XLou8iXgEwQe7_3NbQK8rZDzw39TV_j5JnhmpBQ55T2U0LJGQROBZEKe8IxNVO4-xOcOfSMr99VgNtWGMAriy0J_zOV2il'}')` }}>
                </div>
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-background-dark via-background-dark/90 to-background-dark/60"></div>
                <div className="relative z-10 container mx-auto px-4 pb-12 max-w-7xl">
                    <div className="flex flex-col gap-4">
                        <Link to={bookingData ? `/trip/${bookingData.tourId}` : "/"} className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors text-sm font-medium w-fit">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Back to Trip Details
                        </Link>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                            {bookingData?.tourName ? (
                                <span>{bookingData.tourName}</span>
                            ) : (
                                <>Checkout & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">Payment</span></>
                            )}
                        </h1>
                        {bookingData?.selectedDate && (
                            <p className="text-xl text-white/80 font-medium">
                                Start Date: {new Date(bookingData.selectedDate).toLocaleDateString('en-US', { dateStyle: 'long' })}
                            </p>
                        )}
                    </div>
                </div>
            </header>
             <main className="flex-grow pt-12 pb-16 px-4 md:px-8 lg:px-16 container mx-auto max-w-7xl">
                <div className="w-full max-w-4xl mx-auto mb-10 md:mb-14 px-4">
                    <div className="relative">
                        <div className="absolute top-4 md:top-5 left-0 w-full h-0.5 bg-surface-dark border-t border-white/5 -translate-y-1/2 rounded-full"></div>
                        <div className="absolute top-4 md:top-5 left-0 w-1/2 h-0.5 bg-primary -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(217,30,70,0.5)]"></div>
                        <div className="relative flex justify-between w-full">
                            <div className="flex flex-col items-center gap-3 group cursor-pointer">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center ring-[6px] ring-background-dark z-10 transition-transform group-hover:scale-110 shadow-[0_0_15px_rgba(217,30,70,0.4)]">
                                    <span className="material-symbols-outlined text-white text-base md:text-lg font-bold">check</span>
                                </div>
                                <span className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest group-hover:text-white transition-colors">Review Order</span>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-dark flex items-center justify-center ring-[6px] ring-background-dark z-10 border-2 border-white/10">
                                    <span className="text-white text-base md:text-lg font-bold">2</span>
                                </div>
                                <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest">Payment</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 opacity-50">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-dark flex items-center justify-center ring-[6px] ring-background-dark z-10 border-2 border-white/10">
                                   <span className="text-white text-base md:text-lg font-bold">3</span>
                                </div>
                                <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest">Confirmation</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Info */}
                        <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
                             <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">mail</span>
                                <h3 className="text-xl font-bold text-white">Contact Information</h3>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div>
                                    <label className="text-xs text-text-secondary mb-1 block">Email Address</label>
                                    <input type="email" placeholder="you@example.com" className="w-full bg-surface-darker border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                                 </div>
                                 <div>
                                    <label className="text-xs text-text-secondary mb-1 block">Phone Number</label>
                                    <input type="tel" placeholder="+1 (555) 000-0000" className="w-full bg-surface-darker border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                                 </div>
                             </div>
                             <div className="mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded bg-surface-darker border-white/20 text-primary focus:ring-primary" />
                                    <span className="text-sm text-text-secondary">Yes, send me travel tips and exclusive offers for my trip to Nepal.</span>
                                </label>
                             </div>
                        </div>

                        {/* Travelers Details */}
                         <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">group</span>
                                <h3 className="text-xl font-bold text-white">Travelers Details</h3>
                             </div>
                             {travelerForms}
                             <button 
                                onClick={() => setNumTravelers(n => n + 1)}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/10 rounded-lg text-sm font-bold text-white hover:border-primary hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">add_circle</span>
                                Add Another Traveler
                             </button>
                              <div className="mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded bg-surface-darker border-white/20 text-primary focus:ring-primary" />
                                    <span className="text-sm text-text-secondary">Save traveler details for future bookings.</span>
                                </label>
                             </div>
                        </div>

                        {/* Add-ons */}
                        <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-primary text-2xl">add_shopping_cart</span>
                                <h3 className="text-xl font-bold text-white">Add-ons & Extras</h3>
                            </div>
                            <div className="space-y-3">
                                {addons.map(addon => {
                                    const isSelected = !!selectedAddons[addon.id];
                                    return (
                                        <div
                                            key={addon.id}
                                            onClick={() => handleAddonToggle(addon.id)}
                                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${isSelected ? 'border-primary bg-primary/10' : 'border-transparent bg-surface-darker hover:border-white/20'}`}
                                            role="checkbox"
                                            aria-checked={isSelected}
                                            tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleAddonToggle(addon.id); } }}
                                        >
                                            <div className={`mt-1 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-primary border-primary' : 'bg-surface-dark border-white/30'}`}>
                                                {isSelected && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-white">{addon.name}</span>
                                                    <span className="font-bold text-white">+${addon.price}</span>
                                                </div>
                                                <p className="text-sm text-text-secondary mt-1">{addon.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-surface-dark border border-white/5 rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-primary text-2xl">payment</span>
                                <h3 className="text-xl font-bold text-white">Payment Method</h3>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div onClick={() => setPaymentMethod('full')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'full' ? 'border-primary bg-primary/10' : 'border-transparent bg-surface-darker hover:border-white/20'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">Pay in Full</span>
                                        <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-md">SAVE 5%</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">${calculation.totalDue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                                    <p className="text-sm text-text-secondary">Total amount due today</p>
                                </div>
                                 <div onClick={() => setPaymentMethod('partial')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'partial' ? 'border-primary bg-primary/10' : 'border-transparent bg-surface-darker hover:border-white/20'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white">Partial Payment</span>
                                        <span className="text-xs font-bold bg-white/10 text-white px-2 py-0.5 rounded-md">30% ADVANCE</span>
                                    </div>
                                    <p className="text-2xl font-bold text-white">${calculation.partialAmount.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
                                    <p className="text-sm text-text-secondary">Pay the rest upon arrival</p>
                                </div>
                             </div>
                             <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <span className="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
                                <p className="text-xs text-text-secondary">Please read our <a href="#" className="font-bold text-primary hover:underline">Terms and Conditions</a> carefully before selecting your payment plan. This document contains important information about cancellations and refunds.</p>
                             </div>

                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h4 className="font-bold text-white mb-4">Enter Card Details</h4>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="text-xs text-text-secondary mb-1 block">Card Number</label>
                                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full bg-surface-darker border-transparent rounded-lg pl-12 pr-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-[-2px] text-text-secondary">credit_card</span>
                                    </div>
                                     <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-xs text-text-secondary mb-1 block">Expiration Date</label>
                                            <input type="text" placeholder="MM/YY" className="w-full bg-surface-darker border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                                        </div>
                                         <div>
                                            <label className="text-xs text-text-secondary mb-1 block">CVC/CVV</label>
                                            <input type="text" placeholder="123" className="w-full bg-surface-darker border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                                        </div>
                                    </div>
                                    <div>
                                         <label className="text-xs text-text-secondary mb-1 block">Name on Card</label>
                                         <input type="text" placeholder="Full Name" className="w-full bg-surface-darker border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition" />
                                    </div>
                                    <div className="mt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="w-4 h-4 rounded bg-surface-darker border-white/20 text-primary focus:ring-primary" />
                                            <span className="text-sm text-text-secondary">Billing address is same as contact information</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                             <div className="mt-6 flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                                <span className="material-symbols-outlined text-primary text-xl">troubleshoot</span>
                                <div className="flex-grow">
                                    <h5 className="font-bold text-white text-sm">Having trouble paying?</h5>
                                    <p className="text-xs text-text-secondary">If you're experiencing payment issues, please contact our support team immediately.</p>
                                </div>
                                <button className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-full text-xs font-bold text-white whitespace-nowrap">Live Chat</button>
                            </div>
                             <div className="mt-4 flex items-center gap-3 p-4 bg-green-500/10 rounded-lg">
                                <span className="material-symbols-outlined text-green-400 text-xl">lock</span>
                                <div className="flex-grow">
                                    <h5 className="font-bold text-white text-sm">Secure SSL Encryption</h5>
                                    <p className="text-xs text-text-secondary">Your financial data is encrypted and secure. We do not store your full credit card information.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                    {/* Sticky Sidebar */}
                     <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden shadow-2xl shadow-black/30">
                                <div className="relative h-48 w-full">
                                    <img alt="Everest Base Camp Trek" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRhAgmyafMtZInsKcZjC6PERny9fQkTYXnQc2xe3Dn2hSTQ2D2bEPyiLHkfuqDOIamvdyHiV6lOBJgYm_mzEkiQeGcxj6XcjWqapph7IcKty8Mcbs7CdDGengbgwALm5rAVVQmydirCKo5JLlaeh-L3z0AJYecOSmxkI8TpR7pMITU12XLou8iXgEwQe7_3NbQK8rZDzw39TV_j5JnhmpBQ55T2U0LJGQROBZEKe8IxNVO4-xOcOfSMr99VgNtWGMAriy0J_zOV2il" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent"></div>
                                    <div className="absolute bottom-4 left-6">
                                        <div className="inline-flex items-center gap-1 bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md mb-2">
                                            <span className="material-symbols-outlined text-[12px]">landscape</span>
                                            <span>Expedition</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white leading-tight">Everest Base Camp Trek</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase">Dates</p>
                                            <p className="font-bold text-white">Oct 15 - Oct 29, 2024</p>
                                        </div>
                                         <button className="text-xs font-bold text-primary hover:underline">Edit</button>
                                    </div>
                                     <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase">Guests</p>
                                            <p className="font-bold text-white">{numTravelers} Adults</p>
                                        </div>
                                         <button className="text-xs font-bold text-primary hover:underline">Edit</button>
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-secondary">Base Price ({numTravelers} x $1,200)</span>
                                            <span className="text-white font-medium">${calculation.basePrice.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-secondary">Permits &amp; Fees</span>
                                            <span className="text-white font-medium">${calculation.permitsAndFees.toLocaleString()}</span>
                                        </div>
                                        {Object.entries(selectedAddons).map(([id, isSelected]) => {
                                            if (!isSelected) return null;
                                            const addon = addons.find(a => a.id === id);
                                            return (
                                                 <div key={id} className="flex justify-between text-sm">
                                                    <span className="text-text-secondary">{addon?.name}</span>
                                                    <span className="text-white font-medium">${addon?.price.toLocaleString()}</span>
                                                </div>
                                            )
                                        })}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-secondary">Early Bird Discount</span>
                                            <span className="text-green-500 font-medium">-${(-calculation.earlyBirdDiscount).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-3 border-t border-white/10">
                                            <span className="text-text-secondary">Subtotal</span>
                                            <span className="text-white font-medium">${calculation.subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-text-secondary">Taxes (10%)</span>
                                            <span className="text-white font-medium">${calculation.taxes.toLocaleString()}</span>
                                        </div>
                                    </div>
                                     <div className="flex items-center gap-2 mb-4">
                                        <input type="text" placeholder="Gift card or discount code" className="flex-grow bg-surface-darker border-transparent rounded-lg px-4 py-2 text-white focus:ring-primary focus:border-primary transition text-sm" />
                                        <button className="px-4 py-2 rounded-lg bg-white/5 text-white font-bold text-sm hover:bg-white/10">Apply</button>
                                    </div>
                                    <div className="flex justify-between items-end mb-6 pt-4 border-t border-white/10">
                                        <div>
                                            <p className="text-xs text-text-secondary uppercase mb-1">Total Due</p>
                                            <p className="text-sm text-text-secondary">USD</p>
                                        </div>
                                        <p className="text-3xl font-black text-white">${calculation.totalDue.toLocaleString()}</p>
                                    </div>
                                    <Link to="/booking/confirmed" className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 group mb-4">
                                        Complete Booking
                                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                    </Link>
                                    <p className="text-center text-[10px] text-text-secondary">By clicking the button, you agree to our <a href="#" className="text-primary hover:underline">Terms and Conditions</a> and <a href="#" className="text-primary hover:underline">Cancellation Policy</a>.</p>
                                </div>
                            </div>
                            <div className="bg-surface-dark rounded-xl border border-white/5 p-6 text-center">
                                <h4 className="font-bold text-white mb-3">Need help with your booking?</h4>
                                <div className="flex items-center justify-center gap-2 mb-4">
                                    <img src="https://randomuser.me/api/portraits/women/68.jpg" className="w-8 h-8 rounded-full border-2 border-surface-dark" />
                                    <img src="https://randomuser.me/api/portraits/men/75.jpg" className="w-8 h-8 rounded-full border-2 border-surface-dark -ml-3" />
                                    <img src="https://randomuser.me/api/portraits/women/79.jpg" className="w-8 h-8 rounded-full border-2 border-surface-dark -ml-3" />
                                </div>
                                <div className="flex gap-3">
                                    <button className="w-full py-2 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-bold transition-colors">
                                        <span className="material-symbols-outlined text-base text-primary">chat</span>
                                        Live Chat
                                    </button>
                                    <button className="w-full py-2 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-bold transition-colors">
                                        <span className="material-symbols-outlined text-base text-primary">call</span>
                                        Call Us
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
         </>
    );
};

export default CheckoutPage;
