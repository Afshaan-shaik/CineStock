import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Edit2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';

interface ProfileData {
  name: string;
  title: string;
  imageUrl: string;
  displayMode: 'round' | 'square';
  github: string;
  githubUser: string;
  instagram: string;
  instagramUser: string;
  bio?: string;
}

const INITIAL_PROFILE: ProfileData = {
  name: 'Afshan Sheikh',
  title: 'Creator & Developer',
  imageUrl: '/profile-avatar.svg',
  displayMode: 'round',
  github: 'https://github.com/Afshaan-shaik',
  githubUser: 'Afshaan-shaik',
  instagram: 'https://www.instagram.com/_thenameisshaan/',
  instagramUser: '@_thenameisshaan',
  bio: 'Building analog aesthetics, retro video synthesizers & creative web experiences.',
};

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE);
  const [ownerToken, setOwnerToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('cinestock_owner_token') || '';
    }
    return '';
  });
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('cinestock_owner_token');
    }
    return false;
  });

  // Owner Auth Dialog State
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Profile Editor Modal State
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);

  // Fetch published profile on mount / open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    fetch('/profile.json')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data) {
          try {
            const savedProfile = localStorage.getItem('cinestock_published_profile');
            if (savedProfile) {
              const parsed = JSON.parse(savedProfile);
              setProfile((prev) => ({ ...prev, ...data, ...parsed }));
              return;
            }
          } catch {}
          setProfile((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Keyboard Escape listener to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPhotoEditor) {
          setShowPhotoEditor(false);
        } else if (showAuthDialog) {
          setShowAuthDialog(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showPhotoEditor, showAuthDialog, onClose]);

  // Handle owner login / authentication
  const handleVerifyOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsVerifying(true);
    setAuthError(null);

    const expectedSecret = 'cinestock-owner-2026';

    if (passcode.trim() === expectedSecret) {
      sessionStorage.setItem('cinestock_owner_token', passcode.trim());
      setOwnerToken(passcode.trim());
      setIsOwnerAuthenticated(true);
      setShowAuthDialog(false);
      setPasscode('');
      setIsVerifying(false);
    } else {
      setAuthError('Invalid passcode. Access denied.');
      setIsVerifying(false);
    }
  };

  const handleLogoutOwner = () => {
    sessionStorage.removeItem('cinestock_owner_token');
    setOwnerToken('');
    setIsOwnerAuthenticated(false);
    setShowPhotoEditor(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#060810]/85 backdrop-blur-md flex items-center justify-center p-4 select-none overflow-y-auto animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-sm sm:max-w-md bg-[#0c101c] border border-[rgba(120,220,255,0.18)] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-5 sm:p-7 text-[#eaf4ff] overflow-hidden my-auto">
          {/* Faint Blueprint Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(rgba(120,220,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(120,220,255,0.15) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Glowing Ambient Corner Amber Aura */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[radial-gradient(circle,rgba(245,166,35,0.15),transparent_70%)] pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--mu)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close About modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header Badge */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131929] border border-[rgba(120,220,255,0.2)] text-[11px] font-mono tracking-wider text-[var(--a)] uppercase">
              <Sparkles className="w-3 h-3 text-[var(--a)]" />
              <span>CREATOR PROFILE</span>
            </div>

            {isOwnerAuthenticated && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                <ShieldCheck className="w-3 h-3" />
                <span>OWNER VERIFIED</span>
              </div>
            )}
          </div>

          {/* Profile Photo Display Stage */}
          <div className="relative z-10 flex flex-col items-center text-center my-3">
            <div className="relative group">
              {/* Photo Frame Container */}
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 bg-[#090a10] border-2 border-[var(--a)] shadow-[0_0_25px_rgba(245,166,35,0.25)] overflow-hidden transition-all duration-300 flex items-center justify-center ${
                  profile.displayMode === 'round' ? 'rounded-full' : 'rounded-2xl'
                }`}
              >
                <img
                  src={profile.imageUrl}
                  alt="Afshan Sheikh"
                  className="w-full h-full object-cover select-none"
                  onError={(e) => {
                    // Fallback if image path fails
                    (e.target as HTMLImageElement).src = '/profile-avatar.svg';
                  }}
                />
              </div>

              {/* Owner-Only Edit Photo Overlay Badge */}
              {isOwnerAuthenticated && (
                <button
                  type="button"
                  onClick={() => setShowPhotoEditor(true)}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--a)] text-[#090a10] shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Edit or Replace Profile Photo"
                >
                  <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Owner "Edit Photo" text button (if authenticated) */}
            {isOwnerAuthenticated && (
              <button
                type="button"
                onClick={() => setShowPhotoEditor(true)}
                className="mt-2 text-xs font-mono text-[var(--a)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change &amp; Edit Photo</span>
              </button>
            )}

            {/* Creator Name & Title */}
            <h2 className="mt-4 font-['Space_Grotesk',sans-serif] font-bold text-xl sm:text-2xl tracking-wide text-white">
              Afshan Sheikh
            </h2>
            <div className="mt-1 font-['Space_Mono',monospace] text-xs sm:text-sm text-[var(--a)] tracking-wider font-semibold">
              Creator &amp; Developer
            </div>

            {/* Bio Note */}
            <p className="mt-2.5 text-xs text-[#9eb1d1] leading-relaxed max-w-xs font-sans">
              Building analog aesthetics, retro video synthesizers &amp; creative web experiences.
            </p>
          </div>

          {/* Social Links Section */}
          <div className="relative z-10 flex flex-col gap-2.5 mt-5">
            {/* GitHub Account Link */}
            <a
              href="https://github.com/Afshaan-shaik"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#141a29] border border-[rgba(120,220,255,0.14)] hover:border-[var(--a)] hover:bg-[#192135] text-white transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white group-hover:text-[var(--a)] transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div className="text-left font-mono">
                  <div className="text-xs text-[var(--mu)] group-hover:text-white transition-colors">
                    GitHub
                  </div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    Afshaan-shaik
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--mu)] group-hover:text-[var(--a)] transition-colors" />
            </a>

            {/* Instagram Account Link */}
            <a
              href="https://www.instagram.com/_thenameisshaan/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#141a29] border border-[rgba(120,220,255,0.14)] hover:border-[var(--a)] hover:bg-[#192135] text-white transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-white group-hover:text-pink-400 transition-colors">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="text-left font-mono">
                  <div className="text-xs text-[var(--mu)] group-hover:text-white transition-colors">
                    Instagram
                  </div>
                  <div className="text-xs font-bold text-white tracking-wide">
                    @_thenameisshaan
                  </div>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--mu)] group-hover:text-[var(--a)] transition-colors" />
            </a>
          </div>

          {/* Discreet Footer: Owner Lab Authentication Access */}
          <div className="relative z-10 pt-4 mt-4 border-t border-[rgba(120,220,255,0.1)] flex items-center justify-between text-[11px] font-mono text-[var(--mu)]">
            <span className="text-[10px] tracking-wider uppercase opacity-60">
              CineStock v88 · Analog Lab
            </span>

            {isOwnerAuthenticated ? (
              <button
                type="button"
                onClick={handleLogoutOwner}
                className="inline-flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer"
                title="Log out from Owner Mode"
              >
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span>Owner Active (Log out)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthDialog(true)}
                className="inline-flex items-center gap-1 hover:text-[var(--a)] transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                title="Owner Authentication"
              >
                <Lock className="w-3 h-3 text-[var(--a)]" />
                <span>Owner Access</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Owner Authentication Dialog */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#0e121d] border border-[rgba(120,220,255,0.25)] rounded-2xl p-5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--a)] font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>OWNER ACCESS</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAuthDialog(false);
                  setAuthError(null);
                  setPasscode('');
                }}
                className="text-[var(--mu)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--mu)] mb-3 font-sans">
              Enter your owner passcode to unlock photo uploading and editing tools.
            </p>

            {authError && (
              <div className="mb-3 p-2 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono">
                {authError}
              </div>
            )}

            <form onSubmit={handleVerifyOwner} className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="Enter owner passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg bg-[#141926] border border-[rgba(120,220,255,0.2)] text-white text-xs font-mono focus:border-[var(--a)] focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthDialog(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--mu)] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-4 py-1.5 rounded-lg bg-[var(--a)] text-[#090a10] text-xs font-mono font-bold hover:bg-[#ffb638] disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying…' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Personal Profile Photo Editor Suite */}
      {showPhotoEditor && isOwnerAuthenticated && (
        <ProfilePhotoEditor
          isOpen={showPhotoEditor}
          currentImageUrl={profile.imageUrl}
          initialDisplayMode={profile.displayMode}
          ownerToken={ownerToken}
          onClose={() => setShowPhotoEditor(false)}
          onSaved={(updated) => {
            setProfile((prev) => ({ ...prev, ...updated }));
          }}
        />
      )}
    </>
  );
};
