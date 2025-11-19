import React, { useEffect, useRef } from "react";

const MathJaxRenderer = ({ children, inline }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([containerRef.current]).catch((err) =>
                console.error("MathJax typesetting failed:", err)
            );
        }
    }, [children, inline]);

    const content = `${children}`;

    return <span ref={containerRef}>{content}</span>;
};

export default MathJaxRenderer;
