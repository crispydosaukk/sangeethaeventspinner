'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import {
  DEFAULT_HERO_CONTENT,
  DEFAULT_FAQS,
  DEFAULT_HIGHLIGHT_METRICS,
  HeroContent,
  FaqItem,
  HeroTag,
  MetricItem,
} from '@/app/data/defaultContent';

interface WebsiteContentUIProps {
  onNotify?: (msg: string, type: 'success' | 'error') => void;
}

export default function WebsiteContentUI({ onNotify }: WebsiteContentUIProps) {
  const [activeTab, setActiveTab] = useState<'hero' | 'metrics' | 'faqs'>('hero');

  // Hero state
  const [hero, setHero] = useState<HeroContent>(DEFAULT_HERO_CONTENT);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Metrics state
  const [metrics, setMetrics] = useState<MetricItem[]>(DEFAULT_HIGHLIGHT_METRICS);
  const [isSavingMetrics, setIsSavingMetrics] = useState(false);

  // FAQs state
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [isSavingFaqs, setIsSavingFaqs] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Load from Firestore
  useEffect(() => {
    const unsubHero = onSnapshot(
      doc(db, 'site_data', 'hero_content'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setHero({
            badgeText: data.badgeText !== undefined ? data.badgeText : DEFAULT_HERO_CONTENT.badgeText,
            titleLine1: data.titleLine1 !== undefined ? data.titleLine1 : DEFAULT_HERO_CONTENT.titleLine1,
            titleHighlight: data.titleHighlight !== undefined ? data.titleHighlight : DEFAULT_HERO_CONTENT.titleHighlight,
            subtitle: data.subtitle !== undefined ? data.subtitle : DEFAULT_HERO_CONTENT.subtitle,
            tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : DEFAULT_HERO_CONTENT.tags,
            primaryBtnText: data.primaryBtnText !== undefined ? data.primaryBtnText : DEFAULT_HERO_CONTENT.primaryBtnText,
            secondaryBtnText: data.secondaryBtnText !== undefined ? data.secondaryBtnText : DEFAULT_HERO_CONTENT.secondaryBtnText,
          });
        }
      },
      (err) => console.warn('WebsiteContentUI hero notice:', err.message)
    );

    const unsubMetrics = onSnapshot(
      doc(db, 'site_data', 'highlight_metrics'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.metrics) && data.metrics.length > 0) {
            setMetrics(data.metrics);
          }
        }
      },
      (err) => console.warn('WebsiteContentUI highlight_metrics notice:', err.message)
    );

    const unsubFaqs = onSnapshot(
      doc(db, 'site_data', 'faqs'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.list) && data.list.length > 0) {
            setFaqs(data.list);
          }
        }
      },
      (err) => console.warn('WebsiteContentUI faqs notice:', err.message)
    );

    return () => {
      unsubHero();
      unsubMetrics();
      unsubFaqs();
    };
  }, []);

  // Save Hero
  const handleSaveHero = async () => {
    setIsSavingHero(true);
    try {
      await setDoc(doc(db, 'site_data', 'hero_content'), hero, { merge: true });
      if (onNotify) {
        onNotify('Hero section content updated successfully!', 'success');
      } else {
        alert('Hero section content updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving hero content:', err);
      if (onNotify) {
        onNotify('Failed to save hero content: ' + (err.message || String(err)), 'error');
      } else {
        alert('Failed to save hero content: ' + (err.message || String(err)));
      }
    } finally {
      setIsSavingHero(false);
    }
  };

  // Save Highlight Metrics
  const handleSaveMetrics = async () => {
    setIsSavingMetrics(true);
    try {
      await setDoc(doc(db, 'site_data', 'highlight_metrics'), { metrics }, { merge: true });
      if (onNotify) {
        onNotify('Highlight metrics updated successfully!', 'success');
      } else {
        alert('Highlight metrics updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving highlight metrics:', err);
      if (onNotify) {
        onNotify('Failed to save highlight metrics: ' + (err.message || String(err)), 'error');
      } else {
        alert('Failed to save highlight metrics: ' + (err.message || String(err)));
      }
    } finally {
      setIsSavingMetrics(false);
    }
  };

  const handleAddMetric = () => {
    setMetrics((prev) => [...prev, { value: '100+', label: 'New Metric' }]);
  };

  const handleUpdateMetric = (idx: number, field: 'value' | 'label', val: string) => {
    setMetrics((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleDeleteMetric = (idx: number) => {
    setMetrics((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveMetric = (idx: number, direction: 'up' | 'down') => {
    setMetrics((prev) => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleResetMetrics = () => {
    setConfirmModal({
      title: 'Reset Highlight Metrics',
      message: 'Are you sure you want to reset the metrics strip back to default values?',
      confirmLabel: 'Reset Defaults',
      isDanger: true,
      onConfirm: () => {
        setMetrics(DEFAULT_HIGHLIGHT_METRICS);
        setConfirmModal(null);
      },
    });
  };

  // Save FAQs
  const handleSaveFaqs = async () => {
    setIsSavingFaqs(true);
    try {
      await setDoc(doc(db, 'site_data', 'faqs'), { list: faqs }, { merge: true });
      if (onNotify) {
        onNotify('FAQs updated successfully on the website!', 'success');
      } else {
        alert('FAQs updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving FAQs:', err);
      if (onNotify) {
        onNotify('Failed to save FAQs: ' + (err.message || String(err)), 'error');
      } else {
        alert('Failed to save FAQs: ' + (err.message || String(err)));
      }
    } finally {
      setIsSavingFaqs(false);
    }
  };

  // Tag helpers
  const handleAddTag = () => {
    setHero((prev) => ({
      ...prev,
      tags: [...prev.tags, { icon: '✨', text: 'New Feature' }],
    }));
  };

  const handleUpdateTag = (idx: number, field: 'icon' | 'text', val: string) => {
    setHero((prev) => {
      const updated = [...prev.tags];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, tags: updated };
    });
  };

  const handleDeleteTag = (idx: number) => {
    setHero((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== idx),
    }));
  };

  // FAQ helpers
  const handleAddFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { question: 'New Question?', answer: 'Enter answer details here...' },
    ]);
  };

  const handleUpdateFaq = (idx: number, field: 'question' | 'answer', val: string) => {
    setFaqs((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleDeleteFaq = (idx: number) => {
    setConfirmModal({
      title: 'Delete FAQ Item',
      message: 'Are you sure you want to delete this FAQ item?',
      confirmLabel: 'Delete',
      isDanger: true,
      onConfirm: () => {
        setFaqs((prev) => prev.filter((_, i) => i !== idx));
        setConfirmModal(null);
      },
    });
  };

  const handleResetFaqs = () => {
    setConfirmModal({
      title: 'Reset All FAQs',
      message: 'Are you sure you want to reset all FAQs back to their default initial values?',
      confirmLabel: 'Reset Defaults',
      isDanger: true,
      onConfirm: () => {
        setFaqs(DEFAULT_FAQS);
        setConfirmModal(null);
      },
    });
  };

  const handleResetHero = () => {
    setConfirmModal({
      title: 'Reset Hero Content',
      message: 'Are you sure you want to reset hero content back to default values?',
      confirmLabel: 'Reset Defaults',
      isDanger: true,
      onConfirm: () => {
        setHero(DEFAULT_HERO_CONTENT);
        setConfirmModal(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Icon name="DocumentTextIcon" size={22} className="text-[#C62127]" />
            Website Dynamic Content Manager
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Update your homepage Hero section, Highlight Metrics strip, and FAQs in real-time. Changes appear immediately on the website.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('hero')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'hero'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>✨ Hero Section</span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>📊 Highlight Metrics</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {metrics.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'faqs'
                ? 'bg-white text-gray-900 shadow-sm font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>❓ FAQs Manager</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {faqs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: HERO SECTION ─── */}
      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Edit Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>Edit Hero Text &amp; CTAs</span>
              </h3>
              <button
                onClick={handleResetHero}
                className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                title="Reset to default text"
              >
                <Icon name="ArrowPathIcon" size={13} />
                <span>Reset Defaults</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Top Highlight Badge Text
                </label>
                <input
                  type="text"
                  value={hero.badgeText}
                  onChange={(e) => setHero({ ...hero, badgeText: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50"
                  placeholder="e.g. 100% PURE VEGETARIAN CATERING • PINNER & GREATER LONDON"
                />
              </div>

              {/* Title Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Main Headline (Line 1)
                </label>
                <input
                  type="text"
                  value={hero.titleLine1}
                  onChange={(e) => setHero({ ...hero, titleLine1: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50 font-semibold"
                  placeholder="e.g. Elevate Your Celebration With Authentic"
                />
              </div>

              {/* Title Highlight */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Highlighted Title (Line 2 / Gold Gradient)
                </label>
                <input
                  type="text"
                  value={hero.titleHighlight}
                  onChange={(e) => setHero({ ...hero, titleHighlight: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50 font-bold text-amber-700"
                  placeholder="e.g. Sangeetha Events"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Description / Subtitle Paragraph
                </label>
                <textarea
                  rows={3}
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-gray-50 leading-relaxed"
                  placeholder="Enter welcoming description..."
                />
              </div>

              {/* Feature Tags */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Feature Pill Badges ({hero.tags.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                  >
                    <Icon name="PlusCircleIcon" size={14} />
                    <span>Add Badge</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {hero.tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tag.icon}
                        onChange={(e) => handleUpdateTag(idx, 'icon', e.target.value)}
                        className="w-12 text-center border border-gray-200 rounded-xl px-2 py-2 text-sm bg-gray-50 focus:outline-none focus:border-emerald-500"
                        placeholder="✨"
                      />
                      <input
                        type="text"
                        value={tag.text}
                        onChange={(e) => handleUpdateTag(idx, 'text', e.target.value)}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:border-emerald-500"
                        placeholder="Badge text..."
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(idx)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete Badge"
                      >
                        <Icon name="TrashIcon" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={hero.primaryBtnText}
                    onChange={(e) => setHero({ ...hero, primaryBtnText: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-500"
                    placeholder="Explore Packages"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={hero.secondaryBtnText}
                    onChange={(e) => setHero({ ...hero, secondaryBtnText: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:border-emerald-500"
                    placeholder="Instant Enquiry Form"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={handleSaveHero}
                disabled={isSavingHero}
                className="text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
              >
                {isSavingHero ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Saving Hero...</span>
                  </>
                ) : (
                  <>
                    <Icon name="CloudArrowUpIcon" size={16} />
                    <span>Save Hero Section</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#070F0A] text-white rounded-2xl p-6 border border-emerald-950/60 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                  Live Preview
                </span>
                <span className="text-[10px] text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
                  Homepage Hero
                </span>
              </div>

              {/* Preview Content */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>{hero.badgeText || 'Badge text...'}</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                  {hero.titleLine1 || 'Main Title'}{' '}
                  <span className="text-amber-400 font-display block">
                    {hero.titleHighlight || 'Highlighted Brand'}
                  </span>
                </h1>

                <p className="text-xs text-gray-300 leading-relaxed line-clamp-4">
                  {hero.subtitle || 'Description text...'}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hero.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-[11px] bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1"
                    >
                      <span>{tag.icon}</span> <span>{tag.text}</span>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <div
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1"
                    style={{ background: 'linear-gradient(135deg, #C62127, #06874D)' }}
                  >
                    <span>{hero.primaryBtnText}</span>
                    <Icon name="ArrowDownIcon" size={12} />
                  </div>
                  <div className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-gray-300 border border-white/20 bg-white/5 flex items-center gap-1">
                    <span>{hero.secondaryBtnText}</span>
                    <Icon name="CalendarDaysIcon" size={12} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
              <Icon name="InformationCircleIcon" size={18} className="text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Real-Time Cloud Synchronization</p>
                <p className="text-emerald-800/80">
                  When you click <strong>Save Hero Section</strong>, changes are stored in Firestore under <code className="bg-emerald-100 px-1 rounded">site_data/hero_content</code> and reflect live for any visiting customer.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: HIGHLIGHT METRICS STRIP MANAGER ─── */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Live Preview Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Icon name="EyeIcon" size={16} className="text-[#06874D]" />
                  <span>Live Preview (Homepage Metrics Strip)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  This preview renders in real-time exactly as customers see it below the booking enquiry form.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                {metrics.length} Cards Active
              </span>
            </div>

            <div className="py-6 px-4 rounded-2xl border border-emerald-900/10 bg-[#E6EFEA]">
              <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {metrics.map((stat, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/90 border border-emerald-200/70 shadow-xs">
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#06874D]">{stat.value || '0'}</div>
                    <div className="text-xs text-gray-800 font-bold mt-1">{stat.label || 'Metric Label'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cards Editor */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Manage Highlight Metric Cards
                </h3>
                <p className="text-xs text-gray-500">
                  Edit numbers, percentages, ratings, and labels displayed in the highlight bar.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetMetrics}
                  className="text-xs text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="ArrowPathIcon" size={13} />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddMetric}
                  className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="PlusCircleIcon" size={14} />
                  <span>Add Metric Card</span>
                </button>
              </div>
            </div>

            {/* Metric Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-all space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Card #{idx + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveMetric(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400"
                        title="Move Left/Up"
                      >
                        <Icon name="ArrowUpIcon" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveMetric(idx, 'down')}
                        disabled={idx === metrics.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-400"
                        title="Move Right/Down"
                      >
                        <Icon name="ArrowDownIcon" size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMetric(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-1"
                        title="Delete Card"
                      >
                        <Icon name="TrashIcon" size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        Display Value (e.g. 500+, 4.9 ★, 100%)
                      </label>
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                        placeholder="500+"
                        className="w-full text-sm font-extrabold text-[#06874D] bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#06874D]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        Description / Label
                      </label>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleUpdateMetric(idx, 'label', e.target.value)}
                        placeholder="Celebrations Hosted"
                        className="w-full text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#06874D]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Save Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Saving will instantly update the metrics strip on your live homepage.
              </p>
              <button
                type="button"
                onClick={handleSaveMetrics}
                disabled={isSavingMetrics}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #06874D 0%, #046238 100%)' }}
              >
                {isSavingMetrics ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Saving Metrics...</span>
                  </>
                ) : (
                  <>
                    <Icon name="CloudArrowUpIcon" size={16} />
                    <span>Save Highlight Metrics</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: FAQS MANAGER ─── */}
      {activeTab === 'faqs' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Frequently Asked Questions ({faqs.length})
              </h3>
              <p className="text-xs text-gray-500">
                Add, edit, or remove FAQ items displayed in the accordion on the homepage.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFaqs}
                className="text-xs text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 transition-colors flex items-center gap-1"
              >
                <Icon name="ArrowPathIcon" size={13} />
                <span>Reset Defaults</span>
              </button>

              <button
                type="button"
                onClick={handleAddFaq}
                className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <Icon name="PlusCircleIcon" size={14} />
                <span>Add FAQ</span>
              </button>

              <button
                onClick={handleSaveFaqs}
                disabled={isSavingFaqs}
                className="text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #C62127 0%, #06874D 100%)' }}
              >
                {isSavingFaqs ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Icon name="CloudArrowUpIcon" size={15} />
                    <span>Save All FAQs</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* FAQs List */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 hover:bg-gray-50 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                      className="w-full font-semibold text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-emerald-500"
                      placeholder="Enter question..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(idx)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete FAQ"
                  >
                    <Icon name="TrashIcon" size={16} />
                  </button>
                </div>

                <div className="pl-8">
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                    className="w-full text-xs text-gray-700 leading-relaxed border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-emerald-500"
                    placeholder="Enter detailed answer..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Save bar */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddFaq}
              className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Icon name="PlusCircleIcon" size={16} />
              <span>Add Another Question</span>
            </button>

            <button
              onClick={handleSaveFaqs}
              disabled={isSavingFaqs}
              className="text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #C62127 0%, #D82D34 45%, #06874D 100%)' }}
            >
              {isSavingFaqs ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Saving FAQs...</span>
                </>
              ) : (
                <>
                  <Icon name="CloudArrowUpIcon" size={16} />
                  <span>Save All FAQs</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── CENTERED CONFIRMATION MODAL ─── */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.isDanger ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
              <Icon name={confirmModal.isDanger ? 'TrashIcon' : 'ArrowPathIcon'} size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{confirmModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm cursor-pointer ${
                  confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
