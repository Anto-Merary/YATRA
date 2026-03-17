import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const FUNCTION_URL = "https://mnboyuyajxghqbbkdqhi.supabase.co/functions/v1/on-spot-register";

export function OnSpotRegistration() {
    const { toast } = useToast();
    const [pin, setPin] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        college: "",
        amount: "300",
        payment_mode: "Cash",
    });

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length >= 4) {
            setIsAuthenticated(true);
        } else {
            toast({
                title: "Invalid PIN",
                description: "Please enter a valid admin PIN.",
                variant: "destructive",
            });
        }
    };

    const handleLogout = () => {
        setPin("");
        setIsAuthenticated(false);
        setFormData({
            name: "",
            email: "",
            phone: "",
            college: "",
            amount: "300",
            payment_mode: "Cash",
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(FUNCTION_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, pin }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Registration failed");
            }

            toast({
                title: "Success!",
                description: `Ticket sent to ${formData.email}`,
                className: "bg-green-600 text-white border-none",
            });

            // Reset form (except amount/mode which might stay same)
            setFormData((prev) => ({
                ...prev,
                name: "",
                email: "",
                phone: "",
                college: "",
            }));
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
            if (error.message === "Invalid Admin PIN") {
                setTimeout(handleLogout, 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black text-white">
                <div className="w-full max-w-sm text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                        YATRA 2026
                    </h1>
                    <p className="text-gray-400 tracking-widest text-xs uppercase mb-8">
                        On-Spot Registration Console
                    </p>

                    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-2xl shadow-2xl">
                        <form onSubmit={handlePinSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Admin Access PIN
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <Input
                                        type="password"
                                        value={pin}
                                        onInput={(e) => setPin(e.currentTarget.value)}
                                        placeholder="Enter PIN"
                                        className="pl-10 text-center text-2xl tracking-widest bg-gray-900 border-gray-700 h-14"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-black bg-white hover:bg-gray-200 font-bold tracking-wider uppercase"
                            >
                                Access System
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 flex justify-center items-center">
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">New Registration</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-white uppercase text-xs tracking-wider"
                    >
                        <LogOut className="w-3 h-3 mr-2" />
                        Logout
                    </Button>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border-t-4 border-purple-500 p-6 rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="bg-gray-900 border-gray-800 focus:border-purple-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
                            <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="bg-gray-900 border-gray-800 focus:border-purple-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
                            <Input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="bg-gray-900 border-gray-800 focus:border-purple-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase">College Name</label>
                            <Input
                                name="college"
                                value={formData.college}
                                onChange={handleChange}
                                required
                                className="bg-gray-900 border-gray-800 focus:border-purple-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Amount (₹)</label>
                                <Input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    className="bg-gray-900 border-gray-800 focus:border-purple-500 font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase">Mode</label>
                                <select
                                    name="payment_mode"
                                    value={formData.payment_mode}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 rounded-md bg-gray-900 border border-gray-800 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full h-14 text-white font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-purple-900/20",
                                    "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Process & Send Ticket"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
