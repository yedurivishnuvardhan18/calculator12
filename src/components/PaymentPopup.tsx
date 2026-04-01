import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "payment_popup_last_shown";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const PaymentPopup = () => {
  const [show, setShow] = useState(false);
  const razorpayRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && Date.now() - Number(last) < ONE_DAY_MS) return;

    const timer = setTimeout(() => {
      setShow(true);
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!show || !razorpayRef.current) return;
    const form = document.createElement("form");
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.setAttribute("data-payment_button_id", "pl_SYI2BQkDOwgax4");
    script.async = true;
    form.appendChild(script);
    razorpayRef.current.appendChild(form);

    return () => {
      if (razorpayRef.current) {
        razorpayRef.current.innerHTML = "";
      }
    };
  }, [show]);

  const close = () => setShow(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Heart className="w-6 h-6 text-primary" />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              Support GradeGuru
            </h2>
            <p className="text-sm text-muted-foreground">
              GradeGuru is free for everyone. Your support helps us keep it
              running and build more tools for students.
            </p>

            <div
              ref={razorpayRef}
              className="flex items-center justify-center min-h-[50px]"
            />

            <button
              onClick={close}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
