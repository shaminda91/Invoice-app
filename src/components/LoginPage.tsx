import React from 'react';
import { Translations, AppLanguage } from '../i18n/translations';
import { ADMIN_EMAIL } from '../types';
import {
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
  FileDown,
  Cloud,
  Building2,
  Languages,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginGoogle: () => void;
  onContinueGuest: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  t: Translations;
}

export function LoginPage({
  onLoginGoogle,
  onContinueGuest,
  isLoggingIn,
  loginError,
  language,
  onLanguageChange,
  t,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* BACKGROUND DECORATIVE ACCENTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NAV BAR */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>PSN</span>
                <span className="text-indigo-400">Invoice</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Ps ebay solution
              </span>
            </div>
            <p className="text-xs text-slate-400">by Pramesh Shaminda</p>
          </div>
        </div>

        {/* LANGUAGE SWITCHER */}
        <div className="flex items-center bg-slate-800/80 backdrop-blur-xs border border-slate-700/60 p-1 rounded-xl">
          <div className="px-2 text-slate-400 hidden sm:block">
            <Languages className="w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={() => onLanguageChange('si')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === 'si'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            සිංහල
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('ta')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === 'ta'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            தமிழ்
          </button>
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-14 my-auto">
        {/* LEFT COLUMN: BRAND STORY & KEY PERKS */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.appBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t.loginTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t.loginSubtitle}
          </p>

          {/* BENEFIT GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2">
                <FileDown className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit1Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit1Desc}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <Cloud className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit2Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit2Desc}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit3Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit3Desc}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit4Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION CARD */}
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
              <Receipt className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {language === 'si'
                ? 'ගිණුමට පිවිසෙන්න'
                : language === 'ta'
                ? 'கணக்கில் உள்நுழைக'
                : 'Sign in to PSN Invoice'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'si'
                ? 'ඔබගේ Gmail / Google ගිණුම මගින් තත්පරයකින් ඇතුල් වන්න'
                : language === 'ta'
                ? 'உங்கள் Gmail / Google கணக்கு மூலம் பாதுகாப்பாக உள்நுழையுங்கள்'
                : 'Authenticate securely using your Google (Gmail) account'}
            </p>
          </div>

          {/* ERROR ALERT */}
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <span className="font-bold">!</span>
              <span>{loginError}</span>
            </div>
          )}

          {/* PRIMARY GOOGLE SIGN IN BUTTON */}
          <button
            type="button"
            id="btn-login-google"
            onClick={onLoginGoogle}
            disabled={isLoggingIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span>{t.connectingGoogle}</span>
              </>
            ) : (
              <>
                {/* OFFICIAL GOOGLE SVG ICON */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
                <span>
                  {language === 'si'
                    ? 'Gmail ගිණුමෙන් පිවිසෙන්න'
                    : language === 'ta'
                    ? 'Gmail கணக்கு மூலம் உள்நுழைக'
                    : 'Sign in with Google (Gmail)'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* ADMIN APPROVAL NOTICE (NO FREE UNAPPROVED USE) */}
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center text-xs space-y-1">
            <div className="font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>
                {language === 'si'
                  ? 'පරිපාලකගේ අවසරය අනිවාර්යයි'
                  : language === 'ta'
                  ? 'நிர்வாகியின் அனுமதி கட்டாயமானது'
                  : 'Admin Approval Strictly Required'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {language === 'si'
                ? `නොමිලේ භාවිත කළ නොහැක. Gmail මගින් පිවිසි පසු ප්‍රධාන පරිපාලක (${ADMIN_EMAIL}) විසින් අනුමත කළ යුතුය.`
                : language === 'ta'
                ? `இலவசமாகப் பயன்படுத்த முடியாது. Gmail மூலம் உள்நுழைந்த பிறகு (${ADMIN_EMAIL}) அனுமதி தேவை.`
                : `Free access is not permitted. Once signed in with Google, your account must be approved by ${ADMIN_EMAIL}.`}
            </p>
          </div>

          {/* ADMIN MONITORING & TRIAL BADGE */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                {language === 'si' ? (
                  <>
                    ප්‍රධාන පරිපාලක ගිණුම:{' '}
                    <span className="text-amber-300 font-mono font-semibold">
                      {ADMIN_EMAIL}
                    </span>
                    . ලියාපදිංචි වන සියලුම ගිණුම් පරිපාලකගේ සෘජු පාලනය යටතේ පවතී.
                  </>
                ) : language === 'ta' ? (
                  <>
                    நிர்வாகி கணக்கு:{' '}
                    <span className="text-amber-300 font-mono font-semibold">
                      {ADMIN_EMAIL}
                    </span>
                    . அனைத்து கணக்குகளும் நிர்வாகியின் நேரடி கட்டுப்பாட்டில் இருக்கும்.
                  </>
                ) : (
                  <>
                    System Admin:{' '}
                    <span className="text-amber-300 font-mono font-semibold">
                      {ADMIN_EMAIL}
                    </span>
                    . All registered accounts are directly managed by Admin.
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-300">
                {language === 'si'
                  ? 'නව පරිශීලක ප්‍රවේශය:'
                  : language === 'ta'
                  ? 'புதிய பயனர் அணுகல்:'
                  : 'New user access:'}
              </span>
              <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                ⏳ {language === 'si'
                  ? 'පරිපාලක අනුමැතිය අවශ්‍යයි'
                  : language === 'ta'
                  ? 'நிர்வாகியின் அனுமதி தேவை'
                  : 'Admin Approval Required'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>
          PSN Invoice © 2026 • Ps ebay solution • Pramesh Shaminda (Malabe, Sri Lanka)
        </p>
      </footer>
    </div>
  );
}
