export interface Company {
  company_id: string;
  company_name: string;
  contact_person?: string;
  phone?: string;
  created_at: string;
}

export interface CreateCompanyDTO {
  company_name: string;
  contact_person?: string;
  phone?: string;
}

export interface UpdateCompanyDTO {
  company_name?: string;
  contact_person?: string;
  phone?: string;
}
