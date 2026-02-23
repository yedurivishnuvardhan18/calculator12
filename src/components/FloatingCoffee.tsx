import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import coffeeCup from "@/assets/coffee-cup.png";

const STORAGE_KEY = "ht_coffee_dismissed";

export function FloatingCoffee() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [nearBin, setNearBin] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const binRef = useRef<HTMLDivElement>(null);
  const coffeeRef = useRef<HTMLDivElement>(null);

  // Set initial position to bottom-right
  useEffect(() => {
    setPosition({ x: window.innerWidth - 100, y: window.innerHeight - 140 });
  }, []);

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
      localStorage.setItem(STORAGE_KEY, "1");
    } else if (!hasMoved) {
      navigate("/external/coffee");
    }
    setDragging(false);
    setNearBin(false);
  }, [nearBin, hasMoved, navigate]);

  if (dismissed) return null;

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
            className="w-20 h-20 object-contain drop-shadow-lg pointer-events-none"
            draggable={false}
          />
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-foreground/70 px-1.5 py-0.5 rounded-full">
            Buy me a ☕
          </span>
        </motion.div>
      </div>
    </>
  );
}
