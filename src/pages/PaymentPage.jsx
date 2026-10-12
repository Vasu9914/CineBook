import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBookingStore } from '../store/useBookingStore';
import { paymentApi } from '../api/paymentApi';
import { bookingApi } from '../api/bookingApi';
import { SeatTimer } from '../components/SeatTimer';
import { ArrowLeft, Lock, ShieldCheck, CreditCard, Sparkles, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const { selectedShow, selectedSeats, holdExpiresAt, activeBooking } = useBookingStore();

  const basePrice = selectedShow?.price || 250;
  const getSeatPrice = (seatNum) => (seatNum[0] >= 'I' ? Math.round(basePrice * 1.2) : basePrice);
  const seatsTotal = (selectedSeats || []).reduce((sum, s) => sum + getSeatPrice(s), 0);
  const convenienceFee = 20;
  const defaultTotal = seatsTotal > 0 ? seatsTotal + convenienceFee : 299;

  // Form Fields
  const [bookingRefInput, setBookingRefInput] = useState(
    activeBooking?.bookingReference || 'BOOK-' + Math.floor(10000 + Math.random() * 90000)
  );
  const [amountInput, setAmountInput] = useState(defaultTotal);
  const [paymentMode, setPaymentMode] = useState('razorpay'); // 'razorpay' | 'mock'

  // Flow & State Management
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // 'initiating' | 'ordering' | 'modal' | 'verifying' | 'success'
  const [lastPaymentRef, setLastPaymentRef] = useState('');
  const isExecutingRef = useRef(false);

  if (!selectedShow && !activeBooking) {
    return (
      <div className="py-20 text-center text-slate-300">
        <p>No active booking process found.</p>
        <Link to="/" className="text-red-400 underline text-sm mt-2 inline-block">
          Return to Home
        </Link>
      </div>
    );
  }

  const handlePayNow = async (e) => {
    if (e) e.preventDefault();

    if (!bookingRefInput || !bookingRefInput.trim()) {
      toast.warning('Please enter a valid Booking Reference.');
      return;
    }

    if (!amountInput || Number(amountInput) <= 0) {
      toast.warning('Please enter a valid payment Amount.');
      return;
    }

    if (isExecutingRef.current) {
      console.warn('⚠️ Payment process already running.');
      return;
    }

    isExecutingRef.current = true;
    setIsProcessing(true);
    setCurrentStep('initiating');

    try {
      const cleanBookingRef = bookingRefInput.trim();
      const cleanAmount = Number(amountInput);
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}`;

      // STEP 1: Initiate Payment
      // POST http://localhost:8084/api/payments
      console.log('🚀 [Step 1] Initiating Payment on :8084...');
      const payRecord = await paymentApi.processPayment({
        bookingReference: cleanBookingRef,
        amount: cleanAmount,
        currency: 'INR',
        idempotencyKey: uuid
      });

      const   paymentReference = payRecord?.paymentReference;
      if (!paymentReference) {
        throw new Error('Payment initiation failed: No paymentReference returned.');
      }
      setLastPaymentRef(paymentReference);
      console.log('✅ [Step 1] Payment Reference:', paymentReference);

      // STEP 2: Create Order
      // POST http://localhost:8084/api/payments/{paymentReference}/orders
      setCurrentStep('ordering');
      console.log(`🚀 [Step 2] Creating Order for ${paymentReference}...`);
      const order = await paymentApi.createRazorpayOrder(paymentReference);
      console.log('✅ [Step 2] Order Created:', order);


      // Helper function to finalize booking after signature/payment verification
      const handleVerificationSuccess = async (verResult) => {
        setCurrentStep('success');
        toast.success(`Payment verified successfully! (${paymentReference})`);

        // Confirm booking with Booking Service (:8083)
        try {
          await bookingApi.confirmBooking(cleanBookingRef);
        } catch (confirmErr) {
          console.warn('Booking confirm status:', confirmErr.message);
        }

        try {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}

        setTimeout(() => {
          navigate(`/booking/confirm?ref=${cleanBookingRef}`);
        }, 1200);
      };

      const isRazorpayReady = typeof window !== 'undefined' && window.Razorpay;

      if (paymentMode === 'razorpay' && isRazorpayReady) {
        // STEP 3: Open Razorpay Modal
        setCurrentStep('modal');
        const keyId = order?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '';

        // Backend returns amount in paise (e.g. 29900 for ₹299). Minimum is 100 paise (₹1.00).
        let finalAmountInPaise = order?.amount ? Number(order.amount) : Math.round(cleanAmount * 100);
        if (finalAmountInPaise < 100) {
          finalAmountInPaise = 100;
        }

        const isMockOrder = order?.orderId && order.orderId.startsWith('order_mock_');

        console.log('💳 Opening Razorpay Checkout Modal with Key:', keyId, 'Order:', order?.orderId, 'Amount(paise):', finalAmountInPaise);

        const options = {
          key: keyId,
          amount: finalAmountInPaise, // in paise directly from Step 2
          currency: order?.currency || 'INR',
          name: 'CineBook Movies',
          description: `Booking Reference: ${cleanBookingRef}`,
          // Only include order_id if it's a real Razorpay order ID; mock orders (order_mock_...) cause Razorpay API 400 Bad Request
          ...(!isMockOrder && order?.orderId ? { order_id: order.orderId } : {}),
          handler: async (response) => {
            setCurrentStep('verifying');
            try {
              console.log('📡 [Step 4] Verifying Razorpay payment signature...', response);
              const result = await paymentApi.verifyRazorpayPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id || order?.orderId || `order_mock_${Date.now()}`,
                razorpaySignature: response.razorpay_signature || 'mock_signature'
              });

              if (result && (result.success === true || result.status === 'SUCCESS')) {
                await handleVerificationSuccess(result);
              } else {
                throw new Error(result?.message || 'Payment verification failed');
              }
            } catch (vErr) {
              console.error('Verification error, attempting sync fallback:', vErr);
              // Recover via syncPayment in case money was deducted or network failed
              try {
                const syncResult = await paymentApi.syncPayment(paymentReference);
                if (syncResult && (syncResult.success === true || syncResult.status === 'SUCCESS')) {
                  await handleVerificationSuccess(syncResult);
                  return;
                }
              } catch (syncErr) {
                console.warn('Sync fallback failed:', syncErr.message);
              }
              toast.error(vErr.response?.data?.message || vErr.message || 'Payment verification failed');
              setCurrentStep(null);
            } finally {
              setIsProcessing(false);
              isExecutingRef.current = false;
            }
          },
          prefill: {
            name: 'Movie Buff',
            email: 'user@example.com',
            contact: '9999999999'
          },
          theme: { color: '#0ea5e9' },
          modal: {
            ondismiss: () => {
              console.log('Razorpay checkout modal dismissed by user');
              setIsProcessing(false);
              setCurrentStep(null);
              isExecutingRef.current = false;
              toast.info('Payment checkout dismissed');
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (resp) {
          console.error('Payment failed event:', resp.error);
          toast.error(`Payment failed: ${resp.error?.description || 'Gateway error'}`);
          setIsProcessing(false);
          setCurrentStep(null);
          isExecutingRef.current = false;
        });
        razorpay.open();
        return; // Modal callback handles the rest
      } else {
        // Mock Mode / Direct Verification Flow
        setCurrentStep('verifying');
        console.log(`🚀 [Mock Mode] Verifying Payment directly for ${paymentReference}...`);
        
        let verifyRecord;
        try {
          verifyRecord = await paymentApi.verifyRazorpayPayment({
            razorpayPaymentId: `pay_mock_${Date.now()}`,
            razorpayOrderId: order?.orderId || `order_mock_${Date.now()}`,
            razorpaySignature: 'mock_signature_approved'
          });
        } catch {
          // Direct fallback to /verify
          verifyRecord = await paymentApi.verifyPayment(paymentReference);
        }

        console.log('✅ [Step 4] Verification Result:', verifyRecord);

        if (verifyRecord && (verifyRecord.success === true || verifyRecord.status === 'SUCCESS')) {
          await handleVerificationSuccess(verifyRecord);
        } else {
          const errorMsg = verifyRecord?.message || 'Payment verification failed.';
          throw new Error(errorMsg);
        }
      }
    } catch (err) {
      console.error('❌ [Payment Flow Error]:', err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || err.message || 'Payment processing failed';
      toast.error(`Payment Failed: ${serverMsg}`);
      setCurrentStep(null);
    } finally {
      setIsProcessing(false);
      isExecutingRef.current = false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <Link
            to="/booking/summary"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Summary
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Checkout & Payment
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Payment Service Integration (:8084) — 3-Step Sequential Flow
          </p>
        </div>

        {holdExpiresAt && (
          <SeatTimer
            expiresAt={holdExpiresAt}
            onExpire={() => {
              toast.error('Session expired!');
              navigate('/');
            }}
          />
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Payment Summary Left Card (1 Col) */}
        <div className="bg-[#121824] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4 h-fit">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Booking Details</span>
            <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              PENDING
            </span>
          </h2>

          {selectedShow && (
            <div className="flex space-x-3 items-center">
              <img
                src={selectedShow.moviePoster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'}
                alt={selectedShow.movieTitle}
                className="w-14 h-20 object-cover rounded-xl border border-slate-700"
              />
              <div>
                <h3 className="text-sm font-bold text-white line-clamp-1">{selectedShow.movieTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedShow.theatreName} | {selectedShow.screenName}</p>
                <p className="text-xs text-slate-400">{formatDate(selectedShow.date)} | {selectedShow.startTime}</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 space-y-2 text-xs">
            {selectedSeats && selectedSeats.length > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Seats: <strong className="text-white">{selectedSeats.join(', ')}</strong></span>
                <span>₹{seatsTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-300">
              <span>Convenience Fee</span>
              <span>₹{convenienceFee}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-white">
              <span>Calculated Total</span>
              <span className="text-emerald-400">₹{defaultTotal}</span>
            </div>
          </div>
        </div>

        {/* Payment Form Right (2 Cols) */}
        <div className="md:col-span-2 bg-[#121824] p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Payment Form
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute initiate → create order → verify sequence
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-400 flex items-center bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Mock Gateway Ready
            </span>
          </div>

          <form onSubmit={handlePayNow} className="space-y-5">
            {/* Field: Payment Method Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode('razorpay')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMode === 'razorpay'
                      ? 'border-sky-500 bg-sky-500/10 shadow-lg shadow-sky-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-sky-400" />
                      Razorpay Gateway
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full">
                      Popup Modal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    UPI, Cards, NetBanking, Wallets with Step 4 signature verification
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('mock')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    paymentMode === 'mock'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-emerald-400" />
                      Mock Simulator
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      Instant Auto-Pass
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Direct test flow without opening external checkout popup
                  </p>
                </button>
              </div>
            </div>

            {/* Field 1: Booking Reference */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Booking Reference (Text)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={bookingRefInput}
                  onChange={(e) => setBookingRefInput(e.target.value)}
                  disabled={isProcessing}
                  required
                  placeholder="e.g. BOOK-12345 or BK-66250"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Unique reference assigned to your held ticket reservation
              </p>
            </div>

            {/* Field 2: Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Amount (INR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  disabled={isProcessing}
                  required
                  placeholder="299.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-slate-400">
                  INR
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Total payment amount to charge
              </p>
            </div>

            {/* Step Progress Visualizer */}
            {isProcessing && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>
                    {currentStep === 'initiating' && 'Step 1/4: Initiating payment (POST /api/payments)...'}
                    {currentStep === 'ordering' && 'Step 2/4: Creating Razorpay order (POST /api/payments/{ref}/orders)...'}
                    {currentStep === 'modal' && 'Step 3/4: Razorpay checkout popup open... Waiting for payment'}
                    {currentStep === 'verifying' && 'Step 4/4: Verifying payment signature (POST /api/payments/verify/razorpay)...'}
                    {currentStep === 'success' && 'Step 4/4: Payment verified successfully! Confirming booking...'}
                  </span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full transition-all duration-300"
                    style={{
                      width:
                        currentStep === 'initiating'
                          ? '25%'
                          : currentStep === 'ordering'
                          ? '50%'
                          : currentStep === 'modal'
                          ? '75%'
                          : '100%',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Pay Now Button */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-4 px-4 text-white font-extrabold text-base rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${
                  paymentMode === 'razorpay'
                    ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-900/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/50'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>
                      {paymentMode === 'razorpay'
                        ? `Proceed to Razorpay (₹${amountInput || 0})`
                        : `Instant Pay ₹${amountInput || 0}`}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span className="flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400 mr-1" />
                  {paymentMode === 'razorpay'
                    ? 'Official Razorpay Checkout Modal'
                    : 'Instant Simulator Mode'}
                </span>
                <span>Port 8084 Payment API</span>
              </div>
            </div>
          </form>

        </div>

      </div>

    </div>
  );
};
