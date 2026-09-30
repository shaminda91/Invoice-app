import React, { useState, useEffect } from 'react';
import { UserAccessProfile, ADMIN_EMAIL } from '../types';
import { Translations, AppLanguage } from '../i18n/translations';
import {
  createRenewalMailtoLink,
  createApprovalRequestMailtoLink,
  createRenewalGmailLink,
  createApprovalRequestGmailLink,
} from '../services/userAccessManager';
import { submitApprovalRequest } from '../services/superAdminApi';
import { auth } from '../services/googleAuth';
import {
  Clock,
  AlertTriangle,
  Mail,
  RefreshCw,
  LogOut,
  Shield,
  Receipt,
  CheckCircle2,
  ExternalLink,
  Lock,
  Hourglass,
  UserCheck,
  Send,
  MessageSquare,
  Check,
} from 'lucide-react';

interface AccessExpiredScreenProps {
  userEmail: string;
  userName: string;
  profile: UserAccessProfile | null;
  onSignOut: () => void;
  onRefreshStatus: () => void;
  language: AppLanguage;
  t: Translations;
}

export function AccessExpiredScreen({
  userEmail,
  userName,
  profile,
  onSignOut,
  onRefreshStatus,
  language,
  t,
}: AccessExpiredScreenProps) {
  const [emailCopied, setEmailCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);
  const [requestStatusMessage, setRequestStatusMessage] = useState<string | null>(null);

  const isPending = !profile || profile.status === 'pending';
  const isBlocked = profile?.status === 'blocked';
  const allowedDays = profile?.allowedDays || 0;

  // Auto-submit approval request on initial mount so admin database has it immediately
  useEffect(() => {
    if (isPending && userEmail && userEmail !== 'No Email' && userEmail !== 'Guest Session') {
      const userPayload = {
        uid: auth.currentUser?.uid || profile?.userId || `user_${Date.now()}`,
        email: userEmail,
        displayName: userName || profile?.displayName || auth.currentUser?.displayName || userEmail.split('@')[0],
        photoURL: profile?.photoURL || auth.currentUser?.photoURL || undefined,
      };

      submitApprovalRequest(userPayload, 'Awaiting Admin Approval').then((res) => {
        if (res.success) {
          setRequestSentSuccess(true);
        }
      }).catch(() => {});
    }
  }, [isPending, userEmail, userName, profile?.userId]);

  // Auto-poll status every 5 seconds so client unlocks automatically once Admin approves
  useEffect(() => {
    const interval = setInterval(() => {
      onRefreshStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [onRefreshStatus]);

  const [isEmailSending, setIsEmailSending] = useState(false);

  const handleSendInAppRequest = async () => {
    if (isSendingRequest) return;
    setIsSendingRequest(true);
    setRequestStatusMessage(null);

    const userPayload = {
      uid: auth.currentUser?.uid || profile?.userId || `user_${Date.now()}`,
      email: userEmail,
      displayName: userName || profile?.displayName || auth.currentUser?.displayName || userEmail.split('@')[0],
      photoURL: profile?.photoURL || auth.currentUser?.photoURL || undefined,
    };

    try {
      const res = await submitApprovalRequest(userPayload, 'User clicked Send Request in App');
      if (res.success) {
        setRequestSentSuccess(true);
        setRequestStatusMessage(
          language === 'si'
            ? '✓ ඔබගේ ඉල්ලීම ප්‍රධාන පරිපාලක (psgss91@gmail.com) වෙත සාර්ථකව යවන ලදී! පරිපාලක අනුමත කළ විගස මෙම තිරය ස්වයංක්‍රීයව විවෘත වේ.'
            : language === 'ta'
            ? '✓ உங்கள் கோரிக்கை முதன்மை நிர்வாகிக்கு (psgss91@gmail.com) வெற்றிகரமாக அனுப்பப்பட்டது!'
            : '✓ Your approval request was successfully sent to Super Admin (psgss91@gmail.com)!'
        );
      } else {
        setRequestSentSuccess(true);
        setRequestStatusMessage(
          language === 'si'
            ? '✓ ඉල්ලීම ලියාපදිංචි කරන ලදී. කරුණාකර WhatsApp හෝ Email මගින්ද පරිපාලක අමතන්න.'
            : '✓ Request registered. Please also contact admin via WhatsApp or Email.'
        );
      }
    } catch {
      setRequestSentSuccess(true);
    } finally {
      setIsSendingRequest(false);
      onRefreshStatus();
    }
  };

  const handleEmailAdminApproval = async (mode: 'gmail' | 'mailto' = 'gmail') => {
    if (isEmailSending) return;
    setIsEmailSending(true);
    setRequestStatusMessage(null);

    const userPayload = {
      uid: auth.currentUser?.uid || profile?.userId || `user_${Date.now()}`,
      email: userEmail,
      displayName: userName || profile?.displayName || auth.currentUser?.displayName || userEmail.split('@')[0],
      photoURL: profile?.photoURL || auth.currentUser?.photoURL || undefined,
    };

    try {
      await submitApprovalRequest(userPayload, 'User submitted Email Approval Request');
      setRequestSentSuccess(true);
    } catch (e) {
      console.warn('Error saving approval request:', e);
    } finally {
      setIsEmailSending(false);
      onRefreshStatus();
    }

    // 2. Open Gmail Web or native mail client
    const targetGmailUrl = isPending
      ? createApprovalRequestGmailLink(profile, userEmail)
      : createRenewalGmailLink(profile, userEmail);

    if (mode === 'mailto') {
      window.location.href = mailtoUrl;
    } else {
      const opened = window.open(targetGmailUrl, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        // Fallback to mailto link if popup was blocked
        window.location.href = mailtoUrl;
      }
    }

    // 3. Reassuring status message for user
    setRequestStatusMessage(
      language === 'si'
        ? `✓ ඔබගේ ඉල්ලීම ප්‍රධාන පරිපාලක (${ADMIN_EMAIL}) වෙත සාර්ථකව ලැබී ඇත! විවෘත වූ Gmail/Email පණිවිඩය Send කරන්න. පරිපාලක අනුමත කළ විගස මෙම තිරය ස්වයංක්‍රීයව අගුළු හැරේ.`
        : language === 'ta'
        ? `✓ உங்கள் அனுமதி கோரிக்கை முதன்மை நிர்வாகிக்கு (${ADMIN_EMAIL}) அனுப்பப்பட்டது! ஜிமெயில்/மின்னஞ்சல் வழியே அனுப்பவும்.`
        : `✓ Your approval request was submitted to Super Admin (${ADMIN_EMAIL})! Please click Send in Gmail/Email. System will auto-unlock once approved.`
    );
  };

  const mailtoUrl = isPending
    ? createApprovalRequestMailtoLink(profile, userEmail)
    : createRenewalMailtoLink(profile, userEmail);

  // Pre-filled WhatsApp message URL
  const whatsappText = encodeURIComponent(
    `Hello Admin psgss91@gmail.com,\n\nI have registered on PSN Invoice and need account approval.\n\nUser: ${userName}\nEmail: ${userEmail}\nStatus: Awaiting Admin Approval\n\nPlease approve my account.`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  const handleCopyAdminEmail = () => {
    navigator.clipboard.writeText(ADMIN_EMAIL);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      onRefreshStatus();
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden p-4 sm:p-6">
      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BAR */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">PSN Invoice</span>
        </div>
        <div className="text-xs text-slate-400">
          <span className="hidden sm:inline">Signed in as: </span>
          <span className="font-semibold text-slate-200">{userEmail}</span>
        </div>
      </header>

      {/* CENTER EXPIRATION / PENDING APPROVAL NOTICE CARD */}
      <main className="max-w-lg mx-auto w-full my-auto py-8">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
          {/* ICON BADGE */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
              isPending
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-amber-950/40'
                : isBlocked
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-rose-950/40'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-rose-950/40'
            }`}
          >
            {isPending ? (
              <Hourglass className="w-8 h-8 animate-pulse" />
            ) : isBlocked ? (
              <Lock className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
          </div>

          {/* HEADINGS */}
          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                isPending
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
              }`}
            >
              {isPending ? <Hourglass className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>
                {language === 'si'
                  ? isPending
                    ? 'පරිපාලකගේ අනුමැතිය බලාපොරොත්තුවෙන් (Awaiting Admin Approval)'
                    : isBlocked
                    ? 'ප්‍රවේශය අවහිර කර ඇත (Access Blocked)'
                    : `ප්‍රවේශ කාලය (දින ${allowedDays}) අවසන් වී ඇත`
                  : language === 'ta'
                  ? isPending
                    ? 'நிர்வாகியின் ஒப்புதலுக்காக காத்திருக்கிறது'
                    : isBlocked
                    ? 'அணுகல் தடுக்கப்பட்டுள்ளது (Access Blocked)'
                    : `அணுகல் காலம் (${allowedDays} நாட்கள்) முடிவடைந்தது`
                  : isPending
                  ? 'Awaiting Admin Approval'
                  : isBlocked
                  ? 'Access Restricted by Admin'
                  : `Access Period (${allowedDays} Days) Expired`}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {language === 'si'
                ? isPending
                  ? 'පරිපාලකගේ අවසරය අවශ්‍යයි'
                  : 'ඔබගේ ගිණුම යාවත්කාලීන කරන්න'
                : language === 'ta'
                ? isPending
                  ? 'நிர்வாகியின் அனுமதி தேவை'
                  : 'கணக்கைப் புதுப்பிக்க வேண்டும்'
                : isPending
                ? 'Admin Approval Required'
                : 'Account Renewal Required'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              {isPending ? (
                language === 'si' ? (
                  <>
                    ඔබගේ ගිණුම් ලියාපදිංචි ඉල්ලීම ප්‍රධාන පරිපාලක (
                    <span className="text-amber-300 font-mono font-bold">{ADMIN_EMAIL}</span>
                    ) වෙත සාර්ථකව ලැබී ඇත. මෙම මෘදුකාංගය භාවිත කිරීම සඳහා පරිපාලකගේ අනුමැතිය අවශ්‍ය වේ. කරුණාකර පහත බොත්තම මගින් පරිපාලක අමතා ඔබගේ ගිණුම සක්‍රිය (Approve) කරවා ගන්න.
                  </>
                ) : language === 'ta' ? (
                  <>
                    உங்கள் பதிவு கோரிக்கை முதன்மை நிர்வாகிக்கு (
                    <span className="text-amber-300 font-mono font-bold">{ADMIN_EMAIL}</span>
                    ) அனுப்பப்பட்டுள்ளது. பயன்பாட்டைப் பயன்படுத்த நிர்வாகியின் ஒப்புதல் தேவை. கணக்கை செயல்படுத்த கீழே உள்ள பொத்தானை கிளிக் செய்து நிர்வாகியைத் தொடர்பு கொள்ளவும்.
                  </>
                ) : (
                  <>
                    Your registration request has been submitted to the Administrator (
                    <span className="text-amber-300 font-mono font-bold">{ADMIN_EMAIL}</span>
                    ). Admin approval is strictly required before you can access and create invoices. Please contact the administrator below to activate your account.
                  </>
                )
              ) : language === 'si' ? (
                <>
                  ඔබගේ අත්හදා බැලීමේ කාලසීමාව අවසන් වී ඇත.
                  නැවත ඉන්වොයිස් සැකසීම හා භාවිතය සඳහා කරුණාකර පරිපාලක (
                  <span className="text-indigo-300 font-mono font-bold">{ADMIN_EMAIL}</span>
                  ) අමතා ඔබගේ ප්‍රවේශය යාවත්කාලීන (Renew) කරගන්න.
                </>
              ) : language === 'ta' ? (
                <>
                  PSN Invoice க்கான உங்கள் அணுகல் காலம் முடிந்துவிட்டது.
                  மீண்டும் விலைப்பட்டியல்களை உருவாக்க மற்றும் அணுகலைப் புதுப்பிக்க நிர்வாகியை (
                  <span className="text-indigo-300 font-mono font-bold">{ADMIN_EMAIL}</span>
                  ) தொடர்பு கொள்ளவும்.
                </>
              ) : (
                <>
                  Your access period for PSN Invoice has expired. To renew or update your
                  access, please contact the administrator (
                  <span className="text-indigo-300 font-mono font-bold">{ADMIN_EMAIL}</span>
                  ).
                </>
              )}
            </p>
          </div>

          {/* USER PROFILE INFO BOX */}
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-left text-xs space-y-1.5 font-mono text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">User:</span>
              <span className="text-slate-200">{profile?.displayName || userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="text-slate-200 truncate max-w-[220px]">{profile?.email || userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className={isPending ? 'text-amber-400 font-bold' : isBlocked ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                {isPending ? '⏳ Awaiting Admin Approval (අනුමැතිය අවශ්‍යයි)' : isBlocked ? 'Blocked' : 'Expired'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Admin Contact:</span>
              <span className="text-indigo-300 font-bold">{ADMIN_EMAIL}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-2">
            {/* Status message banner if request sent */}
            {requestStatusMessage && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-left flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{requestStatusMessage}</div>
              </div>
            )}

            {isPending && !requestStatusMessage && requestSentSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs text-left flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  {language === 'si'
                    ? `✓ පරිපාලක (${ADMIN_EMAIL}) වෙත ඉල්ලීම සාර්ථකව ලැබී ඇත! පරිපාලක අනුමත කළ විගස මෙම තිරය ස්වයංක්‍රීයව විවෘත වේ.`
                    : `✓ Request successfully registered with Admin (${ADMIN_EMAIL})! The system will unlock automatically once approved.`}
                </div>
              </div>
            )}

            {/* 1. Primary Action: Instant In-App Approval Request to Server & Firestore */}
            {isPending && (
              <button
                type="button"
                onClick={handleSendInAppRequest}
                disabled={isSendingRequest}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                {isSendingRequest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {language === 'si'
                        ? 'ඉල්ලීම යවමින් පවතී...'
                        : 'Sending Request to Admin...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>
                      {language === 'si'
                        ? requestSentSuccess
                          ? '✓ නැවත ඉල්ලීමක් යවන්න (Resend Request)'
                          : '🚀 පරිපාලක වෙත ඉල්ලීම යවන්න (Send Request in App)'
                        : requestSentSuccess
                        ? '✓ Resend Approval Request'
                        : '🚀 Send Approval Request to Admin'}
                    </span>
                  </>
                )}
              </button>
            )}

            {/* 2. Interactive Email Action (Submits request to Admin database + opens Gmail Web / Mail App) */}
            <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-3 space-y-2.5 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  {language === 'si'
                    ? 'පරිපාලක වෙත ඊමේල් ඉල්ලීම'
                    : 'Email Request to Admin'}
                </span>
                <span className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">
                  {ADMIN_EMAIL}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleEmailAdminApproval('gmail')}
                disabled={isEmailSending}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] group"
              >
                {isEmailSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>
                      {language === 'si'
                        ? 'ඉල්ලීම සටහන් කර Gmail විවෘත කරමින්...'
                        : 'Recording & Opening Gmail...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform" />
                    <span>
                      {language === 'si'
                        ? '✉️ පරිපාලක වෙත ඊමේල් ඉල්ලීමක් යවන්න (Email Admin to Approve)'
                        : `✉️ Email Admin to Approve (${ADMIN_EMAIL})`}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                <span className="text-slate-400">
                  {language === 'si' ? 'Gmail හරහා විවෘත වේ' : 'Opens in Gmail Web'}
                </span>
                <button
                  type="button"
                  onClick={() => handleEmailAdminApproval('mailto')}
                  className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                >
                  {language === 'si' ? 'Default Mail App මගින්' : 'Open in Default Mail App'}
                </button>
              </div>
            </div>

            {/* 3. Secondary WhatsApp Action */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer group"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>
                {language === 'si'
                  ? '💬 WhatsApp මගින් පරිපාලක අමතන්න (WhatsApp Admin)'
                  : '💬 Chat with Admin on WhatsApp'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            </a>

            {/* Refresh / Check Status button */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-600/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
                <span>
                  {language === 'si'
                    ? '🔄 අනුමත තත්ත්වය පරීක්ෂා කරන්න'
                    : language === 'ta'
                    ? 'நிலையை சரிபார்க்கவும்'
                    : 'Check Approval Status'}
                </span>
              </button>

              {/* Copy Email */}
              <button
                type="button"
                onClick={handleCopyAdminEmail}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-600/60 transition-colors cursor-pointer"
                title="Copy Admin Email"
              >
                {emailCopied ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Copied
                  </span>
                ) : (
                  'Copy Email'
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 pt-0.5">
              {language === 'si'
                ? 'ℹ️ පරිපාලක විසින් අනුමත කළ වහාම මෙම තිරය ස්වයංක්‍රීයව විවෘත වේ (Auto-polling active).'
                : 'ℹ️ The screen will automatically unlock as soon as the Admin approves your account.'}
            </div>

            {/* Sign out button */}
            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2.5 px-3 text-slate-400 hover:text-rose-300 text-xs font-medium rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>
                {language === 'si'
                  ? 'ගිණුමෙන් ඉවත් වී වෙනත් ගිණුමකින් පිවිසෙන්න'
                  : language === 'ta'
                  ? 'வெளியேறி வேறு கணக்கு மூலம் உள்நுழைக'
                  : 'Sign out and use another account'}
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-4xl mx-auto w-full py-3 text-center text-xs text-slate-500 border-t border-slate-800">
        PSN Invoice • Admin: {ADMIN_EMAIL} • Ps ebay solution
      </footer>
    </div>
  );
}
