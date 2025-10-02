import { MapPin } from 'lucide-react';

interface Lawyer {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
}

interface IndiaMapProps {
  lawyers: Lawyer[];
}

const IndiaMap = ({ lawyers }: IndiaMapProps) => {
  // Convert lat/lng to SVG coordinates
  const latLngToSVG = (lat: number, lng: number) => {
    // India bounding box: lat 8-35, lng 68-97
    const x = ((lng - 68) / (97 - 68)) * 700 + 50;
    const y = ((35 - lat) / (35 - 8)) * 800 + 50;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl overflow-hidden">
      <svg viewBox="0 0 800 900" className="w-full h-full">
        {/* India map detailed outline */}
        <g className="animate-fade-in">
          {/* Main India outline */}
          <path
            d="M 380 120 
               L 420 140 L 450 165 L 470 190 L 490 220 L 505 255 
               L 515 295 L 520 340 L 520 385 L 515 430 
               L 505 475 L 490 515 L 470 550 L 445 585 
               L 415 615 L 380 640 L 340 655 L 300 665 
               L 260 670 L 220 665 L 180 650 L 145 625 
               L 120 595 L 100 560 L 85 520 L 75 475 
               L 70 430 L 70 385 L 75 340 L 85 295 
               L 100 255 L 120 220 L 145 190 L 175 165 
               L 210 145 L 250 130 L 295 120 L 340 115 Z"
            fill="hsl(var(--card))"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            className="drop-shadow-lg"
          />
          
          {/* State borders */}
          <g stroke="hsl(var(--border))" strokeWidth="1" fill="none" opacity="0.5">
            <path d="M 120 220 L 180 280 L 240 320" />
            <path d="M 240 320 L 280 360 L 320 380" />
            <path d="M 320 380 L 360 420 L 380 460" />
            <path d="M 200 240 L 260 260 L 300 280" />
            <path d="M 350 200 L 400 240 L 430 280" />
            <path d="M 430 280 L 460 340 L 480 400" />
            <path d="M 280 460 L 320 500 L 350 540" />
          </g>
          
          {/* Major cities indicators */}
          <g fill="hsl(var(--muted))" opacity="0.3">
            <circle cx="190" cy="420" r="25" /> {/* Mumbai */}
            <circle cx="300" cy="270" r="25" /> {/* Delhi */}
            <circle cx="410" cy="480" r="25" /> {/* Bangalore */}
            <circle cx="360" cy="530" r="25" /> {/* Chennai */}
            <circle cx="340" cy="450" r="25" /> {/* Hyderabad */}
            <circle cx="240" cy="400" r="25" /> {/* Pune */}
          </g>
          
          {/* City labels */}
          <g fill="hsl(var(--muted-foreground))" fontSize="12" fontFamily="system-ui">
            <text x="190" y="455" textAnchor="middle" className="font-semibold">Mumbai</text>
            <text x="300" y="255" textAnchor="middle" className="font-semibold">Delhi</text>
            <text x="410" y="515" textAnchor="middle" className="font-semibold">Bangalore</text>
            <text x="360" y="565" textAnchor="middle" className="font-semibold">Chennai</text>
            <text x="340" y="485" textAnchor="middle" className="font-semibold">Hyderabad</text>
            <text x="240" y="435" textAnchor="middle" className="font-semibold">Pune</text>
          </g>
        </g>

        {/* Lawyer location markers */}
        <g>
          {lawyers.map((lawyer, index) => {
            const pos = latLngToSVG(lawyer.lat, lawyer.lng);
            
            return (
              <g 
                key={lawyer.id} 
                className="cursor-pointer hover:opacity-100 transition-all animate-scale-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Pulsing outer circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="20"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="2"
                  opacity="0.4"
                >
                  <animate
                    attributeName="r"
                    values="20;30;20"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0.1;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Main marker */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="10"
                  fill="hsl(var(--accent))"
                  stroke="white"
                  strokeWidth="3"
                  className="drop-shadow-lg"
                >
                  <animate
                    attributeName="r"
                    values="10;12;10"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Hover tooltip */}
                <g opacity="0" className="hover:opacity-100 transition-opacity">
                  <rect
                    x={pos.x - 60}
                    y={pos.y - 50}
                    width="120"
                    height="35"
                    rx="5"
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--border))"
                    strokeWidth="2"
                    className="drop-shadow-xl"
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 35}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill="hsl(var(--foreground))"
                  >
                    {lawyer.name.split(' ').slice(1).join(' ')}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y - 22}
                    textAnchor="middle"
                    fontSize="9"
                    fill="hsl(var(--muted-foreground))"
                  >
                    {lawyer.location}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Decorative grid lines */}
        <g stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.2">
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 90} x2="800" y2={i * 90} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="900" />
          ))}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-2 border-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-accent"></div>
            <div className="absolute inset-0 w-4 h-4 rounded-full bg-accent animate-ping opacity-30"></div>
          </div>
          <span className="text-sm font-medium">Lawyer Location</span>
        </div>
        <p className="text-xs text-muted-foreground">{lawyers.length} lawyers across India</p>
      </div>

      {/* Info card */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border-2 border-border max-w-xs">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-accent" />
          National Coverage
        </h3>
        <p className="text-sm text-muted-foreground">
          Our network spans across major cities and states, providing accessible legal services nationwide.
        </p>
      </div>
    </div>
  );
};

export default IndiaMap;
