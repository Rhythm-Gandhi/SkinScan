import { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Camera, Upload, Loader2, ShoppingBag, AlertCircle, RefreshCw, Trash2, Sparkles, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const SYSTEM_INSTRUCTION = `You are a Skincare Product Procurement Assistant. Your goal is to analyze images provided by the user, identify the specific skincare products shown, rank them based on key criteria, and provide direct, working buying links.

### Task Workflow:
1. **Visual Analysis**: Identify the brand name, product name, volume/size (e.g., 50ml), and any specific variants.
2. **Product Ranking (Score out of 10)**:
   - **Ingredients**: Analyze the quality and safety of key ingredients.
   - **Usage**: Ease of use and integration into a routine.
   - **Effectiveness**: General reputation and clinical/user-reported results.
   - **Overall Rank**: A final score out of 10.
3. **Link Generation**: 
   - Generate REAL, working URLs for major retailers (Amazon, Sephora, Nykaa, etc.).
   - If a direct product page is unknown, use a direct search query URL (e.g., https://www.amazon.com/s?k=Brand+Product+Name).
   - Always include a Google Shopping search link for the exact product.
4. **Safety Disclaimer**: Remind the user to check ingredients for allergies.

### Output Format (Markdown):
# [Brand] [Product Name]
**Details**: [Size/Variant]

### 📊 Product Ranking
- **Ingredients**: [Score]/10 - [Brief justification]
- **Usage**: [Score]/10 - [Brief justification]
- **Effectiveness**: [Score]/10 - [Brief justification]
- **Overall Score**: **[Score]/10**

### 🛒 Buying Links
- [Retailer Name]([URL])
- [Retailer Name]([URL])
- [Search on Google Shopping](https://www.google.com/search?q=[Encoded+Product+Name]&tbm=shop)

> **Safety Disclaimer**: Please check the full ingredient list for potential allergies before use.
`;

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Could not access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        setResult(null);
        setError(null);
      }
    }
  };

  const analyzeImage = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const base64Data = image.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Identify this skincare product and provide procurement details." },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });
      
      setResult(response.text || "No product identified.");
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 text-gray-800 font-sans p-4 md:p-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            className="inline-flex items-center justify-center p-4 bg-white rounded-3xl shadow-lg shadow-rose-100 mb-6 relative"
          >
            <ShoppingBag className="w-10 h-10 text-rose-500" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1"
            >
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            </motion.div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-serif font-bold tracking-tight mb-3 bg-gradient-to-r from-rose-600 to-fuchsia-600 bg-clip-text text-transparent"
          >
            SkinScan Assistant
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-rose-400 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4 fill-rose-400" />
            Your Glow-Up Procurement Partner
          </motion.p>
        </header>

        <main className="space-y-8">
          {/* Upload / Camera Section */}
          <AnimatePresence mode="wait">
            {!image && !isCameraActive ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/80 backdrop-blur-sm rounded-[32px] p-10 shadow-xl shadow-rose-100/50 border-2 border-dashed border-rose-200 flex flex-col items-center justify-center space-y-8 min-h-[350px]"
              >
                <div className="flex space-x-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center p-8 bg-rose-50 rounded-3xl hover:bg-rose-100 transition-all group hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-all">
                      <Upload className="w-8 h-8 text-rose-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Upload Photo</span>
                  </button>
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center p-8 bg-fuchsia-50 rounded-3xl hover:bg-fuchsia-100 transition-all group hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-all">
                      <Camera className="w-8 h-8 text-fuchsia-500" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-600">Take Photo</span>
                  </button>
                </div>
                <p className="text-xs text-rose-400 text-center max-w-[240px] leading-relaxed">
                  Snap a clear photo of your favorite product to find the best deals! ✨
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </motion.div>
            ) : isCameraActive ? (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative bg-black rounded-[32px] overflow-hidden shadow-2xl aspect-[3/4] border-4 border-white"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6 px-8">
                  <button
                    onClick={stopCamera}
                    className="p-5 bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white/30 transition-colors border border-white/30"
                  >
                    <Trash2 className="w-7 h-7" />
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all border-[6px] border-rose-100"
                  >
                    <div className="w-14 h-14 bg-rose-500 rounded-full shadow-inner" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-2xl border-4 border-white"
              >
                <div className="relative aspect-square md:aspect-video">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-6 right-6 flex space-x-3">
                    <button
                      onClick={reset}
                      className="p-3 bg-white/90 backdrop-blur-md rounded-2xl text-rose-500 hover:bg-white transition-all shadow-lg hover:scale-110"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-8 bg-gradient-to-b from-white to-rose-50/30">
                  {!result && !isAnalyzing && (
                    <button
                      onClick={analyzeImage}
                      className="w-full py-5 bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
                    >
                      <Sparkles className="w-6 h-6" />
                      <span>Identify Product</span>
                    </button>
                  )}
                  
                  {isAnalyzing && (
                    <div className="flex flex-col items-center py-10 space-y-6">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                        <Heart className="w-4 h-4 text-fuchsia-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-sm font-medium text-rose-400 animate-pulse tracking-wide uppercase">Consulting the beauty experts...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-10 shadow-2xl shadow-rose-100 border border-rose-50 space-y-8"
            >
              <div className="flex items-center space-x-3 pb-6 border-b border-rose-50">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <ShoppingBag className="w-6 h-6 text-rose-500" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-800">Your Beauty Report</h2>
              </div>
              
              <div className="prose prose-rose prose-sm max-w-none 
                prose-headings:font-serif prose-headings:text-rose-900 
                prose-p:text-gray-600 prose-p:leading-relaxed
                prose-li:text-gray-600
                prose-a:text-rose-500 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                prose-strong:text-rose-700
                prose-blockquote:border-rose-200 prose-blockquote:bg-rose-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:text-rose-600">
                <Markdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" />
                    ),
                  }}
                >
                  {result}
                </Markdown>
              </div>

              <div className="pt-8 border-t border-rose-50 flex justify-center">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-rose-50 text-rose-500 rounded-2xl text-sm font-bold flex items-center space-x-2 hover:bg-rose-100 transition-all hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan another product</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-rose-50 text-rose-600 p-5 rounded-[20px] border border-rose-100 flex items-center space-x-4 text-sm font-medium shadow-sm"
            >
              <div className="p-2 bg-white rounded-full shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              </div>
              <p>{error}</p>
            </motion.div>
          )}
        </main>

        {/* Footer Info */}
        <footer className="mt-16 text-center space-y-6">
          <div className="flex justify-center space-x-3">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
              >
                <Heart className="w-4 h-4 text-rose-200 fill-rose-100" />
              </motion.div>
            ))}
          </div>
          <p className="text-rose-300 text-xs font-bold tracking-widest uppercase">© 2026 SkinScan Assistant • Glow with Gemini</p>
          <div className="flex justify-center space-x-6">
            <span className="flex items-center space-x-1.5 text-[10px] uppercase tracking-tighter text-rose-400 font-bold">
              <AlertCircle className="w-3 h-3" />
              <span>Safety First</span>
            </span>
          </div>
        </footer>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}


