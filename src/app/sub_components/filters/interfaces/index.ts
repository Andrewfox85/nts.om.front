export interface CatalogItem {
  id: number;
  name: string;
  description: string | null;
}

export interface SessionsResponce {
  refbooks: CatalogItem[];
}
