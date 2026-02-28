import { useState, useRef, useCallback, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import coffeeCup from "@/assets/coffee-cup.png";

const STORAGE_KEY = "ht_coffee_dismissed";
const DISMISS_DURATION = 10 * 60 * 1000; // 10 minutes

export function FloatingCoffee() {
  const [dismissed, setDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (!dismissedAt) return false;
    const elapsed = Date.now() - Number(dismissedAt);
    if (elapsed >= DISMISS_DURATION) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  });
  const [positioned, setPositioned] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [nearBin, setNearBin] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const binRef = useRef<HTMLDivElement>(null);
  const coffeeRef = useRef<HTMLDivElement>(null);

  // Set initial position to bottom-right, safely within viewport
  useEffect(() => {
    const updatePos = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 640;
      const size = isMobile ? 56 : 80; // w-14=56px, sm:w-20=80px
      setPosition({ x: Math.max(8, vw / 2 - size / 2), y: Math.max(8, vh / 2 - size / 2) });
      setPositioned(true);
    };
    updatePos();
    window.addEventListener("resize", updatePos);
    return () => window.removeEventListener("resize", updatePos);
  }, []);

  // Re-appear after 10 minutes
  useEffect(() => {
    if (!dismissed) return;
    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY) || Date.now());
    const remaining = DISMISS_DURATION - (Date.now() - dismissedAt);
    if (remaining <= 0) {
      setDismissed(false);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const timer = setTimeout(() => {
      setDismissed(false);
      localStorage.removeItem(STORAGE_KEY);
      const isMobile = window.innerWidth < 640;
      const size = isMobile ? 56 : 80;
      setPosition({ x: Math.max(8, window.innerWidth / 2 - size / 2), y: Math.max(8, window.innerHeight / 2 - size / 2) });
    }, remaining);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const checkNearBin = useCallback((cx: number, cy: number) => {
    if (!binRef.current) return false;
    const bin = binRef.current.getBoundingClientRect();
    const dist = Math.hypot(cx - (bin.left + bin.width / 2), cy - (bin.top + bin.height / 2));
    return dist < 80;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    setHasMoved(false);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: position.x, posY: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasMoved(true);
    const newX = dragStart.current.posX + dx;
    const newY = dragStart.current.posY + dy;
    setPosition({ x: newX, y: newY });
    setNearBin(checkNearBin(newX + 40, newY + 40));
  }, [dragging, checkNearBin]);

  const onPointerUp = useCallback(() => {
    if (nearBin) {
      setDismissed(true);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } else if (!hasMoved) {
      window.open("https://razorpay.me/@teamdino", "_blank", "noopener,noreferrer");
    }
    setDragging(false);
    setNearBin(false);
  }, [nearBin, hasMoved]);

  if (dismissed || !positioned) return null;

  return (
    <>
      {/* Trash bin - only visible while dragging */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            ref={binRef}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: nearBin ? 1.3 : 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] flex items-center justify-center w-14 h-14 rounded-full border-2 transition-colors duration-200 ${
              nearBin
                ? "border-destructive bg-destructive/20 text-destructive"
                : "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
            }`}
          >
            <Trash2 className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable coffee */}
      <div
        ref={coffeeRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={`fixed z-[9999] cursor-grab active:cursor-grabbing select-none touch-none ${
          nearBin ? "opacity-50 scale-75" : ""
        }`}
        style={{
          left: position.x,
          top: position.y,
          transition: dragging ? "none" : "opacity 0.2s, transform 0.2s",
        }}
      >
        <motion.div
          animate={{ y: dragging ? 0 : [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="relative"
        >
          {/* Steam particles */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-12 pointer-events-none">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-foreground/20"
                style={{
                  width: 6 + i * 3,
                  height: 6 + i * 3,
                  left: `${15 + i * 16}%`,
                  bottom: 0,
                }}
                animate={{
                  y: [-2, -24 - i * 6],
                  x: [0, 5 + i, -3 - i, 7, 0],
                  opacity: [0, 0.7, 0],
                  scale: [0.5, 1.4],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8 + i * 0.25,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
          <img
            src={coffeeCup}
            alt="Buy me a coffee"
            className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-lg pointer-events-none"
            draggable={false}
          />
        </motion.div>
      </div>
    </>
  );
}
