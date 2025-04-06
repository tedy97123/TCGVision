import * as React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function SitemarkIcon() {
  return (
    <SvgIcon sx={{ height: 21, width: 100, mr: 2 }}>
<svg
    width="120"
    height="30"
    viewBox="0 0 120 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
>
    <path
        d="M10 15C15 5 25 5 30 15C25 25 15 25 10 15Z"
        fill="url(#grad1)"
        stroke="black"
        stroke-width="2"
    />
    <circle cx="20" cy="15" r="5" fill="black"/>
    
    <text x="40" y="20" font-family="Arial, sans-serif" font-size="20" fill="#4876EE" font-weight="bold">
        TcgVision
    </text>

    <defs>
        <linearGradient id="grad1" x1="10" y1="10" x2="30" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#00D3AB"/>
            <stop offset="50%" stop-color="#4876EF"/>
            <stop offset="100%" stop-color="#B4C0D3"/>
        </linearGradient>
    </defs>
</svg>
    </SvgIcon>
  );
}
