import type {
  Company,
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "src/shared/types/company.types";

export class CompanyService {
  async create(data: CreateCompanyDTO): Promise<Company> {
    const response = await window.api.company.create(data);

    if (!response.success) {
      throw new Error(response.error || "Failed to create company");
    }

    return response.data!;
  }

  async getAll() {
    const response = await window.api.company.getAll();

    if (!response.success) {
      throw new Error(response.error || "Failed to get companies");
    }

    return response.data!;
  }

  async getById(id: string) {
    const response = await window.api.company.getById(id);

    if (!response.success) {
      throw new Error(response.error || "Company not found");
    }

    return response.data!;
  }

  async update(id: string, data: UpdateCompanyDTO) {
    const response = await window.api.company.update(id, data);

    if (!response.success) {
      throw new Error(response.error || "Failed to update company");
    }

    return response.data!;
  }

  async delete(id: string) {
    const response = await window.api.company.delete(id);

    if (!response.success) {
      throw new Error(response.error || "Failed to delete company");
    }
  }
}

export const companyService = new CompanyService();
