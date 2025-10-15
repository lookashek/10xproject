import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MenuTileProps } from '@/types';

export function MenuTile({ icon, title, description, href, variant = 'default' }: MenuTileProps) {
  const isPrimary = variant === 'primary';

  return (
    <a
      href={href}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl group"
      aria-label={`${title}: ${description}`}
      data-testid={`menu-tile-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Card 
        className={`
          h-full transition-all duration-200
          hover:scale-[1.02] hover:shadow-xl
          active:scale-[0.98]
          ${isPrimary 
            ? 'border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/70' 
            : 'border-2 hover:border-primary/50 hover:bg-accent/50'
          }
        `}
      >
        <CardHeader className="space-y-4 p-6">
          <div 
            className={`
              inline-flex p-4 rounded-lg w-fit transition-colors
              ${isPrimary 
                ? 'bg-primary/20 group-hover:bg-primary/30' 
                : 'bg-primary/10 group-hover:bg-primary/20'
              }
            `}
          >
            <div className="w-10 h-10 text-primary">
              {icon}
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-semibold">
              {title}
            </CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </a>
  );
}

