/* eslint-disable */
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

export class OfferManagementReuseStrategy implements RouteReuseStrategy {

  shouldDetach(): boolean {
    return false;
  }

  store(): void {}

  shouldAttach(): boolean {
    return false;
  }

  retrieve(): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(
    future: ActivatedRouteSnapshot,
    curr: ActivatedRouteSnapshot
  ): boolean {
    // do NOT reuse only for offer-management
    if (future.routeConfig?.path === 'offer-management') {
      const futureSection = future.queryParams['idSection'];
      const currSection = curr.queryParams['idSection'];

      const futureType = future.queryParams['type'];
      const currType = curr.queryParams['type'];

      return futureSection === currSection && futureType === currType;
    }
    return future.routeConfig === curr.routeConfig;
  }
}