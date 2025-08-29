import { Link } from 'react-router-dom';

export default function Marketing() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl mb-4">Gas Comparator</h1>
      <p className="mb-4">Comparez les offres de gaz et économisez.</p>
      <Link to="/login" className="text-emerald-600 underline">
        Commencer
      </Link>
    </div>
  );
}
