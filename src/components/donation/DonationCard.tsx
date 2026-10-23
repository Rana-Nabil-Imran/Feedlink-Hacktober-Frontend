import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Donation, DonationStatus } from '../../types/donation';
import { UrgencyBadge } from './UrgencyBadge';
import { Badge } from '../ui/Badge';
import {
  MapPin,
  Clock,
  Package,
  Sparkles,
  Pencil,
  Trash2,
  Utensils,
  Leaf,
  Timer,
  ArrowUpRight,
  Building2,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

interface DonationCardProps {
  donation: Donation;
  onEdit?: (donation: Donation) => void;
  onDelete?: (donation: Donation) => void;
}

const statusConfig: Record<
  DonationStatus,
  {
    variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
    label: string;
    stepText: string;
    percent: number;
  }
> = {
  pending: { variant: 'default', label: 'Pending', stepText: 'Step 1/5: Submitted', percent: 20 },
  analyzing: { variant: 'info', label: 'Analyzing', stepText: 'Step 2/5: AI Analyzing', percent: 40 },
  matched: { variant: 'primary', label: 'Matched', stepText: 'Step 2/5: Matched', percent: 40 },
  available: { variant: 'primary', label: 'Available', stepText: 'Step 2/5: Available', percent: 40 },
  claimed: { variant: 'info', label: 'Claimed', stepText: 'Step 3/5: Claimed', percent: 60 },
  pickup_scheduled: { variant: 'warning', label: 'Pickup Ready', stepText: 'Step 3/5: Pickup Ready', percent: 60 },
  in_transit: { variant: 'warning', label: 'In Transit', stepText: 'Step 4/5: In Transit', percent: 80 },
  delivered: { variant: 'success', label: 'Delivered', stepText: 'Step 4/5: Delivered', percent: 85 },
  completed: { variant: 'success', label: 'Completed', stepText: 'Step 5/5: Completed', percent: 100 },
  expired: { variant: 'danger', label: 'Expired', stepText: 'Expired', percent: 0 },
  cancelled: { variant: 'danger', label: 'Cancelled', stepText: 'Cancelled', percent: 0 },
};

const categoryIconMap: Record<string, React.ReactNode> = {
  prepared_meals: <Utensils size={15} className="text-amber-600" />,
  fresh_produce: <Leaf size={15} className="text-emerald-600" />,
  packaged_goods: <Package size={15} className="text-blue-600" />,
  bakery: <Utensils size={15} className="text-orange-600" />,
  dairy: <Package size={15} className="text-indigo-600" />,
  beverages: <Utensils size={15} className="text-cyan-600" />,
  other: <Package size={15} className="text-gray-600" />,
};

const categoryBgMap: Record<string, string> = {
  prepared_meals: 'bg-amber-50 border-amber-100',
  fresh_produce: 'bg-emerald-50 border-emerald-100',
  packaged_goods: 'bg-blue-50 border-blue-100',
  bakery: 'bg-orange-50 border-orange-100',
  dairy: 'bg-indigo-50 border-indigo-100',
  beverages: 'bg-cyan-50 border-cyan-100',
  other: 'bg-gray-50 border-gray-100',
};

const categoryLabels: Record<string, string> = {
  prepared_meals: 'Prepared Meals',
  fresh_produce: 'Produce',
  packaged_goods: 'Packaged',
  bakery: 'Bakery',
  dairy: 'Dairy',
  beverages: 'Beverages',
  other: 'Other',
};

export const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const isRecommendedForMe = user?.role === 'ngo' && donation.matchedNgoId === user.id;
  const isOwner = (user?.role === 'donor' && user?.id === donation.donorId) || user?.role === 'admin';
  const canEdit = isOwner && !['claimed', 'pickup_scheduled', 'in_transit', 'delivered', 'completed'].includes(
    donation.status
  );
  const canDelete = isOwner && !['claimed', 'pickup_scheduled', 'in_transit'].includes(donation.status);
  const hasActions = Boolean((onEdit && canEdit) || (onDelete && canDelete));

  const statusMeta = statusConfig[donation.status] || statusConfig.pending;

  // Shelf life countdown calculation
  const expiryDate = new Date(donation.expiryDate);
  const isExpired = expiryDate.getTime() < Date.now();
  const hoursRemaining = Math.max(
    0,
    Math.round((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60))
  );

  const categoryIcon = categoryIconMap[donation.foodCategory] || <Package size={15} className="text-gray-600" />;
  const categoryBg = categoryBgMap[donation.foodCategory] || 'bg-gray-50 border-gray-100';
  const categoryLabel = categoryLabels[donation.foodCategory] || donation.foodCategory;

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-200/90 p-5 shadow-xs hover:shadow-xl hover:border-primary-300 hover:-translate-y-1 cursor-pointer transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
      onClick={() => navigate(`/donations/${donation.id}`)}
    >
      {/* Top Subtle Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top Header Row: Category on left, Badges & Actions on right */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${categoryBg}`}
              title={categoryLabel}
            >
              {categoryIcon}
            </div>
            <span className="text-xs font-semibold text-gray-600 truncate">
              {categoryLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <UrgencyBadge level={donation.urgencyLevel} size="sm" />
            <Badge variant={statusMeta.variant} size="sm" className="font-semibold">
              {statusMeta.label}
            </Badge>
          </div>
        </div>

        {/* Title & Donor Info (Full width, completely readable) */}
        <div className="mb-2.5">
          <h3 className="text-base font-bold text-gray-900 group-hover:text-primary-600 transition-colors leading-snug line-clamp-1">
            {donation.title}
          </h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
            <Building2 size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">Donated by <strong className="font-semibold text-gray-700">{donation.donorName}</strong></span>
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
          {donation.description || 'No additional description provided.'}
        </p>

        {/* Food Spec Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          {/* Quantity Chip */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-800">
            <Package size={12} className="text-primary-600" />
            <span>{donation.quantity}</span>
            <span className="text-gray-400 font-normal">{donation.unit}</span>
          </span>

          {/* City Chip */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600">
            <MapPin size={12} className="text-gray-400" />
            <span className="truncate max-w-[120px]">{donation.pickupCity}</span>
          </span>

          {/* Shelf Life / Expiry Chip */}
          {isExpired ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-700">
              <Timer size={12} />
              Expired
            </span>
          ) : hoursRemaining <= 12 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800">
              <Timer size={12} className="text-amber-600" />
              {hoursRemaining}h left
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-500">
              <Clock size={12} className="text-gray-400" />
              {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Progress Status Bar (for active donations) */}
        {!['expired', 'cancelled'].includes(donation.status) && (
          <div className="mb-3.5 pt-1">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-semibold text-gray-500 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    donation.status === 'completed'
                      ? 'bg-emerald-500'
                      : donation.status === 'in_transit'
                      ? 'bg-amber-500'
                      : 'bg-primary-500'
                  }`}
                />
                Progress
              </span>
              <span className="font-bold text-gray-700">{statusMeta.stepText}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  donation.status === 'completed'
                    ? 'bg-emerald-500'
                    : donation.status === 'in_transit'
                    ? 'bg-amber-500'
                    : 'bg-primary-500'
                }`}
                style={{ width: `${statusMeta.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        {/* Left: Details Button & Info */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-xs font-semibold text-primary-600 group-hover:text-primary-700 transition-colors flex items-center gap-1">
            Details
            <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>

          {/* Recommended for current NGO */}
          {isRecommendedForMe && ['pending', 'analyzing', 'matched'].includes(donation.status) && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0 animate-pulse">
              <Sparkles size={10} className="text-amber-600" /> Prioritized
            </span>
          )}

          {/* Match Score if present */}
          {donation.matchScore != null && donation.matchScore > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
              <Sparkles size={10} className="text-emerald-600" />
              {donation.matchScore}%
            </span>
          )}
        </div>

        {/* Right: 3-dots Menu for Donors */}
        {hasActions && (
          <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((prev) => !prev);
              }}
              className={`p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ${
                isMenuOpen ? 'bg-gray-100 text-gray-700' : ''
              }`}
              title="More options"
              aria-label="More options"
              aria-expanded={isMenuOpen}
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-1.5 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                {onEdit && canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit(donation);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50/70 flex items-center gap-2 transition-colors text-left"
                  >
                    <Pencil size={13} className="text-gray-400" />
                    <span>Edit</span>
                  </button>
                )}

                {onDelete && canDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      onDelete(donation);
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors text-left"
                  >
                    <Trash2 size={13} className="text-red-500" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
