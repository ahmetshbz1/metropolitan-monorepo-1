//  "ScrollToTopContext.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import { createContext, useContext } from "react";

// Scroll-to-top context
type ScrollToTopContextType = {
  scrollToTop: (routeName: string) => void;
  registerScrollHandler: (routeName: string, handler: () => void) => void;
  unregisterScrollHandler: (routeName: string) => void;
};

export const ScrollToTopContext = createContext<ScrollToTopContextType>({
  scrollToTop: () => {},
  registerScrollHandler: () => {},
  unregisterScrollHandler: () => {},
});

export const useScrollToTop = () => useContext(ScrollToTopContext);

export const ScrollToTopProvider = ({
  children,
  scrollToTop,
  registerScrollHandler,
  unregisterScrollHandler,
}: {
  children: React.ReactNode;
  scrollToTop: (routeName: string) => void;
  registerScrollHandler: (routeName: string, handler: () => void) => void;
  unregisterScrollHandler: (routeName: string) => void;
}) => {
  return (
    <ScrollToTopContext.Provider
      value={{ scrollToTop, registerScrollHandler, unregisterScrollHandler }}
    >
      {children}
    </ScrollToTopContext.Provider>
  );
};