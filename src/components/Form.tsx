import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

// Constants
const rajalakshmiInstitutions = ['RIT', 'RMCHRI', 'REC', 'RSB', 'RSA'];
const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com'];

const domainConfigs: Record<string, string | null> = {
    'RIT': 'ritchennai.edu.in',
    'RSA': 'rajalakshmi.edu.in',
    'REC': 'rajalakshmi.edu.in',
    'RMCHRI': 'rajalakshmi.edu.in',
    'RSB': 'rajalakshmi.edu.in',
    'OTHER': null
};

export function RegistrationForm() {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        institution: '',
        otherCollege: '',
        regNumber: '',
        mobile: '',
        email: ''
    });

    const emailInputRef = useRef<HTMLInputElement>(null);

    // Derived state for visibility
    const showOtherCollege = formData.institution === 'OTHER';
    const showRegNumber = rajalakshmiInstitutions.includes(formData.institution);

    // Real-time validation logic
    useEffect(() => {
        const validateEmail = () => {
            const email = formData.email.toLowerCase().trim();
            const selectedInst = formData.institution;
            const requiredDomain = domainConfigs[selectedInst];
            const input = emailInputRef.current;

            if (!input) return;

            // Reset validity if fields are empty
            if (!email || !selectedInst) {
                input.setCustomValidity("");
                return;
            }

            // 1. Check for specific institution domain mismatch
            if (requiredDomain) {
                if (!email.endsWith(requiredDomain)) {
                    input.setCustomValidity(`Please use your official college email ending in @${requiredDomain}`);
                } else {
                    input.setCustomValidity("");
                }
            }
            // 2. Check for personal emails (mainly for "Other" category)
            else {
                const parts = email.split('@');
                const domain = parts.length > 1 ? parts[1] : '';
                if (domain && personalDomains.includes(domain)) {
                    input.setCustomValidity("Please use an official institution email address, not a personal one (Gmail, Yahoo, etc).");
                } else {
                    input.setCustomValidity("");
                }
            }
        };

        validateEmail();
    }, [formData.email, formData.institution]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Reset logic when institution changes
            if (name === 'institution') {
                newData.otherCollege = '';
                newData.regNumber = '';
                newData.email = ''; // Reset email to force user to re-enter for new logic
            }
            return newData;
        });
    };

    const handleBlur = () => {
        if (emailInputRef.current) {
            // Trigger the browser bubble if invalid
            emailInputRef.current.reportValidity();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emailInputRef.current && !emailInputRef.current.checkValidity()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = {
                purpose: "yatra_entry",
                name: formData.fullName,
                email: formData.email,
                phone: formData.mobile,
                institution_type: formData.institution.toLowerCase(),
                college: formData.institution === 'OTHER' ? formData.otherCollege : undefined,
                register_number: formData.institution !== 'OTHER' ? formData.regNumber : undefined,
                response_mode: "json",
                use_express_flow: true,
            };

            const res = await fetch("/api/ccavenue-init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to initiate payment");
            }

            const responseData = await res.json();
            // fnError is no longer relevant


            if (responseData.error) throw new Error(responseData.error);

            if (responseData.already_paid) {
                toast({
                    title: "Already Registered",
                    description: "You have already paid for the Yatra Entry pass.",
                    variant: "default",
                });
                return;
            }

            if (responseData.mode === "form_post" && responseData.formAction && Array.isArray(responseData.formFields)) {
                const formActionUrl = responseData.formAction.startsWith("http") ? responseData.formAction : `${window.location.origin}${responseData.formAction}`;
                const resForm = await fetch(formActionUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ fields: responseData.formFields }),
                });
                if (!resForm.ok) {
                    const errText = await resForm.text();
                    throw new Error(`Payment redirect failed (${resForm.status})${errText ? `: ${errText.slice(0, 80)}` : ""}`);
                }
                const html = await resForm.text();
                document.open();
                document.write(html);
                document.close();
            } else if (responseData.mode === "form" && responseData.action) {
                const form = document.createElement("form");
                form.method = "POST";
                form.action = responseData.action;

                const addField = (name: string, value: string) => {
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = name;
                    input.value = value;
                    form.appendChild(input);
                };

                addField("encRequest", responseData.encRequest);
                addField("access_code", responseData.access_code);

                document.body.appendChild(form);
                form.submit();
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (error) {
            console.error("Payment initiation failed:", error);
            toast({
                title: "Registration Failed",
                description: error instanceof Error ? error.message : "Could not initiate payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-4 relative" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

        /* Neo-Brutalism Utility Classes */
        .neo-shadow {
            box-shadow: 5px 5px 0px 0px #000000;
            transition: all 0.2s ease;
        }
        
        .neo-shadow:active {
            box-shadow: 2px 2px 0px 0px #000000;
            transform: translate(3px, 3px);
        }

        .neo-input {
            border: 3px solid #000;
            box-shadow: 4px 4px 0px 0px #000;
            transition: all 0.2s ease;
        }

        .neo-input:focus {
            outline: none;
            box-shadow: 2px 2px 0px 0px #000;
            transform: translate(2px, 2px);
        }

        /* Invalid input state for visual feedback */
        input:invalid:not(:placeholder-shown) {
            border-color: #FF5757;
            background-color: #fff0f0;
        }

        /* Custom scrollbar for dropdown */
        select {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%2013-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 0.65em auto;
            opacity: 1;
        }
      `}</style>

            {/* Main Container */}
            <div className="w-full max-w-lg border-4 border-black neo-shadow p-4 md:p-8 relative" style={{ backgroundColor: '#FFDE59' }}>
                {/* Decorative Label */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#FF5757] border-4 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-lg md:text-xl font-bold text-black uppercase tracking-wider">Registration</h1>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">

                    {/* Name Field */}
                    <div className="space-y-2">
                        <label htmlFor="fullName" className="block font-bold text-base md:text-lg uppercase text-black font-['Space_Grotesk']">Full Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                            className="w-full bg-white p-2 md:p-3 font-medium border-3 border-black neo-input placeholder-gray-500 text-black"
                        />
                    </div>

                    {/* Institution Dropdown */}
                    <div className="space-y-2 relative z-20">
                        <label htmlFor="institution" className="block font-bold text-base md:text-lg uppercase text-black font-['Space_Grotesk']">Select Institution</label>
                        <select
                            id="institution"
                            name="institution"
                            value={formData.institution}
                            onChange={handleChange}
                            required
                            className="w-full bg-white p-2 md:p-3 text-base font-medium border-3 border-black neo-input cursor-pointer text-black"
                        >
                            <option value="" disabled>Choose an option...</option>
                            <option value="RIT">Rajalakshmi Institute of Technology (RIT)</option>
                            <option value="RMCHRI">Rajalakshmi Medical College (RMCHRI)</option>
                            <option value="REC">Rajalakshmi Engineering College (REC)</option>
                            <option value="RSB">Rajalakshmi School of Business (RSB)</option>
                            <option value="RSA">Rajalakshmi School of Architecture (RSA)</option>
                            <option value="OTHER">Other Institutions</option>
                        </select>
                    </div>

                    {/* Dynamic Field: Other College Name */}
                    {showOtherCollege && (
                        <div className="space-y-2">
                            <label htmlFor="otherCollege" className="block font-bold text-base md:text-lg uppercase text-black font-['Space_Grotesk']">College Name</label>
                            <input
                                type="text"
                                id="otherCollege"
                                name="otherCollege"
                                value={formData.otherCollege}
                                onChange={handleChange}
                                placeholder="Enter your college name"
                                required
                                className="w-full bg-[#CB6CE6] placeholder-black text-black p-2 md:p-3 font-medium border-3 border-black neo-input"
                            />
                        </div>
                    )}

                    {/* Dynamic Field: Register Number */}
                    {showRegNumber && (
                        <div className="space-y-2">
                            <label htmlFor="regNumber" className="block font-bold text-base md:text-lg uppercase text-black font-['Space_Grotesk']">Register Number</label>
                            <input
                                type="text"
                                id="regNumber"
                                name="regNumber"
                                value={formData.regNumber}
                                onChange={handleChange}
                                placeholder="e.g. 211001001"
                                required
                                className="w-full bg-[#5CE1E6] placeholder-black text-black p-2 md:p-3 font-medium border-3 border-black neo-input"
                            />
                        </div>
                    )}

                    {/* Mobile Number */}
                    <div className="space-y-2">
                        <label htmlFor="mobile" className="block font-bold text-base md:text-lg uppercase text-black font-['Space_Grotesk']">Mobile Number</label>
                        <input
                            type="tel"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleChange}
                            placeholder="9876543210"
                            pattern="[0-9]{10}"
                            required
                            className="w-full bg-white p-2 md:p-3 font-medium border-3 border-black neo-input placeholder-gray-500 text-black"
                        />
                    </div>

                    {/* College Email */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="block font-bold text-base md:text-lg uppercase text-black font-['Space_Grotesk']">College Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            ref={emailInputRef}
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={formData.institution ? "Enter Official College Email ID" : "Select institution first..."}
                            required
                            disabled={!formData.institution}
                            className="w-full bg-white p-2 md:p-3 font-medium border-3 border-black neo-input placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-black"
                        />
                    </div>

                    {/* CTA Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black text-white text-lg md:text-xl font-bold py-4 px-6 border-4 border-black shadow-[6px_6px_0px_0px_#8C52FF] hover:shadow-[3px_3px_0px_0px_#8C52FF] hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-200 mt-8 uppercase disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "PROCESSING..." : "Proceed to Pay ->"}
                    </button>
                </form>
            </div>
        </div>
    );
}
