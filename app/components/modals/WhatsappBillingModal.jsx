'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Copy,
  Check,
  Save,
  AlertCircle,
  Phone,
} from 'lucide-react';
import {
  BILLING_FREQUENCIES,
  formatWhatsappDisplay,
  normalizeWhatsappNumber,
  buildWhatsappBillingMessage,
  buildWhatsappUrl,
} from '@/lib/whatsapp/billing.js';
import { formatMoney } from '@/lib/dashboard/format.js';

function resolveInitialFrequency(paymentFrequency) {
  return BILLING_FREQUENCIES.includes(paymentFrequency) ? paymentFrequency : 'Mensal';
}

export default function WhatsappBillingModal({
  isOpen,
  client,
  pendingAmount = 0,
  onClose,
  onSaveWhatsapp,
}) {
  const [frequency, setFrequency] = useState(() =>
    resolveInitialFrequency(client?.payment_frequency)
  );
  const [phoneInput, setPhoneInput] = useState(() =>
    formatWhatsappDisplay(client?.whatsapp || '')
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [copied, setCopied] = useState(false);

  const phoneInputRef = React.useRef(null);
  const latestClientRef = React.useRef(client);

  useEffect(() => {
    latestClientRef.current = client;
  });

  const clientId = client?.id;

  useEffect(() => {
    const current = latestClientRef.current;
    if (!isOpen || !current || current.id !== clientId) return;

    setFrequency(resolveInitialFrequency(current.payment_frequency));
    setPhoneInput(formatWhatsappDisplay(current.whatsapp || ''));
    setErrorMsg('');
    setSaveStatus('idle');
    setCopied(false);
  }, [isOpen, clientId]);

  useEffect(() => {
    if (saveStatus !== 'saved') return undefined;
    const timer = setTimeout(() => setSaveStatus('idle'), 2000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const message = buildWhatsappBillingMessage(frequency);

  const handleSavePhone = async () => {
    if (phoneInput.trim() !== '' && !normalizeWhatsappNumber(phoneInput)) {
      setErrorMsg('Informe um número de WhatsApp válido com DDD (ex: 85 99999-9999).');
      phoneInputRef.current?.focus();
      return;
    }

    setErrorMsg('');
    setSaveStatus('saving');

    try {
      const result = await onSaveWhatsapp?.(client.id, phoneInput);
      if (result && result.ok === false) {
        setSaveStatus('idle');
        setErrorMsg(result.error || 'Não foi possível salvar o WhatsApp do cliente.');
        return;
      }
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('idle');
      setErrorMsg(err?.message || 'Não foi possível salvar o WhatsApp do cliente.');
    }
  };

  const handleCopyMessage = async () => {
    if (!navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      // Ambientes sem suporte ou permissão de área de transferência
    }
  };

  const handleSendWhatsapp = () => {
    const url = buildWhatsappUrl(phoneInput, frequency);
    if (!url) {
      setErrorMsg('Informe um número de WhatsApp válido com DDD (ex: 85 99999-9999).');
      phoneInputRef.current?.focus();
      return;
    }

    setErrorMsg('');
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    if (formatWhatsappDisplay(client?.whatsapp || '') !== phoneInput && onSaveWhatsapp) {
      try {
        Promise.resolve(onSaveWhatsapp(client.id, phoneInput)).catch(() => {});
      } catch {
        // Falha silenciosa em background após abrir o WhatsApp
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && client && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-billing-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-surface border border-line-strong rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-5 z-10 max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-pos shrink-0" aria-hidden="true" />
                  <h3
                    id="whatsapp-billing-title"
                    className="text-lg sm:text-xl font-bold text-fg"
                  >
                    Cobrar Cliente
                  </h3>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-fg truncate max-w-[240px] sm:max-w-[300px]">
                    {client.name}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      pendingAmount > 0
                        ? 'bg-warn/10 text-warn border-warn/25'
                        : 'bg-pos/10 text-pos border-pos/25'
                    }`}
                  >
                    {`Em aberto: ${formatMoney(pendingAmount)}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal de cobrança"
                className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 overflow-y-auto pr-0.5 flex-1 min-h-0">
              {/* Frequency Selector */}
              <div>
                <p className="text-xs font-medium text-muted mb-2">Qual cobrança enviar?</p>
                <div className="grid grid-cols-3 gap-2">
                  {BILLING_FREQUENCIES.map((freq) => {
                    const isActive = frequency === freq;
                    return (
                      <button
                        key={freq}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setFrequency(freq)}
                        className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                          isActive
                            ? 'bg-accent text-white border-accent shadow-sm'
                            : 'bg-surface-2 text-muted border-line hover:text-fg'
                        }`}
                      >
                        {freq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp Number Editor */}
              <div>
                <label
                  htmlFor="billing-whatsapp-input"
                  className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-subtle" aria-hidden="true" />
                  <span>WhatsApp do cliente</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="billing-whatsapp-input"
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(formatWhatsappDisplay(e.target.value));
                      setErrorMsg('');
                      setSaveStatus('idle');
                    }}
                    placeholder="(85) 99999-9999"
                    className="flex-1 min-w-0 bg-surface-2 border border-line focus:border-accent focus:outline-none rounded-xl px-3.5 py-2 text-sm text-fg placeholder:text-subtle transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleSavePhone}
                    disabled={saveStatus === 'saving'}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line-strong bg-surface-2 hover:bg-surface-2/80 text-xs sm:text-sm font-medium text-fg disabled:opacity-60 transition-colors cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4 text-muted" aria-hidden="true" />
                    <span>{saveStatus === 'saving' ? 'Salvando...' : 'Salvar'}</span>
                  </button>
                </div>

                {errorMsg ? (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-1.5 text-xs text-neg bg-neg/10 border border-neg/20 rounded-lg px-3 py-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                ) : saveStatus === 'saved' ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-pos">
                    <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Número salvo no cadastro do cliente!</span>
                  </p>
                ) : null}
              </div>

              {/* Message Preview */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-muted">Prévia da mensagem</span>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-surface-2/80 hover:border-line-strong text-xs font-medium text-muted hover:text-fg transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-pos" aria-hidden="true" />
                        <span className="text-pos">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copiar texto</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs sm:text-[13px] text-fg bg-surface-2/70 border border-line rounded-xl p-3 leading-snug max-h-44 overflow-y-auto select-all">
                  {message}
                </pre>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-3.5 pt-3 border-t border-line flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsapp}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-pos hover:bg-pos/90 text-white font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Cobrar pelo WhatsApp</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
