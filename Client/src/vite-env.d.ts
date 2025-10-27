/// <reference types="vite/client" />

// To jest brakująca część:
declare module "*.modules.css" {
  const classes: { [key: string]: string };
  export default classes;
}
