declare global {
  namespace Express {
    interface Request {
      cookies?: { [key: string]: string };
      admin?: {
        id: string;
        status: "admin" | "super"
      };
    }
  }
}

export {};