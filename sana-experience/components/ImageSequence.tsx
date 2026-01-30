"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

interface ImageSequenceProps {
    frameCount: number;
    folderPath: string;
    fileNamePrefix: string;
    fileNameSuffix: string;
}

export interface ImageSequenceHandle {
    drawFrame: (progress: number) => void;
    loaded: boolean;
}

const ImageSequence = forwardRef<ImageSequenceHandle, ImageSequenceProps>(
    ({ frameCount, folderPath, fileNamePrefix, fileNameSuffix }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [imagesLoaded, setImagesLoaded] = useState(false);
        const imagesRef = useRef<HTMLImageElement[]>([]);

        // Preload images
        useEffect(() => {
            let loadedCount = 0;
            const images: HTMLImageElement[] = [];

            for (let i = 1; i <= frameCount; i++) {
                const img = new Image();
                const paddedIndex = i.toString().padStart(3, "0");
                img.src = `${folderPath}/${fileNamePrefix}${paddedIndex}${fileNameSuffix}`;

                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === frameCount) {
                        setImagesLoaded(true);
                    }
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${img.src}`);
                    loadedCount++;
                    if (loadedCount === frameCount) {
                        setImagesLoaded(true);
                    }
                };
                images.push(img);
            }
            imagesRef.current = images;
        }, [frameCount, folderPath, fileNamePrefix, fileNameSuffix]);

        // Expose drawFrame method
        useImperativeHandle(ref, () => ({
            loaded: imagesLoaded,
            drawFrame: (progress: number) => {
                if (!canvasRef.current || imagesRef.current.length === 0) return;

                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");
                if (!context) return;

                // Clamp progress between 0 and 1
                const safeProgress = Math.max(0, Math.min(1, progress));

                // Calculate frames to blend
                const maxIndex = frameCount - 1;
                const exactFrameIndex = safeProgress * maxIndex;
                const currentIndex = Math.floor(exactFrameIndex);
                const nextIndex = Math.min(currentIndex + 1, maxIndex);
                const blendFactor = exactFrameIndex - currentIndex;

                const img1 = imagesRef.current[currentIndex];
                const img2 = imagesRef.current[nextIndex];

                // Helper to draw image "cover" style
                const drawImageCover = (img: HTMLImageElement, opacity: number) => {
                    if (!img || !img.complete || img.naturalWidth === 0) return;

                    const hRatio = canvas.width / img.width;
                    const vRatio = canvas.height / img.height;
                    const ratio = Math.max(hRatio, vRatio);
                    const centerShift_x = (canvas.width - img.width * ratio) / 2;
                    const centerShift_y = (canvas.height - img.height * ratio) / 2;

                    context.globalAlpha = opacity;
                    context.drawImage(
                        img,
                        0,
                        0,
                        img.width,
                        img.height,
                        centerShift_x,
                        centerShift_y,
                        img.width * ratio,
                        img.height * ratio
                    );
                };

                // Clear and render with smooth frame blending
                context.clearRect(0, 0, canvas.width, canvas.height);

                // Draw frames with smooth blending for ultra-smooth scrolling
                drawImageCover(img1, 1.0);
                if (blendFactor > 0 && img2 && img2 !== img1) {
                    drawImageCover(img2, blendFactor);
                }

                // Reset alpha
                context.globalAlpha = 1.0;
            },
        }));

        // Initial render and resize handling
        useEffect(() => {
            if (!imagesLoaded || !canvasRef.current) return;

            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Initial draw
            const context = canvas.getContext("2d");
            const img = imagesRef.current[0];
            if (context && img) {
                const hRatio = canvas.width / img.width;
                const vRatio = canvas.height / img.height;
                const ratio = Math.max(hRatio, vRatio);
                const centerShift_x = (canvas.width - img.width * ratio) / 2;
                const centerShift_y = (canvas.height - img.height * ratio) / 2;
                context.drawImage(
                    img,
                    0,
                    0,
                    img.width,
                    img.height,
                    centerShift_x,
                    centerShift_y,
                    img.width * ratio,
                    img.height * ratio
                );
            }

            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                // We might need to redraw the current frame here, but since we don't store state, 
                // the next scroll update will fix it. Or we could store lastFrame in a ref.
            };
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }, [imagesLoaded]);

        if (!imagesLoaded) {
            return (
                <div className="fixed inset-0 flex items-center justify-center bg-black text-white z-50">
                    <div className="text-2xl font-bold animate-pulse">Initializing Soundscape...</div>
                </div>
            );
        }

        return (
            <canvas
                ref={canvasRef}
                className="fixed top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
            />
        );
    }
);

ImageSequence.displayName = "ImageSequence";
export default ImageSequence;
