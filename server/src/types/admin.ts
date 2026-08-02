export interface Admin {
  id: number;
  username: string;
  password: string;
  admin_status: "super" | "admin";
}

export interface CreateAdminDTO {
  username: string;
  password: string;
  admin_status: "super" | "admin";
}

export interface UpdateAdminDTO {
  username?: string;
  password?: string;
  admin_status?: "super" | "admin";
}
