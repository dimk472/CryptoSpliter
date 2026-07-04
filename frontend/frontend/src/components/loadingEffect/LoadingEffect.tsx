import '../styles/LoadingEffect.css';
import { useEffect, useRef } from 'react';
import LogoImg from '../../assets/logo.png';

interface LoadingEffectProps {
    onAnimationComplete?: () => void;
}

function LoadingEffect({ onAnimationComplete }: LoadingEffectProps) {
    const topHalfRef = useRef<HTMLDivElement>(null);
    const bottomHalfRef = useRef<HTMLDivElement>(null);
    const heroSectionRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const topHalf = topHalfRef.current;
        const bottomHalf = bottomHalfRef.current;
        const heroSection = document.querySelector(".hero") as HTMLElement;

        if (!topHalf || !bottomHalf || !heroSection) return;

        heroSectionRef.current = heroSection;

        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.classList.add("intro-bg");


        topHalf.style.backgroundColor = "#000000";
        bottomHalf.style.backgroundColor = "#000000";

        const createSplitLogo = (halfEl: HTMLDivElement, position: 'top' | 'bottom') => {
            const existingLogo = halfEl.querySelector("img[data-split-logo='1']");
            if (existingLogo) return;

            const logo = document.createElement("img");
            logo.dataset.splitLogo = "1";
            logo.alt = "";
            logo.decoding = "async";
            logo.loading = "eager";
            logo.src = LogoImg;

            Object.assign(logo.style, {
                position: "absolute",
                left: "50%",
                width: "220px",
                maxWidth: "52vw",
                height: "auto",
                objectFit: "contain",
                transform: "translateX(-50%)",
                zIndex: "2",
                pointerEvents: "none",
            });

            if (position === "top") {
                logo.style.bottom = "0";
                logo.style.transform = "translate(-50%, 50%)";
                logo.style.objectPosition = "top";
                logo.style.clipPath = "inset(50% 0 0 0)";
            } else {
                logo.style.top = "0";
                logo.style.transform = "translate(-50%, -50%)";
                logo.style.objectPosition = "bottom";
                logo.style.clipPath = "inset(0 0 50% 0)";
            }

            halfEl.appendChild(logo);
        };

        createSplitLogo(topHalf, "top");
        createSplitLogo(bottomHalf, "bottom");

        const open = () => {
            heroSection.style.opacity = "1";
            heroSection.style.visibility = "visible";
            topHalf.classList.add("reveal");
            bottomHalf.classList.add("reveal");

            setTimeout(() => {
                topHalf.style.opacity = "0";
                bottomHalf.style.opacity = "0";
                topHalf.style.visibility = "hidden";
                bottomHalf.style.visibility = "hidden";

                setTimeout(() => {
                    heroSection.classList.add("is-ready");
                    document.documentElement.classList.remove("intro-bg");
                    document.body.style.overflow = "";
                    document.documentElement.style.overflow = "";
                    onAnimationComplete?.();
                }, 400);
            }, 800);
        };

        const timer = setTimeout(open, 150);

        return () => {
            clearTimeout(timer);
            document.documentElement.classList.remove("intro-bg");
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
            if (heroSectionRef.current) {
                heroSectionRef.current.classList.remove("is-ready");
            }
        };
    }, [onAnimationComplete]);

    return (
        <>
            <div ref={topHalfRef} className="top-half"></div>
            <div ref={bottomHalfRef} className="bottom-half"></div>
        </>
    );
}

export default LoadingEffect;