// src/consts.ts
export const base = import.meta.env.BASE_URL;

export const paths = {
  home: base === '' ? '/' : base,
  blog: `${base}/blog`,
};
