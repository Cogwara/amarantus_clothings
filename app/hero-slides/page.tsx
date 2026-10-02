'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ImageUpload } from '@/components/ui/image-upload';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  ArrowRight,
  MoveUp,
  MoveDown,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Palette,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import { HeroSlide } from '@/lib/types';

const GRADIENT_PRESETS: Record<
  string,
  { name: string; bgClass: string; borderClass: string; accentColor: string }
> = {
  emerald: {
    name: 'Forest Emerald',
    bgClass: 'bg-gradient-to-r from-[#07381C] via-[#0D5C2E] to-[#0A4723]',
    borderClass: 'border-[#16803C]',
    accentColor: '#FFDC73',
  },
  sunset: {
    name: 'Amber Sunset',
    bgClass: 'bg-gradient-to-r from-[#7C2D12] via-[#B45309] to-[#9A3412]',
    borderClass: 'border-[#EA580C]',
    accentColor: '#FEF08A',
  },
  midnight: {
    name: 'Midnight Sapphire',
    bgClass: 'bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#172554]',
    borderClass: 'border-[#2563EB]',
    accentColor: '#93C5FD',
  },
  ruby: {
    name: 'Ruby Crimson',
    bgClass: 'bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#4C0519]',
    borderClass: 'border-[#E11D48]',
    accentColor: '#FECDD3',
  },
  royal: {
    name: 'Royal Purple',
    bgClass: 'bg-gradient-to-r from-[#3B0764] via-[#581C87] to-[#2E1065]',
    borderClass: 'border-[#9333EA]',
    accentColor: '#E9D5FF',
  },
};

const LINK_SUGGESTIONS = [
  { label: 'All Catalog (#catalog)', value: '#catalog' },
  { label: 'Clearance Deals (/clearance)', value: '/clearance' },
  { label: 'Thursday Drops (/thursday-plan)', value: '/thursday-plan' },
  { label: 'Contact / Inquiry (#contact)', value: '#contact' },
];

