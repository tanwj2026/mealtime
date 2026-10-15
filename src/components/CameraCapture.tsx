import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw, 
  Sparkles, 
  X, 
  Eye, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle,
  FlipHorizontal,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { SAMPLE_PRESETS, optimizeImageFile, urlToBase64 } from '../data/samplePresets.ts';
import { SamplePreset } from '../types.ts';

interface CameraCaptureProps {
  onImageSelected: (base64: string, mimeType: string, locationHint: string) => void;
  isAnalyzing: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onImageSelected, isAnalyzing }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [locationHint, setLocationHint] = useState<string>('auto');
  
  // Live camera states
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream cleanup
  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  // Start live camera
  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopLiveCamera();
    setIsCameraLoading(true);
    setCameraError(null);
    setIsLiveCameraOpen(true);

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraLoading(false);
    } catch (err: any) {
      console.warn('Could not start live camera:', err);
      setIsCameraLoading(false);
      setCameraError(
        'Unable to access live camera stream. You can still use the "Take Photo" button or upload an image.'
      );
    }
  };

  const switchCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startLiveCamera(nextFacing);
  };

  const captureLiveFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    stopLiveCamera();
    setPreviewImage(base64);
    setImageMimeType('image/jpeg');
  };

  // Handle native file inputs (camera & gallery)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64, mimeType } = await optimizeImageFile(file);
      setPreviewImage(base64);
      setImageMimeType(mimeType);
      // Reset input value so same photo can be picked again if desired
      e.target.value = '';
    } catch (err) {
      console.error('Error processing file:', err);
    }
  };

  // Handle preset sample click
  const handlePresetSelect = async (preset: SamplePreset) => {
    try {
      const { base64, mimeType } = await urlToBase64(preset.imageUrl);
      setPreviewImage(base64);
      setImageMimeType(mimeType);
      setLocationHint(preset.tag.toLowerCase().includes('fridge') ? 'fridge' : 'table');
    } catch (err) {
      console.error('Error loading preset:', err);
    }
  };

  // Trigger analysis
  const handleConfirmAndAnalyze = () => {
    if (!previewImage) return;
    onImageSelected(previewImage, imageMimeType, locationHint);
  };

  const handleRetake = () => {
    setPreviewImage(null);
  };

  return (
    <div className="w-full">
      {/* Hidden Native File Inputs */}
      {/* capture="environment" invokes rear camera on smartphones */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* View 1: Image Ready for Analysis */}
      {previewImage ? (
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden p-5 sm:p-6 transition-all">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Image Preview Container */}
            <div className="relative w-full md:w-1/2 aspect-4/3 rounded-2xl overflow-hidden bg-stone-900 border border-stone-200 shadow-inner group">
              <img
                src={previewImage}
                alt="Selected Ingredients"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleRetake}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake
                </button>
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-medium text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Photo ready for analysis
              </div>
            </div>

            {/* Analysis Options and Action */}
            <div className="w-full md:w-1/2 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 inline-block mb-2">
                  Step 2 of 2
                </span>
                <h3 className="text-xl font-extrabold text-stone-900 tracking-tight">
                  Ready to Detect Ingredients
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  Gemini will visually identify all food items, count quantities, gauge freshness, and organize everything into an inventory table.
                </p>
              </div>

              {/* Location Context Selector */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5 mb-2.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Scene Environment Hint (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'auto', label: 'Auto Detect', icon: '✨' },
                    { id: 'fridge', label: 'Fridge / Shelf', icon: '❄️' },
                    { id: 'table', label: 'Table / Counter', icon: '🍽️' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLocationHint(opt.id)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-center transition flex flex-col items-center gap-1 ${
                        locationHint === opt.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze & Estimate Quantities'}
                </button>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isAnalyzing}
                  className="py-3.5 px-4 rounded-2xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : isLiveCameraOpen ? (
        /* View 2: Live In-Browser Viewfinder */
        <div className="relative bg-stone-950 rounded-3xl overflow-hidden border border-stone-800 shadow-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-300">
                Live Viewfinder
              </span>
            </div>
            <button
              onClick={stopLiveCamera}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {cameraError ? (
            <div className="p-6 text-center bg-stone-900 rounded-2xl border border-stone-800 my-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-stone-300 mb-4">{cameraError}</p>
              <button
                onClick={() => nativeCameraInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Use Native Phone Camera
              </button>
            </div>
          ) : (
            <div className="relative aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {isCameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950/80 z-10">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-xs text-stone-400">Starting camera sensor...</p>
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder overlay grid */}
              <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/30 rounded-2xl m-3">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400"></div>
                
                {/* Rule of thirds grid lines */}
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-r border-b border-white"></div>
                  <div className="border-b border-white"></div>
                  <div className="border-r border-white"></div>
                  <div className="border-r border-white"></div>
                  <div></div>
                </div>
              </div>

              {/* Camera Controls Bar */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6 z-20 px-4">
                <button
                  type="button"
                  onClick={switchCameraFacing}
                  className="w-11 h-11 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700 text-stone-200 flex items-center justify-center active:scale-95 transition"
                  title="Switch camera"
                >
                  <FlipHorizontal className="w-5 h-5" />
                </button>

                {/* Shutter button */}
                <button
                  type="button"
                  onClick={captureLiveFrame}
                  className="w-18 h-18 rounded-full bg-white p-1 shadow-2xl active:scale-90 transition-transform cursor-pointer"
                  title="Capture Photo"
                >
                  <div className="w-full h-full rounded-full border-4 border-stone-950 bg-emerald-500 flex items-center justify-center text-white">
                    <Camera className="w-7 h-7" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="w-11 h-11 rounded-full bg-stone-900/80 backdrop-blur-md border border-stone-700 text-stone-200 flex items-center justify-center active:scale-95 transition"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* View 3: Capture Hub (Mobile First) */
        <div className="space-y-6">
          {/* Main Hero Capture Card */}
          <div className="bg-gradient-to-b from-white via-white to-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <div className="text-center max-w-xl mx-auto mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                <Sparkles className="w-3 h-3" /> Visual Food Scanner
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Scan Your Fridge or Table
              </h2>
              <p className="text-sm sm:text-base text-stone-600 mt-2">
                Snap a photo of food items arranged on your table or shelves. We'll identify every ingredient and estimate the quantity available.
              </p>
            </div>

            {/* Mobile & Desktop Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto">
              {/* Button 1: Native Mobile Camera Shutter (Best for phones) */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-3 transition cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Take Photo</div>
                  <div className="text-[11px] text-emerald-100 font-normal">Opens device camera</div>
                </div>
              </button>

              {/* Button 2: Upload from Library / Files */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-4 px-5 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-md shadow-stone-900/10 flex items-center justify-center gap-3 transition cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="font-bold">Upload Image</div>
                  <div className="text-[11px] text-stone-300 font-normal">Choose from photos</div>
                </div>
              </button>
            </div>

            {/* Optional Live Web Viewfinder Link */}
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => startLiveCamera('environment')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-50 transition"
              >
                <Eye className="w-3.5 h-3.5" /> Or open in-app live camera viewfinder
              </button>
            </div>

            {/* Helpful tips badge */}
            <div className="mt-6 pt-5 border-t border-stone-200/80 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> Fridge shelves & crispers
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> Tabletop or cutting boards
              </span>
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">✓</span> Multiple containers & produce
              </span>
            </div>
          </div>

          {/* Preset Sample Gallery: 1-Click Instant Testing */}
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-emerald-600" />
                  Try Sample Photo Presets
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  No food around right now? Click any preset to test ingredient and quantity estimation immediately!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="group text-left rounded-2xl border border-stone-200 hover:border-emerald-500/80 bg-stone-50/50 hover:bg-white p-2.5 transition shadow-xs hover:shadow-md cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-200 mb-2.5">
                    <img
                      src={preset.imageUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                      {preset.tag}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-stone-900 group-hover:text-emerald-600 transition truncate">
                      {preset.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                      {preset.subtitle}
                    </p>
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Scan this photo</span> →
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
