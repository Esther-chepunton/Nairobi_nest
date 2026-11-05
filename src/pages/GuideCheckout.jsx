import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { createGuideBooking, getGuides, getPaymentStatus, getPlace, payGuideMpesa } from "../lib/api";
import { placePath } from "../lib/placeIdentity";
import { guides as guidesCopy, loading, toast as toastCopy } from "../lib/copy";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 90000;
const FINAL_STATUSES = ["confirmed", "failed", "cancelled"];

function resolvePlaceRefFromQuery(raw) {
  if (!raw) return { place_key: undefined, place_id: null };
  const decoded = decodeURIComponent(raw);
  if (decoded.includes(":")) {
    return { place_key: decoded, place_id: null };
  }
  const asInt = parseInt(decoded, 10);
  if (!Number.isNaN(asInt) && String(asInt) === decoded) {
    return { place_key: undefined, place_id: asInt };
  }
  return { place_key: decoded, place_id: null };
}

export default function GuideCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const placeParam = searchParams.get("place_id");
  const guideIdParam = searchParams.get("guide_id");
  const placeRef = resolvePlaceRefFromQuery(placeParam);

  const [guides, setGuides] = useState([]);
  const [placeSnapshot, setPlaceSnapshot] = useState(null);
  const [guideId, setGuideId] = useState(guideIdParam || "");
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(2);
  const [phone, setPhone] = useState("");
  const [loadingState, setLoadingState] = useState(false);
  // Reused on retry so a failed payment doesn't create a duplicate booking.
  const [bookingId, setBookingId] = useState(null);
  const [payment, setPayment] = useState(null); // { status, message, mpesa_receipt }
  const pollTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(pollTimer.current), []);

  useEffect(() => {
    getGuides().then(setGuides).catch(console.error);
  }, []);

  useEffect(() => {
    const { place_key, place_id } = resolvePlaceRefFromQuery(placeParam);
    const ref = place_key || place_id;
    if (!ref) return;
    getPlace(ref)
      .then(setPlaceSnapshot)
      .catch(() => setPlaceSnapshot(null));
  }, [placeParam]);

  const selectedGuide = guides.find((g) => g.id === parseInt(guideId, 10));
  const amount = selectedGuide ? selectedGuide.price_per_hour * duration : 0;
  const checkout = guidesCopy.checkout;

  const pollPayment = (id, startedAt) => {
    pollTimer.current = window.setTimeout(async () => {
      try {
        const result = await getPaymentStatus(id);
        if (FINAL_STATUSES.includes(result.status)) {
          setPayment(result);
          if (result.status === "confirmed") toast.success(checkout.status.confirmed);
          return;
        }
      } catch {
        // Network blip: keep polling until the timeout.
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPayment({ status: "timeout" });
        return;
      }
      pollPayment(id, startedAt);
    }, POLL_INTERVAL_MS);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!guideId || !date || !phone) {
      toast.error(toastCopy.fillAllFields);
      return;
    }

    setLoadingState(true);
    setPayment(null);
    try {
      let id = bookingId;
      if (!id) {
        const booking = await createGuideBooking({
          guide_id: parseInt(guideId, 10),
          place_key: placeSnapshot?.place_key || placeRef.place_key,
          place_id: placeSnapshot?.id || placeSnapshot?.legacy_place_id || placeRef.place_id,
          place: placeSnapshot || undefined,
          date,
          duration_hours: duration,
        });
        id = booking.id;
        setBookingId(id);
      }

      // The server charges the booking's own amount; the phone is normalised server-side.
      await payGuideMpesa({ phone_number: phone, guide_booking_id: id });
      toast.info(toastCopy.mpesaSent);
      setPayment({ status: "awaiting_payment" });
      pollPayment(id, Date.now());
    } catch (err) {
      toast.error(err.message || toastCopy.paymentFailed);
    } finally {
      setLoadingState(false);
    }
  };

  const awaiting = payment?.status === "awaiting_payment";
  const formLocked = loadingState || awaiting || payment?.status === "confirmed";

  return (
    <div className="min-h-screen bg-kijiji-deep px-4 py-8 md:px-8 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="font-serif text-3xl text-kijiji-text mb-2">{checkout.title}</h1>
        <p className="text-muted mb-8">{checkout.subtitle}</p>

        {placeSnapshot?.name && (
          <p className="text-sm text-kijiji-accent mb-4">
            Booking around {placeSnapshot.name}
          </p>
        )}

        <form onSubmit={handlePay} className="space-y-6 glass-card p-6">
          <div>
            <label className="block text-sm text-muted mb-2">{checkout.selectGuide}</label>
            <select value={guideId} onChange={(e) => setGuideId(e.target.value)} className="w-full" required disabled={!!bookingId}>
              <option value="">{checkout.selectGuide}</option>
              {guides.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — KSh {g.price_per_hour}/hr
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{checkout.date}</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
              required
              disabled={!!bookingId}
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{checkout.duration}</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full"
              disabled={!!bookingId}
            >
              {[2, 4, 6, 8].map((h) => (
                <option key={h} value={h}>
                  {checkout.durations?.[h] || `${h} hours`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted mb-2">{checkout.mpesaPhone}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              className="w-full"
              required
              disabled={formLocked}
            />
            <p className="text-xs text-muted mt-1">{checkout.phoneHint}</p>
          </div>

          <p className="text-kijiji-text font-medium">
            {checkout.total}: KSh {amount.toLocaleString()}
          </p>

          {payment && (
            <div
              role="status"
              className={`rounded-lg p-3 text-sm ${
                payment.status === "confirmed"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : awaiting || payment.status === "timeout"
                    ? "bg-kijiji-accent/15 text-kijiji-text"
                    : "bg-red-500/15 text-red-300"
              }`}
            >
              <p>{checkout.status[payment.status] || payment.message}</p>
              {payment.message && !["awaiting_payment", "timeout", "confirmed"].includes(payment.status) && (
                <p className="mt-1 opacity-80">{payment.message}</p>
              )}
              {payment.mpesa_receipt && <p className="mt-1 font-medium">{checkout.receipt(payment.mpesa_receipt)}</p>}
            </div>
          )}

          {payment?.status === "confirmed" || payment?.status === "timeout" ? (
            <button type="button" className="btn-primary w-full" onClick={() => navigate("/profile")}>
              {checkout.viewProfile}
            </button>
          ) : (
            <button type="submit" className="btn-primary w-full" disabled={formLocked}>
              {loadingState || awaiting
                ? loading.payment
                : payment
                  ? checkout.retry
                  : checkout.pay}
            </button>
          )}
        </form>

        <Link
          to={placeParam ? placePath(decodeURIComponent(placeParam)) : "/"}
          className="block text-center text-muted text-sm mt-4"
        >
          {checkout.cancel}
        </Link>
      </div>
    </div>
  );
}
