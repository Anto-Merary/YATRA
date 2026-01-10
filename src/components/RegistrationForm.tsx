import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useExpandableScreen } from "@/components/ui/expandable-screen";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

// Valid RIT Chennai department codes
const VALID_RIT_DEPARTMENTS = ["csbs", "cse", "aiml", "aids", "bio", "cce", "mech", "vlsi"];

const registrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .refine(
      (email) => {
        // Strict email validation: must have proper domain structure
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return false;
        
        // Ensure domain has at least one dot and valid TLD
        const parts = email.split("@");
        if (parts.length !== 2) return false;
        
        const domain = parts[1];
        const domainParts = domain.split(".");
        if (domainParts.length < 2) return false;
        
        // Ensure TLD is at least 2 characters
        const tld = domainParts[domainParts.length - 1];
        if (tld.length < 2) return false;
        
        // Ensure domain name exists (not just dots)
        const domainName = domainParts.slice(0, -1).join(".");
        if (!domainName || domainName.length === 0) return false;
        
        return true;
      },
      {
        message: "Please enter a valid email address with proper domain",
      }
    ),
  phone: z
    .string()
    .refine(
      (phone) => {
        // Remove any spaces, dashes, or other characters
        const digitsOnly = phone.replace(/\D/g, "");
        // Must be exactly 10 digits for Indian mobile numbers
        return digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly);
      },
      {
        message: "Please enter a valid 10-digit Indian mobile number (should start with 6, 7, 8, or 9)",
      }
    ),
  college: z.string().min(2, "Please enter your college name"),
  ticketType: z.string().optional(),
}).refine(
  (data) => {
    const normalizedCollege = data.college?.toLowerCase().trim() || "";
    const normalizedEmail = data.email?.toLowerCase() || "";
    
    // Check if college is RIT
    const isRITCollege = 
      normalizedCollege === "rajalakshmi institute of technology" ||
      normalizedCollege === "rit" ||
      normalizedCollege === "rit chennai" ||
      (normalizedCollege.includes("rajalakshmi") && normalizedCollege.includes("technology"));
    
    // If college is RIT, email must be RIT email
    if (isRITCollege) {
      const isRITEmail = 
        normalizedEmail.endsWith("@ritchennai.edu.in") ||
        VALID_RIT_DEPARTMENTS.some(dept => 
          normalizedEmail.endsWith(`@${dept}.ritchennai.edu.in`)
        );
      
      return isRITEmail;
    }
    
    return true;
  },
  {
    message: "Rajalakshmi Institute of Technology students must use their college email address (@ritchennai.edu.in)",
    path: ["email"], // This will show the error on the email field
  }
);

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  ticketType?: string;
  originalPrice?: string;
  earlyBirdPrice?: string;
  ritStudentPrice?: string;
  showTimer?: boolean;
  timerEndDate?: Date;
}

function formatCountdownDigits(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return { days, hours, mins, secs };
}

