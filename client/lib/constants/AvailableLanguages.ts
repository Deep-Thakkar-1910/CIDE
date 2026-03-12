import { Languages } from "@/generated/prisma/enums";

export const LanguageMetaMap: Record<
  Languages,
  {
    displayName: string;
    extension: string;
    imageUrl: string;
    judge0Code: number;
    languageInfo: string;
    correspondingMonacoLang: string;
    starterCode: string;
  }
> = {
  JAVASCRIPT: {
    displayName: "JavaScript",
    extension: ".js",
    imageUrl: "/assets/logos/javascript.png",
    judge0Code: 63,
    languageInfo: "JavaScript (Node.js 12.14.0)",
    correspondingMonacoLang: "javascript",
    starterCode: 'console.log("Hello, World!");\n',
  },
  PYTHON: {
    displayName: "Python",
    extension: ".py",
    imageUrl: "/assets/logos/python.png",
    judge0Code: 71,
    languageInfo: "Python (3.8.1)",
    correspondingMonacoLang: "python",
    starterCode: 'print("Hello, World!")\n',
  },
  JAVA: {
    displayName: "Java",
    extension: ".java",
    imageUrl: "/assets/logos/java.png",
    judge0Code: 62,
    languageInfo: "Java (OpenJDK 13.0.1)",
    correspondingMonacoLang: "java",
    starterCode:
      'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}\n',
  },
  CPP: {
    displayName: "C++",
    extension: ".cpp",
    imageUrl: "/assets/logos/cpp.png",
    judge0Code: 54,
    languageInfo: "C++ (GCC 9.2.0)",
    correspondingMonacoLang: "cpp",
    starterCode:
      '#include <iostream>\n\nint main() {\n  std::cout << "Hello, World!" << std::endl;\n  return 0;\n}\n',
  },
  GO: {
    displayName: "Go",
    extension: ".go",
    imageUrl: "/assets/logos/go.svg",
    judge0Code: 60,
    languageInfo: "Go (1.13.5)",
    correspondingMonacoLang: "go",
    starterCode:
      'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello, World!")\n}\n',
  },
  RUST: {
    displayName: "Rust",
    extension: ".rs",
    imageUrl: "/assets/logos/rust.svg",
    judge0Code: 73,
    languageInfo: "Rust (1.40.0)",
    correspondingMonacoLang: "rust",
    starterCode: 'fn main() {\n    println!("Hello, World!");\n}\n',
  },
  TYPESCRIPT: {
    displayName: "TypeScript",
    extension: ".ts",
    imageUrl: "/assets/logos/typescript.png",
    judge0Code: 74,
    languageInfo: "TypeScript (3.7.4)",
    correspondingMonacoLang: "typescript",
    starterCode: 'console.log("Hello, World!");\n',
  },
};
