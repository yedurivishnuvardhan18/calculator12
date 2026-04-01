import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Payments = () => {
  const razorpayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!razorpayRef.current) return;
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
  }, []);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center space-y-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Support Us</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          GradeGuru is completely free to use. If it has helped you, consider
          supporting Team Dino so we can keep building tools for students like
          you.
        </p>
        <div
          ref={razorpayRef}
          className="flex items-center justify-center min-h-[60px]"
        />
      </motion.div>
    </div>
  );
};

export default Payments;
