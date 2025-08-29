import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../components/AuthProvider';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY as string);

export default function Billing() {
  const { user, session } = useAuth();

  const handleCheckout = async () => {
    const stripe = await stripePromise;
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
    });
    const data = await res.json();
    if (stripe && data.id) {
      await stripe.redirectToCheckout({ sessionId: data.id });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Abonnement</h1>
      <button onClick={handleCheckout} className="bg-emerald-600 text-white p-2 rounded">
        Souscrire
      </button>
    </div>
  );
}
