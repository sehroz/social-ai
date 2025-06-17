
import Image from 'next/image';

interface AppLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function AppLogo({ width = 150, height = 50, className }: AppLogoProps) {
  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <Image
        src="https://limeadvertising.com/wp-content/uploads/2024/10/Lime-Adversiting-ClientsLogos-1.png"
        alt="Postify by Lime Advertising Inc. Logo"
        layout="fill"
        objectFit="contain"
        priority
      />
    </div>
  );
}
