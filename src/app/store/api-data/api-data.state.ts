import { GetByNameResponse } from '../../core/services/catalog-service.service';

export interface ApiDataState {
  sections: GetByNameResponse;
}

export const initialApiDataState: ApiDataState = {
  sections: null,
};