export default function HeroSlidesPage() {
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [slides, setSlides] = React.useState<HeroSlide[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [previewSlideIdx, setPreviewSlideIdx] = React.useState(0);

  // Form / Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSlide, setEditingSlide] = React.useState<HeroSlide | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  // Form Fields
  const [formTitle, setFormTitle] = React.useState('');
  const [formSubtitle, setFormSubtitle] = React.useState('');
  const [formTagline, setFormTagline] = React.useState('');
  const [formButtonText, setFormButtonText] = React.useState('Shop Now');
  const [formButtonLink, setFormButtonLink] = React.useState('#catalog');
  const [formImageUrl, setFormImageUrl] = React.useState('');
  const [formImageLayout, setFormImageLayout] = React.useState<'full' | 'split'>('full');
  const [formBgGradient, setFormBgGradient] = React.useState('emerald');
  const [formDisplayOrder, setFormDisplayOrder] = React.useState(1);
  const [formIsActive, setFormIsActive] = React.useState(true);

  // Delete confirmation modal
  const [slideToDelete, setSlideToDelete] = React.useState<HeroSlide | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [userRes, slidesRes] = await Promise.all([
        fetch('/api/auth/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/hero-slides').then((r) => (r.ok ? r.json() : null)),
      ]);

      if (userRes?.user) setCurrentUser(userRes.user);
      if (slidesRes?.slides) {
        setSlides(slidesRes.slides);
      }
    } catch (err: any) {
      console.error('Failed to load slides', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Open modal for new slide
  const handleOpenCreate = () => {
    setEditingSlide(null);
    setFormTitle('');
    setFormSubtitle('Up to 40% off • UK Grade A Thrift');
    setFormTagline('★ • FRESH DROP •');
    setFormButtonText('Shop Now');
    setFormButtonLink('#catalog');
    setFormImageUrl(
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
    );
    setFormImageLayout('full');
    setFormBgGradient('emerald');
    setFormDisplayOrder(slides.length + 1);
    setFormIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormTitle(slide.title);
    setFormSubtitle(slide.subtitle || '');
    setFormTagline(slide.tagline || '');
    setFormButtonText(slide.buttonText || 'Shop Now');
    setFormButtonLink(slide.buttonLink || '#catalog');
    setFormImageUrl(slide.imageUrl || '');
    setFormImageLayout((slide.imageLayout as 'full' | 'split') || 'full');
    setFormBgGradient(slide.bgGradient || 'emerald');
    setFormDisplayOrder(slide.displayOrder);
    setFormIsActive(slide.isActive);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Save slide (POST or PUT)
  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMsg('Please enter a headline for the slide.');
      return;
    }
    if (!formButtonLink.trim()) {
      setErrorMsg('Please specify a link for the call-to-action button.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || null,
        tagline: formTagline.trim() || null,
        buttonText: formButtonText.trim() || 'Shop Now',
        buttonLink: formButtonLink.trim() || '#catalog',
        imageUrl: formImageUrl.trim() || null,
        imageLayout: formImageLayout,
        bgGradient: formBgGradient,
        displayOrder: Number(formDisplayOrder) || 0,
        isActive: formIsActive,
      };

      const url = editingSlide
        ? `/api/hero-slides/${editingSlide.id}`
        : '/api/hero-slides';
      const method = editingSlide ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save slide');
      }

      setSuccessMsg(
        editingSlide ? 'Slide updated successfully!' : 'New hero slide added!'
      );
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving slide');
    } finally {
      setSaving(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      const res = await fetch(`/api/hero-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error toggling slide status', err);
    }
  };

  // Reorder slide (move up / down)
  const handleReorder = async (slide: HeroSlide, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex((s) => s.id === slide.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const targetSlide = slides[targetIndex];
    try {
      await Promise.all([
        fetch(`/api/hero-slides/${slide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: targetSlide.displayOrder }),
        }),
        fetch(`/api/hero-slides/${targetSlide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayOrder: slide.displayOrder }),
        }),
      ]);
      loadData();
    } catch (err) {
      console.error('Error reordering slides', err);
    }
  };

  // Delete slide
  const handleDeleteConfirm = async () => {
    if (!slideToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hero-slides/${slideToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSlideToDelete(null);
        loadData();
      }
    } finally {
      setDeleting(false);
    }
  };

  const activeSlides = slides.filter((s) => s.isActive);
  const currentPreview = activeSlides[previewSlideIdx] || slides[0];

  return (
    <AppShell
      user={currentUser}
      title="Storefront Hero Slides"
      subtitle="Add, edit, reorder, and link hero promotional carousel banners on your public storefront"
    >
      <div className="space-y-6">
        {/* Top Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[12px] border border-[#DDE5DF] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-[#17211B]">
                Hero Banner Carousel
              </span>
              <Badge variant="green">
                {activeSlides.length} Active / {slides.length} Total
              </Badge>
            </div>
            <p className="text-xs text-[#66736B] mt-1">
              Slides rotate automatically on the home page hero section. Each slide has its own image, headline, badges, and action link.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-[#F4F7F5] hover:bg-[#EAEFEA] text-[#17211B] text-xs font-semibold transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Button
              variant="primary"
              size="md"
              onClick={handleOpenCreate}
              className="shadow-sm font-bold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add New Slide</span>
            </Button>
          </div>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-[#EAF7EE] border border-[#C5E9CE] rounded-[10px] flex items-center gap-2 text-xs font-bold text-[#16803C] animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Live Preview of Active Slides Carousel */}
        {currentPreview && (
          <Card className="border-[#DDE5DF] overflow-hidden shadow-sm">
            <CardHeader className="bg-[#F8FAF9] border-b border-[#F0F4F1] py-3 px-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F28C28]" />
                <CardTitle className="text-sm font-bold text-[#17211B]">
                  Live Storefront Banner Preview
                </CardTitle>
                <span className="text-xs text-[#66736B]">
                  (Slide {previewSlideIdx + 1} of {Math.max(activeSlides.length, 1)})
                </span>
              </div>

              {/* Prev / Next controls for preview */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewSlideIdx((prev) =>
                      prev > 0 ? prev - 1 : activeSlides.length - 1
                    )
                  }
                  className="p-1 rounded bg-white hover:bg-gray-100 text-[#17211B] shadow-xs"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewSlideIdx((prev) =>
                      prev < activeSlides.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="p-1 rounded bg-white hover:bg-gray-100 text-[#17211B] shadow-xs"
                  title="Next Slide"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 bg-[#F8FAF9]">
              {/* The Banner Container mirroring Storefront style */}
              <div
                className={`relative rounded-[16px] overflow-hidden text-white shadow-xl min-h-[260px] sm:min-h-[340px] flex items-center border ${
                  GRADIENT_PRESETS[currentPreview.bgGradient]?.bgClass ||
                  GRADIENT_PRESETS.emerald.bgClass
                } ${
                  GRADIENT_PRESETS[currentPreview.bgGradient]?.borderClass ||
                  GRADIENT_PRESETS.emerald.borderClass
                }`}
              >
                {/* 100% Background Image when imageLayout is 'full' or default */}
                {currentPreview.imageUrl && currentPreview.imageLayout !== 'split' && (
                  <div className="absolute inset-0 z-0">
                    <img
                      src={currentPreview.imageUrl}
                      alt={currentPreview.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Rich dark gradient overlay ensuring 100% contrast for all text */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />
                  </div>
                )}

                {/* Subtle Background Pattern Accent */}
                <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 w-full p-4 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left Content */}
                  <div className="max-w-xl space-y-3 text-center md:text-left">
                    {/* Tagline */}
                    {currentPreview.tagline && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-white/90">
                        <span className="text-[#F28C28]">★</span>
                        <span>{currentPreview.tagline}</span>
                      </div>
                    )}

                    {/* Headline */}
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white whitespace-pre-line drop-shadow-sm">
                      {currentPreview.title}
                    </h2>

                    {/* Subtitle / Offer Pill */}
                    {currentPreview.subtitle && (
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-[#17211B] shadow">
                          <span className="text-xs sm:text-sm font-black text-[#16803C]">
                            {currentPreview.subtitle}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* CTA Button with Link */}
                    <div className="pt-2 flex items-center justify-center md:justify-start gap-3">
                      <a
                        href={currentPreview.buttonLink}
                        target={
                          currentPreview.buttonLink.startsWith('http')
                            ? '_blank'
                            : '_self'
                        }
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-white hover:text-[#FFDC73] transition-colors group"
                      >
                        <span className="underline underline-offset-4 decoration-2">
                          {currentPreview.buttonText}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </a>

                      <span className="text-[11px] bg-black/50 text-white/90 px-2 py-0.5 rounded font-mono">
                        Target: {currentPreview.buttonLink}
                      </span>
                    </div>
                  </div>

                  {/* Right Image Graphic (Only when split mode is selected) */}
                  {currentPreview.imageUrl && currentPreview.imageLayout === 'split' && (
                    <div className="relative w-full md:w-1/2 flex justify-center items-center">
                      <div className="relative w-full max-w-sm sm:max-w-md aspect-[4/3] rounded-[14px] overflow-hidden shadow-2xl border-4 border-white/20">
                        <img
                          src={currentPreview.imageUrl}
                          alt={currentPreview.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Slides Management List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-[#17211B]">
              Configured Carousel Slides ({slides.length})
            </h3>
            <span className="text-xs text-[#66736B]">
              Use arrows to adjust display order. Inactive slides are hidden from the store.
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-white rounded-[12px] border border-[#DDE5DF] animate-pulse"
                />
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[12px] border border-dashed border-[#DDE5DF] space-y-3">
              <Sparkles className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-[#17211B]">
                No hero slides created yet
              </p>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1" />
                Add First Slide
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide, idx) => {
                const gradientInfo =
                  GRADIENT_PRESETS[slide.bgGradient] || GRADIENT_PRESETS.emerald;

                return (
                  <div
                    key={slide.id}
                    className={`bg-white rounded-[14px] border p-4 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      slide.isActive
                        ? 'border-[#DDE5DF] hover:border-[#16803C]'
                        : 'border-gray-200 opacity-60 bg-gray-50'
                    }`}
                  >
                    {/* Left: Order, Thumbnail, Details */}
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                      {/* Order Controls */}
                      <div className="flex flex-col items-center justify-center gap-1 bg-[#F8FAF9] p-1 rounded-[8px] border border-[#EBEFEA] shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorder(slide, 'up')}
                          className="p-1 text-[#66736B] hover:text-[#16803C] disabled:opacity-30 disabled:hover:text-[#66736B]"
                          title="Move Up"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] font-black text-[#17211B] px-1">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === slides.length - 1}
                          onClick={() => handleReorder(slide, 'down')}
                          className="p-1 text-[#66736B] hover:text-[#16803C] disabled:opacity-30 disabled:hover:text-[#66736B]"
                          title="Move Down"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Thumbnail or Color swatch */}
                      <div
                        className={`w-16 h-16 rounded-[10px] overflow-hidden shrink-0 border relative flex items-center justify-center ${gradientInfo.bgClass}`}
                      >
                        {slide.imageUrl ? (
                          <img
                            src={slide.imageUrl}
                            alt={slide.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-white/50" />
                        )}
                      </div>

                      {/* Slide Information */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              slide.isActive
                                ? 'bg-[#EAF7EE] text-[#16803C]'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {slide.isActive ? 'Active on Store' : 'Hidden'}
                          </span>
                          <span className="text-[10px] font-semibold text-[#8A968F] uppercase">
                            Theme: {gradientInfo.name}
                          </span>
                          {slide.tagline && (
                            <span className="text-[10px] font-bold text-[#D96F0B] truncate max-w-xs">
                              {slide.tagline}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-[#17211B] line-clamp-1">
                          {slide.title}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-[#66736B] flex-wrap">
                          {slide.subtitle && (
                            <span className="truncate max-w-xs">
                              {slide.subtitle}
                            </span>
                          )}

                          <div className="flex items-center gap-1 text-[#16803C] font-semibold">
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="font-mono text-[11px] truncate max-w-[200px]">
                              {slide.buttonLink} ({slide.buttonText})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0F4F1]">
                      {/* Toggle Active Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(slide)}
                        title={slide.isActive ? 'Hide slide' : 'Show slide'}
                        className="text-xs"
                      >
                        {slide.isActive ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 mr-1 text-[#66736B]" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 mr-1 text-[#16803C]" />
                            <span>Show</span>
                          </>
                        )}
                      </Button>

                      {/* Edit Button */}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEdit(slide)}
                        className="text-xs font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setSlideToDelete(slide)}
                        className="text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Slide Edit & Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Edit Hero Banner Slide' : 'Add New Hero Banner Slide'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveSlide} className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[10px] flex items-center gap-2 text-xs font-bold text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Headline / Title */}
          <div>
            <label className="block text-xs font-bold text-[#17211B] mb-1">
              Slide Headline / Title *
            </label>
            <Input
              type="text"
              placeholder="e.g. Celebrate Nigeria, Celebrate Savings"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              className="text-sm"
            />
            <p className="text-[11px] text-[#8A968F] mt-1">
              Tip: Use a comma or line break to create a dynamic multi-line headline.
            </p>
          </div>

          {/* Tagline & Subtitle Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1">
                Tagline / Kicker Badge
              </label>
              <Input
                type="text"
                placeholder="e.g. ★ • NAIJA WE DEY FOR YOU •"
                value={formTagline}
                onChange={(e) => setFormTagline(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1">
                Subtitle / Discount Pill
              </label>
              <Input
                type="text"
                placeholder="e.g. Up to 40% off • UK Grade A Thrift"
                value={formSubtitle}
                onChange={(e) => setFormSubtitle(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Button Text & Target Link Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1">
                Button Text *
              </label>
              <Input
                type="text"
                placeholder="e.g. Shop Now"
                value={formButtonText}
                onChange={(e) => setFormButtonText(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1">
                Action Link (URL or Page Anchor) *
              </label>
              <Input
                type="text"
                placeholder="e.g. #catalog, /clearance, or https://..."
                value={formButtonLink}
                onChange={(e) => setFormButtonLink(e.target.value)}
                required
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Quick Link Helper Presets */}
          <div>
            <span className="text-[11px] font-bold text-[#66736B] block mb-1.5">
              Quick Link Shortcuts:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {LINK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug.value}
                  type="button"
                  onClick={() => setFormButtonLink(sug.value)}
                  className={`text-[11px] px-2.5 py-1 rounded-[6px] border transition-all ${
                    formButtonLink === sug.value
                      ? 'bg-[#16803C] text-white border-[#16803C] font-bold'
                      : 'bg-[#F8FAF9] text-[#17211B] border-[#DDE5DF] hover:bg-[#EAF7EE]'
                  }`}
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-[#17211B] mb-1.5">
              Background Color Gradient Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {Object.entries(GRADIENT_PRESETS).map(([key, info]) => {
                const isSelected = formBgGradient === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormBgGradient(key)}
                    className={`p-2.5 rounded-[10px] text-left text-white border transition-all flex flex-col justify-between h-16 ${
                      info.bgClass
                    } ${
                      isSelected
                        ? 'ring-2 ring-[#16803C] ring-offset-2 scale-102 font-bold shadow-md'
                        : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{info.name}</span>
                    {isSelected && (
                      <span className="text-[10px] self-end bg-white/20 px-1 rounded">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slide Fashion Image Upload & URL */}
          <div className="space-y-3 pt-1 border-t border-[#F0F4F1]">
            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1.5">
                Image Display Mode (100% Full Banner or Split Card)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormImageLayout('full')}
                  className={`p-3 rounded-[10px] border text-left transition-all ${
                    formImageLayout === 'full'
                      ? 'border-[#16803C] bg-[#EAF7EE] text-[#16803C] shadow-xs'
                      : 'border-[#DDE5DF] bg-[#F8FAF9] text-[#17211B] hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>100% Full Hero Banner</span>
                    {formImageLayout === 'full' && (
                      <span className="text-[10px] bg-[#16803C] text-white px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#66736B] mt-1 font-normal">
                    Image covers 100% of the entire banner with a gradient overlay so headline & buttons pop.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormImageLayout('split')}
                  className={`p-3 rounded-[10px] border text-left transition-all ${
                    formImageLayout === 'split'
                      ? 'border-[#16803C] bg-[#EAF7EE] text-[#16803C] shadow-xs'
                      : 'border-[#DDE5DF] bg-[#F8FAF9] text-[#17211B] hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Side Column Card</span>
                    {formImageLayout === 'split' && (
                      <span className="text-[10px] bg-[#16803C] text-white px-1.5 py-0.5 rounded font-bold">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#66736B] mt-1 font-normal">
                    Image displays as a dedicated high-resolution card next to the headline text.
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1">
                Promotional Fashion Image (Upload or Paste URL)
              </label>
              <ImageUpload
                label="Promotional Slide Image"
                value={formImageUrl}
                onChange={(url) => setFormImageUrl(url)}
              />
            </div>
          </div>

          {/* Status & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#F0F4F1]">
            <div>
              <label className="block text-xs font-bold text-[#17211B] mb-1">
                Display Order Sequence
              </label>
              <Input
                type="number"
                min={1}
                value={formDisplayOrder}
                onChange={(e) => setFormDisplayOrder(Number(e.target.value) || 1)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#16803C] rounded border-[#DDE5DF] focus:ring-[#16803C]"
                />
                <span className="text-xs font-bold text-[#17211B]">
                  Active (Show on Storefront)
                </span>
              </label>
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F4F1]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={saving}
              className="font-bold min-w-[120px]"
            >
              {saving ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(slideToDelete)}
        onClose={() => setSlideToDelete(null)}
        title="Delete Hero Slide"
        maxWidth="sm"
      >
        {slideToDelete && (
          <div className="p-4 sm:p-5 space-y-4">
            <p className="text-xs text-[#17211B]">
              Are you sure you want to remove the slide{' '}
              <strong className="text-[#DC2626]">&quot;{slideToDelete.title}&quot;</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSlideToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Slide'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
