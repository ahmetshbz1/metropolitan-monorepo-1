//  "ProductsSearchContext.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { createContext, useContext, useState } from "react";

// Products search context - sadece products sayfası için
type ProductsSearchContextType = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export const ProductsSearchContext = createContext<ProductsSearchContextType>({
  searchQuery: "",
  setSearchQuery: () => {},
});

export const useProductsSearch = () => useContext(ProductsSearchContext);

export const ProductsSearchProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ProductsSearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </ProductsSearchContext.Provider>
  );
};