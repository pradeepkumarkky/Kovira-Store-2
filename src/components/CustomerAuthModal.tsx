import React, { useState } from 'react';
import { CustomerUser, SavedAddress, Order, CurrencyCode } from '../types';
import { formatPrice } from '../utils/currency';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
  Package,
  Truck,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Plus,
  Home,
  Briefcase,
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerUser | null;
  currency?: CurrencyCode;
  onLoginSuccess?: (user: CustomerUser) => void;
  onLogout?: () => void;
  onUserChange?: (user: CustomerUser | null) => void;
  onTrackOrder?: (orderNumber: string) => void;
  onOpenOrderTracker?: () => void;
  onCancelOrder?: (orderId: string, orderNumber: string) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currency = 'INR',
  onLoginSuccess,
  onLogout,
  onUserChange,
  onTrackOrder,
  onOpenOrderTracker,
  onCancelOrder,
}) => {
  const notifyUser = (user: CustomerUser | null) => {
    if (user) {
      if (onLoginSuccess) onLoginSuccess(user);
      if (onUserChange) onUserChange(user);
    } else {
      if (onLogout) onLogout();
      if (onUserChange) onUserChange(null);
    }
  };
  const [mode, setMode] = useState<'signin' | 'register' | 'account'>(
    currentUser ? 'account' : 'signin'
  );

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form State - Expanded Address Lines
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddressLine1, setRegAddressLine1] = useState('');
  const [regAddressLine2, setRegAddressLine2] = useState('');
  const [regLandmark, setRegLandmark] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPostalCode, setRegPostalCode] = useState('');
  const [regCountry, setRegCountry] = useState('India');

  // Address modal in account
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostalCode, setNewPostalCode] = useState('');
  const [newCountry, setNewCountry] = useState('India');

  // Async state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Hoisted function to avoid any ReferenceError before initialization
  const fetchOrders = React.useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/customer/orders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setUserOrders(data.orders);
      }
    } catch {
      // ignore
    }
  }, []);

  // If user opens modal while logged in, default to account view
  React.useEffect(() => {
    if (currentUser) {
      setMode('account');
      if (isOpen) {
        fetchOrders(currentUser.email);
      }
    } else {
      setMode('signin');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [currentUser, isOpen, fetchOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setSuccessMessage(`Welcome back, ${data.user.name}!`);
        notifyUser(data.user);
        setMode('account');
        fetchOrders(data.user.email);
      } else {
        setErrorMessage(data.error || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to customer authentication service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Combine all detailed address lines
    const combinedAddress = [
      regAddressLine1.trim(),
      regAddressLine2.trim(),
      regLandmark.trim() ? `Near ${regLandmark.trim()}` : '',
      regCity.trim(),
      regState.trim(),
      regPostalCode.trim(),
      regCountry.trim(),
    ]
      .filter(Boolean)
      .join(', ');

    try {
      const res = await fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          address: combinedAddress,
          addressLine1: regAddressLine1,
          addressLine2: regAddressLine2,
          landmark: regLandmark,
          state: regState,
          city: regCity,
          postalCode: regPostalCode,
          country: regCountry,
        }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setSuccessMessage('Your account was created successfully!');
        notifyUser(data.user);
        setMode('account');
        fetchOrders(data.user.email);
      } else {
        setErrorMessage(data.error || 'Failed to create customer account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newAddress.trim()) return;

    try {
      const res = await fetch('/api/customer/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          address: {
            label: newLabel,
            recipientName: currentUser.name,
            address: newAddress,
            city: newCity,
            postalCode: newPostalCode,
            country: newCountry,
            isDefault: false,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.savedAddresses) {
        currentUser.savedAddresses = data.savedAddresses;
        notifyUser({ ...currentUser });
        setIsAddingAddress(false);
        setNewAddress('');
        setNewCity('');
        setNewPostalCode('');
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-900 h-[96dvh] sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                {mode === 'account'
                  ? 'Customer Account & Orders'
                  : mode === 'signin'
                  ? 'Sign In to Kovira'
                  : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'account'
                  ? 'Manage addresses, VIP benefits & order dispatches'
                  : 'Fast checkout, live order tracking & rewards'}
              </p>
            </div>
          </div>

          <button
            id="close-customer-auth-btn"
            onClick={onClose}
            className="p-2 sm:p-2.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close modal"
            aria-label="Close customer auth modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alerts */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-700 px-4 sm:px-5 py-2.5 text-xs shrink-0">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 sm:px-5 py-2.5 text-xs flex items-center gap-1.5 font-medium shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 overscroll-contain">
          {/* TAB: SIGN IN */}
          {mode === 'signin' && (
            <div className="space-y-5">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-login-email"
                      type="email"
                      required
                      placeholder="rahul.sharma@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="customer-login-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  id="customer-login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle to register */}
              <div className="pt-2 text-center text-xs text-slate-500">
                Don't have a Kovira account yet?{' '}
                <button
                  id="switch-to-register-btn"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-slate-900 hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </div>
            </div>
          )}

          {/* TAB: REGISTER */}
          {mode === 'register' && (
            <div className="space-y-5">
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    id="customer-reg-name"
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      id="customer-reg-email"
                      type="email"
                      required
                      placeholder="rahul.sharma@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number (Mobile)
                    </label>
                    <input
                      id="customer-reg-phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Create Password
                  </label>
                  <input
                    id="customer-reg-password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Expanded Customer Delivery Address Lines */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Delivery Address Details (Multiple Lines)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">For accurate dispatch</span>
                  </div>

                  {/* Address Line 1 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Address Line 1 (Flat, House no., Building, Company, Apartment)
                    </label>
                    <input
                      id="customer-reg-address-line1"
                      type="text"
                      placeholder="e.g. Flat 402, Shanti Niketan Apts, 4th Cross Road"
                      value={regAddressLine1}
                      onChange={(e) => setRegAddressLine1(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Address Line 2 (Area, Colony, Street, Sector, Village)
                    </label>
                    <input
                      id="customer-reg-address-line2"
                      type="text"
                      placeholder="e.g. Koramangala 5th Block, Indiranagar"
                      value={regAddressLine2}
                      onChange={(e) => setRegAddressLine2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* Landmark */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Landmark (Optional, e.g. near Metro Station, opposite Mall)
                    </label>
                    <input
                      id="customer-reg-landmark"
                      type="text"
                      placeholder="e.g. Near Sony World Signal / Opposite Forum Mall"
                      value={regLandmark}
                      onChange={(e) => setRegLandmark(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        City / Town
                      </label>
                      <input
                        id="customer-reg-city"
                        type="text"
                        placeholder="e.g. Bengaluru"
                        value={regCity}
                        onChange={(e) => setRegCity(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        State / Region
                      </label>
                      <input
                        id="customer-reg-state"
                        type="text"
                        placeholder="e.g. Karnataka"
                        value={regState}
                        onChange={(e) => setRegState(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Postal code & Country */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        PIN Code / Postal Code
                      </label>
                      <input
                        id="customer-reg-postal-code"
                        type="text"
                        placeholder="e.g. 560034"
                        value={regPostalCode}
                        onChange={(e) => setRegPostalCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Country
                      </label>
                      <select
                        id="customer-reg-country"
                        value={regCountry}
                        onChange={(e) => setRegCountry(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none cursor-pointer font-semibold"
                      >
                        <option value="India">🇮🇳 India</option>
                        <option value="United States">🇺🇸 United States</option>
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                        <option value="Canada">🇨🇦 Canada</option>
                        <option value="Australia">🇦🇺 Australia</option>
                        <option value="Germany">🇩🇪 Germany</option>
                        <option value="France">🇫🇷 France</option>
                        <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                        <option value="Singapore">🇸🇬 Singapore</option>
                        <option value="Global (Other)">🌐 Global (Other)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  id="customer-register-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-3"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-500">
                Already registered?{' '}
                <button
                  id="switch-to-signin-btn"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-slate-900 hover:underline cursor-pointer"
                >
                  Sign in to your account
                </button>
              </div>
            </div>
          )}

          {/* TAB: LOGGED IN ACCOUNT PROFILE & ORDERS */}
          {mode === 'account' && currentUser && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-base text-amber-300">
                      {currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                        {currentUser.name}
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                          {currentUser.membershipTier || 'Kovira VIP'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      notifyUser(null);
                      setMode('signin');
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Free Delivery Active
                  </span>
                  <span>Member since {new Date(currentUser.createdAt).getFullYear()}</span>
                </div>
              </div>

              {/* Saved Delivery Addresses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-700" />
                    Saved Delivery Addresses
                  </h4>
                  <button
                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                    className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </button>
                </div>

                {isAddingAddress && (
                  <form onSubmit={handleAddAddress} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewLabel('Home')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                          newLabel === 'Home' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'
                        }`}
                      >
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewLabel('Office')}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                          newLabel === 'Office' ? 'bg-slate-900 text-white' : 'bg-white border text-slate-700'
                        }`}
                      >
                        Office
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Flat, House No., Building, Area, Street"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="City (e.g. Bengaluru)"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="PIN Code (e.g. 560034)"
                        value={newPostalCode}
                        onChange={(e) => setNewPostalCode(e.target.value)}
                        className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="text-xs text-slate-500 px-3 py-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="text-xs bg-slate-900 text-white px-3 py-1 rounded-lg font-bold"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {currentUser.savedAddresses && currentUser.savedAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {currentUser.savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            {addr.label === 'Office' ? (
                              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <Home className="w-3.5 h-3.5 text-slate-500" />
                            )}
                            <span>{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600">{addr.address}</p>
                          <p className="text-slate-500 text-[11px]">
                            {addr.city}, {addr.postalCode} • {addr.country}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No saved addresses yet. Addresses used at checkout will be saved here automatically.
                  </p>
                )}
              </div>

              {/* Order History */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-slate-700" />
                  Your Past Orders ({userOrders.length})
                </h4>

                {userOrders.length > 0 ? (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {userOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-slate-900 font-mono">
                              #{ord.orderNumber}
                            </span>
                            <span className="text-slate-400 text-[10px] ml-2">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {ord.fulfillmentStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>
                            {ord.items?.length || 1} item(s) • Total: <strong>{formatPrice(ord.total, ord.currency || currency)}</strong>
                          </span>

                          <div className="flex items-center gap-2.5">
                            {ord.fulfillmentStatus !== 'Cancelled' && ord.fulfillmentStatus !== 'Delivered' && (
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to cancel Order #${ord.orderNumber}? Any debited amount will be refunded to your UPI account.`)) {
                                    try {
                                      await fetch(`/api/orders/${ord.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ fulfillmentStatus: 'Cancelled' }),
                                      });
                                      setUserOrders((prev) =>
                                        prev.map((o) => (o.id === ord.id ? { ...o, fulfillmentStatus: 'Cancelled' } : o))
                                      );
                                      if (onCancelOrder) {
                                        onCancelOrder(ord.id, ord.orderNumber);
                                      }
                                    } catch {
                                      // fallback
                                    }
                                  }
                                }}
                                className="text-rose-600 font-bold hover:underline text-[11px] cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            )}
                            {onTrackOrder && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onTrackOrder(ord.orderNumber);
                                }}
                                className="text-sky-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Truck className="w-3 h-3" /> Track Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
                    No orders placed yet. Products you purchase will display real-time dispatch progress here.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
