import { createContext, useContext } from "react";

/* Acciones de interfaz globales: paneles laterales, confirmaciones, avisos, navegación. */
export const UIContext = createContext(null);
export const useUI = () => useContext(UIContext);
