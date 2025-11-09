/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import {
  Company,
  CreateCompanyDTO,
  UpdateCompanyDTO,
} from "../../shared/types/company.types.js";

export class CompanyService {
  constructor(private db: Database) {}

  create(data: CreateCompanyDTO): Company {
    const company_id = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO company (company_id, company_name, contact_person, phone)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      company_id,
      data.company_name,
      data.contact_person || null,
      data.phone || null
    );

    return this.getById(company_id)!;
  }

  getById(company_id: string): Company | null {
    const stmt = this.db.prepare(`
      SELECT * FROM company WHERE company_id = ?
    `);

    return stmt.get(company_id) as Company | null;
  }

  getAll(): Company[] {
    const stmt = this.db.prepare("SELECT * FROM company");
    return stmt.all() as Company[];
  }

  update(company_id: string, data: UpdateCompanyDTO): Company | null {
    const existingCompany = this.getById(company_id);
    if (!existingCompany) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.company_name !== undefined) {
      updates.push("company_name = ?");
      params.push(data.company_name);
    }

    if (data.contact_person !== undefined) {
      updates.push("contact_person = ?");
      params.push(data.contact_person);
    }

    if (data.phone !== undefined) {
      updates.push("phone = ?");
      params.push(data.phone);
    }

    if (updates.length === 0) {
      return existingCompany;
    }

    params.push(company_id);

    const stmt = this.db.prepare(`
      UPDATE company 
      SET ${updates.join(", ")}
      WHERE company_id = ?
    `);

    stmt.run(...params);

    return this.getById(company_id);
  }

  delete(company_id: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM company WHERE company_id = ?
    `);

    const result = stmt.run(company_id);
    return result.changes > 0;
  }
}
