declare module "*.txt" {
  const content: string;
  export default content;
}

declare module "*.yaml" {
  const catalog: {
    meta: { code: string; name: string; direction: "ltr" | "rtl" };
    messages: Record<string, string>;
  };
  export default catalog;
}
