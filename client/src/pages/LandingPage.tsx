import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/rebound/PrimaryButton';
import { useAuth } from '../providers/AuthProvider';

function ReboundMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 text-lg font-bold text-white shadow-soft ring-1 ring-white/70">
        R
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">Rebound</div>
    </div>
  );
}

function Illustration() {
  return (
    <div className="relative h-80 w-80">
      <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-teal-50 via-white to-sky-50 shadow-card" />
      <div className="absolute inset-4 rounded-[26px] bg-white/90 shadow-soft ring-1 ring-slate-200/60" />
      <div className="absolute left-6 top-7 h-28 w-36 rotate-[-6deg] rounded-3xl bg-gradient-to-br from-emerald-50 to-white shadow-card ring-1 ring-slate-200/50" />
      <div className="absolute right-6 top-16 h-24 w-28 rotate-[8deg] rounded-3xl bg-gradient-to-br from-teal-50 to-white shadow-card ring-1 ring-slate-200/50" />
      <div className="absolute left-10 bottom-10 h-16 w-40 rotate-[4deg] rounded-3xl bg-gradient-to-br from-orange-50 to-white shadow-card ring-1 ring-slate-200/50" />
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();

  const goToMap = async () => {
    await continueAsGuest();
    navigate('/map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e8f7f5] via-white to-[#e6f0ff]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-xl space-y-6"
        >
          <ReboundMark />
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900">
              Reuniting you with what matters
            </h1>
            <p className="text-lg text-slate-600">Find or report lost items.</p>
          </div>
          <div className="space-y-3 max-w-sm">
            <PrimaryButton size="lg" type="button" className="rounded-full shadow-card" onClick={goToMap}>
              Login
            </PrimaryButton>
            <button
              type="button"
              onClick={goToMap}
              className="w-full text-center text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
            >
              Continue as Guest
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="flex w-full justify-center lg:w-auto"
        >
          <Illustration />
        </motion.div>
      </div>
    </div>
  );
}
