import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Compass,
} from 'lucide-react';
import {
  NEPAL_LOCATION_HIERARCHY,
  ProvinceInfo,
  DistrictInfo,
  MunicipalityInfo,
  matchProvince,
  matchDistrict,
  matchMunicipality,
} from '../../data/nepalLocations';
import { ShippingAddress } from '../../types';

interface DynamicLocationSelectorProps {
  value: ShippingAddress;
  onChange: (updated: ShippingAddress) => void;
  errors?: Partial<ShippingAddress>;
  language: 'en' | 'np';
}

export const DynamicLocationSelector: React.FC<DynamicLocationSelectorProps> = ({
  value,
  onChange,
  errors = {},
  language,
}) => {
  // Find current selection objects
  const selectedProvince = NEPAL_LOCATION_HIERARCHY.find(
    (p) => p.name === value.province || p.nameNp === value.province || p.id === value.province?.toLowerCase()
  ) || NEPAL_LOCATION_HIERARCHY.find((p) => p.id === 'bagmati')!;

  const selectedDistrict = selectedProvince.districts.find(
    (d) => d.name === value.district || d.nameNp === value.district
  ) || selectedProvince.districts[0];

  const selectedMunicipality = selectedDistrict?.municipalities.find(
    (m) => m.name === value.municipality || m.nameNp === value.municipality
  ) || selectedDistrict?.municipalities[0];

  const currentWard = value.ward || '';
  const currentTole = value.tole || '';
  const currentLandmark = value.landmark || '';

  // Geolocation & reverse geocoding states
  const [isLocating, setIsLocating] = useState(false);
  const [showApproxModal, setShowApproxModal] = useState(false);
  const [approxAccuracy, setApproxAccuracy] = useState<number | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [autoFilledNotice, setAutoFilledNotice] = useState<string | null>(null);
  const landmarkInputRef = useRef<HTMLInputElement>(null);

  // Sync formatted addressLine whenever individual parts update
  const syncFullAddress = (parts: {
    province?: string;
    district?: string;
    municipality?: string;
    ward?: string;
    tole?: string;
    landmark?: string;
    city?: string;
    coordinates?: { lat: number; lng: number; accuracy?: number };
    mapUrl?: string;
  }) => {
    const p = parts.province ?? value.province ?? selectedProvince.name;
    const d = parts.district ?? value.district ?? selectedDistrict?.name ?? '';
    const m = parts.municipality ?? value.municipality ?? selectedMunicipality?.name ?? '';
    const w = parts.ward ?? value.ward ?? '';
    const t = parts.tole ?? value.tole ?? '';
    const l = parts.landmark ?? value.landmark ?? '';

    const wardText = w ? `Ward ${w}` : '';
    const lineComponents = [t, l ? `(Landmark: ${l})` : '', wardText, m, d].filter(Boolean);
    const generatedAddressLine = lineComponents.join(', ');

    onChange({
      ...value,
      ...parts,
      province: p,
      district: d,
      municipality: m,
      city: d || m || value.city || 'Chitwan',
      ward: w,
      tole: t,
      landmark: l,
      addressLine: generatedAddressLine || value.addressLine,
    });
  };

  // Helper for selecting province
  const handleSelectProvince = (prov: ProvinceInfo) => {
    const defaultDistrict = prov.districts[0];
    const defaultMunicipality = defaultDistrict?.municipalities[0];
    syncFullAddress({
      province: prov.name,
      district: defaultDistrict?.name || '',
      municipality: defaultMunicipality?.name || '',
      ward: '',
      tole: '',
    });
  };

  // Helper for selecting district
  const handleSelectDistrict = (dist: DistrictInfo) => {
    const defaultMunicipality = dist.municipalities[0];
    syncFullAddress({
      district: dist.name,
      municipality: defaultMunicipality?.name || '',
      ward: '',
      tole: '',
    });
  };

  // Helper for selecting municipality
  const handleSelectMunicipality = (muni: MunicipalityInfo) => {
    syncFullAddress({
      municipality: muni.name,
      ward: '',
      tole: '',
    });
  };

  // Reverse geocode OpenStreetMap and auto-populate
  const applyCoordinatesAndReverseGeocode = async (
    lat: number,
    lng: number,
    accuracy: number
  ) => {
    setIsLocating(true);
    setAutoFilledNotice(null);

    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en,np`
      );
      if (!res.ok) throw new Error('Geocoding failed');
      const data = await res.json();
      const addr = data.address || {};

      // Match province
      const matchedProv =
        matchProvince(addr.state || '') ||
        matchProvince(addr.province || '') ||
        selectedProvince;

      // Match district
      const matchedDist =
        matchDistrict(matchedProv, addr.county || '') ||
        matchDistrict(matchedProv, addr.district || '') ||
        matchDistrict(matchedProv, addr.city || '') ||
        matchedProv.districts[0];

      // Match municipality
      const matchedMuni =
        matchMunicipality(matchedDist, addr.city || '') ||
        matchMunicipality(matchedDist, addr.municipality || '') ||
        matchMunicipality(matchedDist, addr.town || '') ||
        matchMunicipality(matchedDist, addr.suburb || '') ||
        matchedDist.municipalities[0];

      // Extract ward if available in suburb / quarter / neighbourhood
      let detectedWard = '';
      const wardSearchText = `${addr.suburb || ''} ${addr.neighbourhood || ''} ${addr.quarter || ''} ${data.display_name || ''}`;
      const wardMatch = wardSearchText.match(/(?:ward|woda|वडा|ward no|ward-)\s*(\d{1,2})/i);
      if (wardMatch) {
        detectedWard = wardMatch[1];
      }

      // Extract Tole / Road
      const detectedTole =
        addr.road ||
        addr.neighbourhood ||
        addr.suburb ||
        addr.pedestrian ||
        (matchedMuni.popularToles && matchedMuni.popularToles[0]) ||
        '';

      syncFullAddress({
        province: matchedProv.name,
        district: matchedDist.name,
        municipality: matchedMuni.name,
        ward: detectedWard || value.ward,
        tole: detectedTole || value.tole,
        coordinates: { lat, lng, accuracy },
        mapUrl,
      });

      setAutoFilledNotice(
        language === 'np'
          ? `📍 GPS बाट ${matchedProv.nameNp} → ${matchedDist.nameNp} → ${matchedMuni.nameNp} ${detectedWard ? `(वडा नं. ${detectedWard})` : ''} स्वतः छनोट भयो!`
          : `📍 GPS auto-configured: ${matchedProv.name} → ${matchedDist.name} → ${matchedMuni.name} ${detectedWard ? `(Ward ${detectedWard})` : ''}`
      );

      // Focus landmark input after short delay
      setTimeout(() => {
        landmarkInputRef.current?.focus();
      }, 400);
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
      // Fallback: still store coordinates and mapUrl
      syncFullAddress({
        coordinates: { lat, lng, accuracy },
        mapUrl,
      });
      setAutoFilledNotice(
        language === 'np'
          ? '📍 तपाईंको सटीक GPS पिन सुरक्षित भयो! तलको ठेगाना फारम पुष्टि गर्नुहोस्।'
          : '📍 GPS coordinates locked! Please confirm your address details below.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  // Main Current Location Trigger
  const handleRequestCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(
        language === 'np'
          ? 'तपाईंको ब्राउजरमा GPS लोकेसन सुविधा उपलब्ध छैन।'
          : 'Geolocation is not supported by your browser.'
      );
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // If accuracy is worse than 120 meters, it's considered approximate
        if (accuracy > 120) {
          setIsLocating(false);
          setApproxAccuracy(Math.round(accuracy));
          setPendingCoords({ lat, lng, accuracy });
          setShowApproxModal(true);
          return;
        }

        // Exact location confirmed!
        applyCoordinatesAndReverseGeocode(lat, lng, accuracy);
      },
      (err) => {
        setIsLocating(false);
        let msg =
          language === 'np'
            ? 'लोकेसन पत्ता लगाउन सकिएन। कृपया आफ्नो डिभाइसमा लोकेसन (GPS) अन गरी ब्राउजरलाई अनुमति दिनुहोस्।'
            : 'Could not access GPS location. Please enable location permissions in your browser.';
        if (err.code === err.PERMISSION_DENIED) {
          msg =
            language === 'np'
              ? 'लोकेसन अनुमति अस्वीकृत गरियो। कृपया ब्राउजर सेटिङबाट Location Access ON गर्नुहोस्।'
              : 'Location permission denied. Please allow location access in your browser settings.';
        }
        alert(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const inputStyle = (hasError?: string) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: `1.5px solid ${hasError ? '#DC2626' : '#EADCCE'}`,
    fontFamily: 'Inter, sans-serif',
    fontSize: 13.5,
    color: '#2B1810',
    background: 'white',
    outline: 'none',
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── GPS Map / Current Location Header Bar ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #FFF9F2 0%, #FAF0E6 100%)',
          border: '1.5px solid #EADCCE',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 2px 8px rgba(139, 58, 58, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#8B3A3A',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Navigation size={20} className={isLocating ? 'animate-spin' : ''} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{language === 'np' ? 'सटीक GPS लोकेसन (Google Maps)' : 'Precise GPS Pin (Google Maps)'}</span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    background: '#ECFDF5',
                    color: '#065F46',
                    padding: '2px 8px',
                    borderRadius: 99,
                    border: '1px solid #A7F3D0',
                  }}
                >
                  ⚡ १-ट्याप अटो-फिल
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#6B564C', marginTop: 2 }}>
                {language === 'np'
                  ? 'सटीक GPS ले तपाईंको प्रदेश, जिल्ला, वडा र टोल स्वतः भर्छ।'
                  : 'Detect exact GPS location to auto-fill province, district, ward & street.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestCurrentLocation}
            disabled={isLocating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 10,
              background: isLocating ? '#9CA3AF' : '#8B3A3A',
              color: 'white',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: isLocating ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(139, 58, 58, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <Compass size={16} />
            <span>
              {isLocating
                ? language === 'np'
                  ? 'GPS जाँच्दै...'
                  : 'Detecting GPS...'
                : language === 'np'
                ? '📍 मेरो लोकेसन प्रयोग गर्नुहोस्'
                : '📍 Use Current Location'}
            </span>
          </button>
        </div>

        {/* GPS Coordinates Badge if captured */}
        {value.coordinates && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
              fontSize: 12,
              color: '#166534',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#16A34A" />
              <span>
                <strong>{language === 'np' ? 'सटीक GPS पिन सुरक्षित भयो:' : 'Exact GPS Pin Locked:'}</strong>{' '}
                {value.coordinates.lat.toFixed(5)}, {value.coordinates.lng.toFixed(5)}{' '}
                {value.coordinates.accuracy ? `(शुद्धता: ±${Math.round(value.coordinates.accuracy)}m)` : ''}
              </span>
            </div>
            {value.mapUrl && (
              <a
                href={value.mapUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#15803D',
                  fontWeight: 700,
                  textDecoration: 'none',
                  fontSize: 11.5,
                }}
              >
                <span>{language === 'np' ? 'Google Maps मा हेर्नुहोस्' : 'View on Google Maps'}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Notice after Auto Fill */}
        {autoFilledNotice && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              fontSize: 12,
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={15} color="#2563EB" />
            <span>{autoFilledNotice}</span>
          </div>
        )}
      </div>

      {/* ── STEP 1: PROVINCE BAR (Click to filter out all other provinces) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
              १
            </span>
            <span>{language === 'np' ? 'प्रदेश छान्नुहोस् (Province)' : 'Select Province'} *</span>
          </label>
          <span style={{ fontSize: 11, color: '#888' }}>
            {language === 'np' ? 'क्लिक गर्दा अरु प्रदेश फिल्टर हुन्छन्' : 'Filters out other provinces'}
          </span>
        </div>

        {/* Province Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {NEPAL_LOCATION_HIERARCHY.map((prov) => {
            const isSelected = selectedProvince.id === prov.id;
            return (
              <button
                type="button"
                key={prov.id}
                onClick={() => handleSelectProvince(prov)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 99,
                  fontSize: 12.5,
                  fontWeight: isSelected ? 700 : 500,
                  border: `1.5px solid ${isSelected ? '#8B3A3A' : '#EADCCE'}`,
                  background: isSelected ? '#8B3A3A' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#2B1810',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 6px rgba(139, 58, 58, 0.2)' : 'none',
                }}
              >
                {language === 'np' ? prov.nameNp : prov.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: CITY / DISTRICT BAR (Filtered by Province) ── */}
      <div style={{ background: '#FAF8F5', padding: '12px 14px', borderRadius: 12, border: '1px solid #EADCCE' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
              २
            </span>
            <span>
              {language === 'np' ? `${selectedProvince.nameNp} का जिल्ला / सहर (City / District)` : `District in ${selectedProvince.name}`} *
            </span>
          </label>
          <span style={{ fontSize: 11, color: '#888' }}>
            {language === 'np' ? 'क्लिक गर्दा अरु जिल्ला फिल्टर हुन्छन्' : 'Filters out other districts'}
          </span>
        </div>

        {/* District Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedProvince.districts.map((dist) => {
            const isSelected = selectedDistrict?.name === dist.name;
            return (
              <button
                type="button"
                key={dist.name}
                onClick={() => handleSelectDistrict(dist)}
                style={{
                  padding: '6px 13px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: isSelected ? 700 : 500,
                  border: `1.5px solid ${isSelected ? '#8B3A3A' : '#EADCCE'}`,
                  background: isSelected ? '#FAF2E9' : '#FFFFFF',
                  color: isSelected ? '#8B3A3A' : '#2B1810',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {language === 'np' ? dist.nameNp : dist.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 3: MUNICIPALITY / LOCAL BAR (Filtered by District) ── */}
      {selectedDistrict && (
        <div style={{ background: '#FAF8F5', padding: '12px 14px', borderRadius: 12, border: '1px solid #EADCCE' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                ३
              </span>
              <span>
                {language === 'np'
                  ? `${selectedDistrict.nameNp} को नगरपालिका / गाउँपालिका (Municipality)`
                  : `Municipality in ${selectedDistrict.name}`} *
              </span>
            </label>
            <span style={{ fontSize: 11, color: '#888' }}>
              {language === 'np' ? 'क्लिक गरी वडा छान्नुहोस्' : 'Click to select'}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedDistrict.municipalities.map((muni) => {
              const isSelected = selectedMunicipality?.name === muni.name;
              return (
                <button
                  type="button"
                  key={muni.name}
                  onClick={() => handleSelectMunicipality(muni)}
                  style={{
                    padding: '6px 13px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    border: `1.5px solid ${isSelected ? '#8B3A3A' : '#EADCCE'}`,
                    background: isSelected ? '#8B3A3A' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#2B1810',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {language === 'np' ? muni.nameNp : muni.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: WARD NUMBER (e.g. Bharatpur 10 / Ward 10) ── */}
      {selectedMunicipality && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#2B1810', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#8B3A3A', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                ४
              </span>
              <span>
                {language === 'np'
                  ? `वडा नं. छान्नुहोस् (${selectedMunicipality.nameNp})`
                  : `Select Ward (${selectedMunicipality.name})`} *
              </span>
            </label>
            <span style={{ fontSize: 11, color: '#888' }}>
              {currentWard ? `${selectedMunicipality.name.replace(/ (Metropolitan|Sub-Metropolitan|Municipality|Rural Municipality)/i, '')} - ${currentWard}` : 'वडा नम्बर'}
            </span>
          </div>

          {/* Quick ward chips (1 up to total wards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
              gap: 6,
              maxHeight: 110,
              overflowY: 'auto',
              padding: 4,
              border: '1px solid #EADCCE',
              borderRadius: 10,
              background: 'white',
            }}
          >
            {Array.from({ length: selectedMunicipality.totalWards }, (_, i) => i + 1).map((wNum) => {
              const isSelected = currentWard === String(wNum);
              return (
                <button
                  type="button"
                  key={wNum}
                  onClick={() => syncFullAddress({ ward: String(wNum) })}
                  style={{
                    padding: '6px 0',
                    textAlign: 'center',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: isSelected ? 800 : 500,
                    border: `1px solid ${isSelected ? '#8B3A3A' : '#EADCCE'}`,
                    background: isSelected ? '#8B3A3A' : '#FAF8F5',
                    color: isSelected ? '#FFFFFF' : '#2B1810',
                    cursor: 'pointer',
                  }}
                >
                  {wNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: TOLE / STREET NAME (Quick chips + typing) ── */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
          {language === 'np' ? 'टोल वा सडकको नाम (Street / Tole Name)' : 'Street / Tole Name (टोलको नाम)'} *
        </label>

        {/* Quick popular tole suggestions if available */}
        {selectedMunicipality?.popularToles && selectedMunicipality.popularToles.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#777', alignSelf: 'center', marginRight: 2 }}>
              {language === 'np' ? 'प्रमुख टोलहरू:' : 'Popular:'}
            </span>
            {selectedMunicipality.popularToles.slice(0, 8).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => syncFullAddress({ tole: t })}
                style={{
                  padding: '3px 9px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: currentTole === t ? 700 : 500,
                  border: `1px solid ${currentTole === t ? '#8B3A3A' : '#EADCCE'}`,
                  background: currentTole === t ? '#FAF2E9' : '#FFFFFF',
                  color: currentTole === t ? '#8B3A3A' : '#555',
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <input
          style={inputStyle(errors.tole || errors.addressLine)}
          value={currentTole}
          placeholder={
            language === 'np'
              ? 'उदा: लायन्स चोक / हाकिम चोक / नयाँ सडक / नारायणगढ'
              : 'e.g. Lions Chowk / Hakim Chowk / New Road'
          }
          onChange={(e) => syncFullAddress({ tole: e.target.value })}
        />
        {errors.addressLine && !currentTole && (
          <p style={{ fontSize: 11, color: '#DC2626', margin: '4px 0 0' }}>{errors.addressLine}</p>
        )}
      </div>

      {/* ── STEP 6: CHOWK & LANDMARK (The final piece) ── */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#2B1810', marginBottom: 5 }}>
          {language === 'np' ? 'नजिकको चोक वा प्रसिद्ध ल्यान्डमार्क (Chowk & Landmark)' : 'Chowk & Landmark (चोक / ल्यान्डमार्क)'} *
        </label>
        <input
          ref={landmarkInputRef}
          style={inputStyle(errors.landmark)}
          value={currentLandmark}
          placeholder={
            language === 'np'
              ? 'उदा: सिजी ल्यान्डमार्क अगाडि / सरकारी अस्पताल नजिक / बुद्ध चोक'
              : 'e.g. Opposite CG Landmark / Near Hospital / Buddha Chowk'
          }
          onChange={(e) => syncFullAddress({ landmark: e.target.value })}
        />
        <div style={{ fontSize: 11, color: '#6B564C', marginTop: 4 }}>
          {language === 'np'
            ? '💡 डेलिभरी राइडरलाई घर पत्ता लगाउन सजिलो हुने कुनै चोक, स्कुल, बैंक वा प्रसिद्ध पसलको नाम लेख्नुहोस्।'
            : '💡 Mention a nearby shop, school, bank, or landmark to ensure smooth delivery.'}
        </div>
      </div>

      {/* Summary Preview Box */}
      <div
        style={{
          background: '#FAF2E9',
          border: '1px solid #EADCCE',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <MapPin size={16} color="#8B3A3A" style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 12.5, color: '#2B1810' }}>
          <strong>{language === 'np' ? 'अन्तिम डेलिभरी ठेगाना:' : 'Final Delivery Address:'}</strong>{' '}
          <span>
            {value.addressLine ||
              `${currentTole || 'टोल'}, ${currentLandmark ? `(${currentLandmark}), ` : ''}${currentWard ? `वडा-${currentWard}, ` : ''}${selectedMunicipality.name}, ${selectedDistrict.name}, ${selectedProvince.name}`}
          </span>
        </div>
      </div>

      {/* ── POPUP MODAL: APPROXIMATE LOCATION WARNING ── */}
      {showApproxModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 99999,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: '24px 20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <button
              onClick={() => setShowApproxModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  background: '#FEF3C7',
                  border: '2px solid #F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: '#D97706',
                }}
              >
                <AlertTriangle size={30} />
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#2B1810',
                  margin: 0,
                }}
              >
                {language === 'np'
                  ? '⚠️ कृपया Exact (सटीक) Location अन गर्नुहोस्'
                  : '⚠️ Exact Location Required'}
              </h3>
              <p style={{ fontSize: 13, color: '#B45309', fontWeight: 600, margin: '6px 0 0' }}>
                {language === 'np'
                  ? `तपाईंको ब्राउजरले अहिले Approximate (अनुमानित ±${approxAccuracy || '200+'}m) स्थान दिएको छ`
                  : `Your browser is currently sending an Approximate (~${approxAccuracy || '200+'}m) location`}
              </p>
            </div>

            <div
              style={{
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 12.5,
                color: '#78350F',
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              {language === 'np' ? (
                <>
                  हाम्रो डेलिभरी राइडर सिधै <strong>तपाईंको घरको ढोकामै आइपुग्न</strong> र पार्सल हराउने जोखिम नहोस् भन्नका लागि सटीक GPS लोकेसन आवश्यक पर्दछ।
                </>
              ) : (
                <>
                  Our courier rider needs your <strong>precise GPS doorstep pin</strong> to avoid dispatching to the wrong neighborhood or highway intersection.
                </>
              )}
            </div>

            {/* Step-by-step how to enable Precise Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #EADCCE',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#2B1810',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2, color: '#8B3A3A' }}>
                  📱 Android (Chrome / Samsung Internet):
                </div>
                <div>
                  URL बारमा रहेको <strong>🔒 (ताल्चा वा सेटिङ आइकन)</strong> मा ट्याप गर्नुहोस् ➔{' '}
                  <strong>Permissions (अनुमति)</strong> ➔ <strong>Location</strong> ➔{' '}
                  <strong>'Use Precise Location' (सटीक स्थान)</strong> अन गर्नुहोस्।
                </div>
              </div>

              <div
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #EADCCE',
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#2B1810',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2, color: '#8B3A3A' }}>
                  🍎 iPhone (iOS Safari):
                </div>
                <div>
                  फोनको <strong>Settings</strong> ➔ <strong>Safari / Chrome</strong> ➔{' '}
                  <strong>Location</strong> ➔ <strong>'Precise Location'</strong> लाई Turn ON गर्नुहोस्।
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setShowApproxModal(false);
                  handleRequestCurrentLocation();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  background: '#8B3A3A',
                  color: 'white',
                  border: 'none',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <RotateCcw size={16} />
                <span>
                  {language === 'np'
                    ? '🔄 फेरि Exact GPS जाँच्नुहोस् (Retry Exact GPS)'
                    : '🔄 Retry Exact GPS Pin'}
                </span>
              </button>

              {pendingCoords && (
                <button
                  type="button"
                  onClick={() => {
                    setShowApproxModal(false);
                    applyCoordinatesAndReverseGeocode(
                      pendingCoords.lat,
                      pendingCoords.lng,
                      pendingCoords.accuracy
                    );
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 10,
                    background: 'white',
                    color: '#6B564C',
                    border: '1px solid #D1D5DB',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {language === 'np'
                    ? '⚠️ यही अनुमानित स्थान प्रयोग गर्नुहोस् (Use approximate anyway)'
                    : '⚠️ Proceed with approximate location anyway'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowApproxModal(false)}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'transparent',
                  color: '#888',
                  border: 'none',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {language === 'np' ? '✍️ म आफैं फारम छान्छु (Choose manually)' : 'Cancel & fill manually'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
