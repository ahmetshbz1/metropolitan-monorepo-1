import { translations } from '@/translations';

interface BrandsProps {
  currentLang: string;
}

const brands = [
  {
    id: 'yayla',
    name: 'YAYLA',
    image: '/lovable-uploads/d0c7e0fb-e60a-4fbd-8531-3f5efd0bcf2d.png'
  },
  {
    id: 'torku',
    name: 'Torku',
    image: '/lovable-uploads/aec826ea-bf75-47bf-8301-f3a6a28244e5.png'
  },
  {
    id: 'dimes',
    name: 'DIMES',
    image: '/lovable-uploads/731ddbda-2b3b-4b0c-bb59-6605bfe9b0c0.png'
  },
  {
    id: 'legurme',
    name: 'Yayla',
    image: '/lovable-uploads/1cac65f0-b02b-42da-8ea2-1b2fc8f1066f.png'
  }
];

export const BrandsSection = ({ currentLang }: BrandsProps) => {
  const t = translations[currentLang as keyof typeof translations];

  return (
    <div className="mb-12 sm:mb-16">
      <div className="text-center mb-8 sm:mb-12">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-foreground">
          {t.products.brands || 'Markalarımız'}
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
          {t.products.brandsSubtitle || 'Güvenilir ve kaliteli markalarımız'}
        </p>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8">
        {brands.map((brand) => (
          <div
            key={brand.id}
            className="group cursor-pointer transition-transform duration-300 hover:scale-110"
          >
            <div className="w-24 h-16 sm:w-32 sm:h-20 md:w-40 md:h-24 flex items-center justify-center p-2 sm:p-4 bg-card rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <img
                src={brand.image}
                alt={brand.name}
                className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
