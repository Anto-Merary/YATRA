"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-black text-white pt-16 pb-8 overflow-hidden border-t-4 border-[#d946ef] font-mono relative z-20">
            <div className="container mx-auto px-4 md:px-8">

                {/* Main Title Section - Neo Brutalist */}
                <div className="border-4 border-white p-6 md:p-10 mb-12 bg-black relative">
                    <div className="absolute -top-3 left-4 bg-black px-2">
                        <span className="text-xs uppercase tracking-widest text-[#d946ef]">// Event</span>
                    </div>
                    <h1 className="text-[14vw] md:text-[10vw] font-black tracking-tighter leading-none text-white uppercase select-none">
                        YATRA'26
                    </h1>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#d946ef]"></div>
                </div>

                {/* Content Grid - Brutalist Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-4 border-white">

                    {/* Left: Address Block */}
                    <div className="p-6 md:p-8 border-b-4 md:border-b-0 md:border-r-4 border-white">
                        <div className="mb-4">
                            <span className="text-xs uppercase tracking-widest text-[#d946ef] block mb-2">// Location</span>
                            <h3 className="font-black text-xl md:text-2xl text-white uppercase tracking-tight">
                                Rajalakshmi Institute of Technology
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed font-mono">
                            Bangalore Highway Road, Kuthambakkam,<br />
                            Chennai, Tamil Nadu - 600124
                        </p>

                        {/* Email - Brutalist Style */}
                        <div className="mt-6 pt-4 border-t-2 border-white/20">
                            <a href="mailto:yatra@ritchennai.edu.in" className="inline-block bg-[#d946ef] text-black font-bold px-4 py-2 text-sm lowercase tracking-wider hover:bg-white hover:text-black transition-colors duration-200">
                                yatra@ritchennai.edu.in
                            </a>
                        </div>
                    </div>

                    {/* Right: Contact & Socials Block */}
                    <div className="p-6 md:p-8">
                        <span className="text-xs uppercase tracking-widest text-[#d946ef] block mb-4">// Contact</span>

                        {/* Contact Cards */}
                        <div className="space-y-4 mb-8">
                            <div className="border-2 border-white/30 p-3 hover:border-[#d946ef] transition-colors">
                                <span className="font-black text-white uppercase text-sm">Overall Coordinator</span>
                                <span className="text-[15px] text-[#d946ef] block uppercase tracking-widest">Derry Gabriel</span>
                                <a href="tel:+919884470171" className="text-gray-400 text-sm hover:text-white transition-colors font-mono">+91 98844 70171</a>
                            </div>

                            <div className="border-2 border-white/30 p-3 hover:border-[#d946ef] transition-colors">
                                <span className="font-black text-white uppercase text-sm">Event Committee Coordinator</span>
                                <span className="text-[15px] text-[#d946ef] block uppercase tracking-widest">Kishore Kumar S</span>
                                <a href="tel:+918825910614" className="text-gray-400 text-sm hover:text-white transition-colors font-mono">+91 88259 10614</a>
                            </div>

                            <div className="border-2 border-white/30 p-3 hover:border-[#d946ef] transition-colors">
                                <span className="font-black text-white uppercase text-sm">Joint Overall Coordinator</span>
                                <span className="text-[15px] text-[#d946ef] block uppercase tracking-widest">Muthu Kumaran</span>
                                <a href="tel:+919094141232" className="text-gray-400 text-sm hover:text-white transition-colors font-mono">+91 90941 41232</a>
                            </div>
                        </div>

                        {/* Social Icons - Brutalist Square */}
                        <div className="flex gap-2">
                            <a href="#" className="w-12 h-12 border-2 border-white flex items-center justify-center bg-black hover:bg-[#d946ef] hover:border-[#d946ef] hover:text-black transition-all duration-200 hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0_0_white]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                                </svg>
                            </a>
                            <a href="#" className="w-12 h-12 border-2 border-white flex items-center justify-center bg-black hover:bg-[#d946ef] hover:border-[#d946ef] hover:text-black transition-all duration-200 hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0_0_white]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="0" ry="0"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                </svg>
                            </a>
                            <a href="#" className="w-12 h-12 border-2 border-white flex items-center justify-center bg-black hover:bg-[#d946ef] hover:border-[#d946ef] hover:text-black transition-all duration-200 hover:translate-x-1 hover:-translate-y-1 hover:shadow-[-4px_4px_0_0_white]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                                </svg>
                            </a>
                        </div>
                    </div>

                </div>

                {/* Bottom Bar - Brutalist */}
                <div className="mt-8 pt-6 border-t-2 border-white/20 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-mono uppercase tracking-wider gap-4">
                    <p>&copy; 2026 Rajalakshmi Institutions</p>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-[#d946ef] transition-colors border-b border-transparent hover:border-[#d946ef]">Privacy Policy</Link>
                        <span className="text-white/20">/</span>
                        <Link href="#" className="hover:text-[#d946ef] transition-colors border-b border-transparent hover:border-[#d946ef]">Terms & Conditions</Link>
                    </div>
                </div>

            </div>
        </footer>
    );
}
