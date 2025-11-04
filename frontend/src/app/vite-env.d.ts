/// <reference types="vite/client" />

// Deklaracja dla modułów .scss
declare module "*.module.scss" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// Opcjonalne: Deklaracja dla zwykłych plików .scss (jeśli będziesz je importować)
declare module "*.scss" {
  const content: string;
  export default content;
}
