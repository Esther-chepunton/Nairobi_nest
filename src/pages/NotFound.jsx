import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kijiji-deep px-4 pb-24 text-center">
      <p className="text-kijiji-accent text-sm mb-2">404</p>
      <h1 className="font-serif text-3xl text-kijiji-text mb-3">This path leads nowhere — yet.</h1>
      <p className="text-muted mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary">
        Back to discovering
      </Link>
    </div>
  );
}
