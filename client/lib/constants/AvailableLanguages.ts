import { Languages } from "@/generated/prisma/enums";

export const LanguageMetaMap: Record<
  Languages,
  {
    displayName: string;
    extension: string;
    imageUrl: string;
    judge0Code: number;
    correspondingMonacoLang: string;
  }
> = {
  JAVASCRIPT: {
    displayName: "Javascript",
    extension: ".js",
    imageUrl: "/assets/logos/javascript.png",
    judge0Code: 63,
    correspondingMonacoLang: "javascript",
  },
};
