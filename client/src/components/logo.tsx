import { Link } from "wouter";
import logoImage from "@assets/IMG_3002_1769784599408.png";

export function Logo() {
  return (
    <Link href="/">
      <div className="h-8 flex items-center">
        <img 
          src={logoImage} 
          alt="EventPing" 
          className="h-[150px] w-auto cursor-pointer"
          data-testid="logo-eventping"
        />
      </div>
    </Link>
  );
}