function CountdownTimer({ endDate }: { endDate: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, endDate.getTime() - now);
  const countdown = formatCountdownDigits(remainingMs);

  return (
    <div className="mb-4 sm:mb-6 rounded-xl border border-yatra-400/30 bg-yatra-500/10 p-3 sm:p-4">
      <div className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold tracking-widest text-yatra-300 uppercase">
        Offer Ends In
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { value: countdown.days, label: "Days" },
          { value: countdown.hours, label: "Hours" },
          { value: countdown.mins, label: "Mins" },
          { value: countdown.secs, label: "Secs" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] p-1.5 sm:p-2"
          >
            <motion.div
              key={item.value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-base sm:text-lg md:text-xl font-bold text-white"
            >
              {String(item.value).padStart(2, "0")}
            </motion.div>
            <div className="mt-0.5 sm:mt-1 text-[9px] sm:text-[10px] font-medium text-white/50 uppercase tracking-wider">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegistrationForm({
  ticketType = "Early Bird",
  originalPrice = "₹800",
  earlyBirdPrice = "₹750",
  ritStudentPrice = "₹500",
  showTimer = false,
  timerEndDate,
}: RegistrationFormProps) {
  const { collapse } = useExpandableScreen();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      college: "",
      ticketType: ticketType,
    },
  });

  // Watch email and college fields for dynamic price calculation
  const email = useWatch({
    control: form.control,
    name: "email",
  });

  const college = useWatch({
    control: form.control,
    name: "college",
  });

  // Check if user is RIT student
  const normalizedCollege = college?.toLowerCase().trim() || "";
  const normalizedEmail = email?.toLowerCase() || "";
  
  // Check for RIT email patterns: @dept.ritchennai.edu.in or @ritchennai.edu.in
  const isRITEmail = 
    normalizedEmail.endsWith("@ritchennai.edu.in") ||
    VALID_RIT_DEPARTMENTS.some(dept => 
      normalizedEmail.endsWith(`@${dept}.ritchennai.edu.in`)
    );
  
  const isRITStudent =
    isRITEmail &&
    (normalizedCollege === "rajalakshmi institute of technology" ||
      normalizedCollege === "rit" ||
      (normalizedCollege.includes("rajalakshmi") && normalizedCollege.includes("technology")));

  // Calculate dynamic price
  const displayPrice = isRITStudent ? ritStudentPrice : earlyBirdPrice;

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare data for Supabase
      const registrationData = {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone.replace(/\D/g, ""), // Store only digits
        college: data.college.trim(),
        ticket_type: ticketType,
        price: displayPrice,
        is_rit_student: isRITStudent,
      };

      // Debug: Log the Supabase client configuration
      console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? "Set" : "Missing");
      console.log("Supabase Key:", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Set" : "Missing");
      console.log("Registration data:", registrationData);

      // Insert into Supabase
      const { data: insertedData, error } = await supabase
        .from("registrations")
        .insert([registrationData])
        .select();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
        
        // Handle duplicate email error
        if (error.code === "23505" || error.message.includes("duplicate")) {
          toast({
            title: "Registration Failed",
            description: "This email is already registered. Please use a different email address.",
            variant: "destructive",
          });
        } else if (error.code === "42501" || error.message.includes("row-level security")) {
          toast({
            title: "Registration Failed",
            description: "Authentication error. Please refresh the page and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Registration Failed",
            description: error.message || "An error occurred while submitting your registration. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      // Success!
      console.log("Registration successful:", insertedData);
      
      // Send confirmation email via Edge Function
      if (insertedData && insertedData[0]) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl) {
          console.log('Attempting to send confirmation email...');
          
          fetch(`${supabaseUrl}/functions/v1/send-registration-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey || ''}`,
            },
            body: JSON.stringify(insertedData[0]),
          })
          .then(async (response) => {
            const result = await response.json();
            if (response.ok) {
              console.log('✅ Email sent successfully:', result);
            } else {
              console.error('❌ Email sending failed:', result);
            }
          })
          .catch((err) => {
            console.error('❌ Failed to call email function:', err);
            // Don't show error to user - email sending is not critical
          });
        }
      }
      
      toast({
        title: "Registration Successful! 🎉",
        description: `You have successfully registered for ${ticketType}. A confirmation email will be sent shortly.`,
      });
      
      // Reset form and close screen
      form.reset();
      setTimeout(() => {
        collapse();
      }, 1500);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Registration Failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-black p-6 sm:p-8 md:p-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            <span className="text-pink-400">등록</span> Registration
          </h2>
          <p className="text-white/70 text-sm sm:text-base">
            Complete your registration for{" "}
            <span className="text-yatra-400 font-semibold">{ticketType}</span>{" "}
            ticket
          </p>
          {showTimer && !isRITStudent && timerEndDate && (
            <div className="mt-4">
              <CountdownTimer endDate={timerEndDate} />
            </div>
          )}
          <div className="mt-4 flex items-center gap-2 text-lg font-semibold">
            <span className="text-white/50">Price:</span>
            <motion.span
              key={displayPrice}
              initial={{ scale: 1.1, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-yatra-400"
            >
              {displayPrice}
            </motion.span>
            {isRITStudent && (
              <span className="text-xs text-white/50 ml-2">(RIT Student Price)</span>
            )}
            {!isRITStudent && showTimer && (
              <span className="text-xs text-white/50 ml-2">(Early Bird Price)</span>
            )}
          </div>
          {isRITStudent && (
            <div className="mt-2 text-xs text-green-400/80">
              ✓ RIT Chennai student discount applied
            </div>
          )}
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your full name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-yatra-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => {
                // Check if college is RIT to show helper message
                const normalizedCollege = college?.toLowerCase().trim() || "";
                const currentEmail = field.value?.toLowerCase() || "";
                const isRITCollege = 
                  normalizedCollege === "rajalakshmi institute of technology" ||
                  normalizedCollege === "rit" ||
                  normalizedCollege === "rit chennai" ||
                  (normalizedCollege.includes("rajalakshmi") && normalizedCollege.includes("technology"));
                
                // Check if current email is RIT email
                const isCurrentRITEmail = 
                  currentEmail.endsWith("@ritchennai.edu.in") ||
                  VALID_RIT_DEPARTMENTS.some(dept => 
                    currentEmail.endsWith(`@${dept}.ritchennai.edu.in`)
                  );
                
                return (
                  <FormItem>
                    <FormLabel className="text-white">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={
                          isRITCollege 
                            ? "Enter your RIT email (e.g., name@ritchennai.edu.in)"
                            : "Enter your email (e.g., name@example.com)"
                        }
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-yatra-400"
                      />
                    </FormControl>
                    {isRITCollege && currentEmail && !isCurrentRITEmail && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ RIT students must use their college email address (@ritchennai.edu.in)
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="Enter 10-digit mobile number (e.g., 9876543210)"
                      maxLength={10}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-yatra-400"
                      onChange={(e) => {
                        // Only allow digits and limit to 10 digits
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">College/Institution</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter your college name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-yatra-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={collapse}
                className="flex-1 bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-white text-black hover:bg-white/90 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="text-pink-600">제출 중...</span> Submitting...
                  </>
                ) : (
                  <>
                    <span className="text-pink-600">제출</span> Submit Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
