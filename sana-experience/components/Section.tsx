"use client";

import { ReactNode } from "react";

interface SectionProps {
    children: ReactNode;
    className?: string;
    id?: string;
}

export default function Section({ children, className = "", id }: SectionProps) {
    return (
        <section id={id} className={`min-h-screen flex flex-col justify-center items-center relative z-10 pointer-events-none ${className}`}>
            <div className="pointer-events-auto container mx-auto px-4 w-full">
                {children}
            </div>
        </section>
    );
}
