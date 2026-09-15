import { LimitationsComponent } from './sub_components/limitations/limitations.component';
import { OpenAccessComponent } from './sub_components/open-access/open-access.component';
import { OfferManagementComponent } from './components/offer-management/offer-management.component';
import { CatalogsComponent } from './components/catalogs/catalogs.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { SessionsScheduleComponent } from './components/sessions-schedule/sessions-schedule.component';
import { CreateOfferComponent } from './sub_components/create-offer/create-offer.component';
import { WorkerViewRegistrationComponent } from './components/worker-view-registration/worker-view-registration.component';
import { DetailInfoComponent } from './components/worker-view-registration/detail-info/detail-info.component';
import { StartCreateOfferComponent } from './sub_components/create-offer/start-create-offer/start-create-offer.component';
import { AuthGuard } from './core/guard/auth.guard';
import { ErrorPageComponent } from './sub_components/error-page/error-page.component';
import { ViewOfferComponent } from './sub_components/view-offer/view-offer.component';
import { DetailRejectionInfoComponent } from './components/offer-management/detail-rejection-info/detail-rejection-info.component';
import { AutoControlChangesComponent } from './sub_components/auto-control-changes/auto-control-changes.component';
import { RedirectGuard } from './core/guard/redirect.guard';
import { DepositComponent } from './sub_components/deposit/deposit.component';
import { DirectStartCreateOfferComponent } from './sub_components/create-direct-offer/direct-start-create-offer/direct-start-create-offer.component';
import { CreateDirectOfferComponent } from './sub_components/create-direct-offer/create-direct-offer.component';
import { CreateAgriDirectOfferComponent } from './sub_components/create-agri-direct-offer/create-agri-direct-offer.component';
import { UnrealizedVolumesWorkerComponent } from './components/unrealized-volumes-worker/unrealized-volumes-worker.component';
import { DetailUnrealizedVolumesInfoComponent } from './components/unrealized-volumes-worker/detail-unrealized-volumes-info/detail-unrealized-volumes-info.component';
import { ReportDealsComponent } from './components/report-deals/report-deals.component';
import { ReportTradingSessionOrdersComponent } from './components/report-trading-session-orders/report-trading-session-orders.component';
import { ReportParticipantsComponent } from './components/report-participants/report-participants.component';
import { ReportBiddingProcessComponent } from './components/report-bidding-process/report-bidding-process.component';

const routes: Routes = [
  { path: '', redirectTo: '/sessions-schedule', pathMatch: 'full' },
  {
    path: 'sessions-schedule',
    children: [
      { path: '', component: SessionsScheduleComponent },
      {
        path: 'worker-view-registration',
        canActivate: [AuthGuard],
        data: {
          idSection: 'IdSection',
          idSession: 'IdSession',
          sessionDate: 'sessionDate',
          sessionName: 'sessionName',
        },
        component: WorkerViewRegistrationComponent,
      },
      {
        path: 'detailInfo',
        canActivate: [AuthGuard],
        data: { json: 'json', session: 'session' },
        component: DetailInfoComponent,
      },
      { path: 'startcreateOffer', component: StartCreateOfferComponent },
      {
        path: 'startCreateDirectOffer',
        component: DirectStartCreateOfferComponent,
      },
    ],
  },
  {
    path: 'createOffer',
    component: CreateOfferComponent,
    canDeactivate: [RedirectGuard],
    canActivate: [AuthGuard],
  },
  {
    path: 'createDirectOffer',
    component: CreateDirectOfferComponent,
    canDeactivate: [RedirectGuard],
    canActivate: [AuthGuard],
  },
  {
    path: 'createAgriDirectOffer',
    component: CreateAgriDirectOfferComponent,
    canDeactivate: [RedirectGuard],
    canActivate: [AuthGuard],
  },
  { path: 'catalog', component: CatalogsComponent },
  { path: 'offer-management', component: OfferManagementComponent },
  {
    path: 'detailRejectionInfo',
    canActivate: [AuthGuard],
    component: DetailRejectionInfoComponent,
  },
  { path: 'view-offer', component: ViewOfferComponent },
  { path: 'autoControl', component: AutoControlChangesComponent },
  { path: 'open-access', component: OpenAccessComponent },
  { path: 'limitations', component: LimitationsComponent },
  { path: 'deposit', component: DepositComponent },
  { path: 'unrealizedVolumes', component: UnrealizedVolumesWorkerComponent },
  { path: 'report-deals', component: ReportDealsComponent },
  { path: 'report-bidding-process', component: ReportBiddingProcessComponent },
  {
    path: 'report-trading-session-orders',
    component: ReportTradingSessionOrdersComponent,
  },
  {
    path: 'report-participants',
    data: {
      idSection: 'IdSection',
      idSession: 'IdSession',
      sessionDate: 'sessionDate',
      sessionName: 'sessionName',
    },
    component: ReportParticipantsComponent,
  },
  {
    path: 'detailUnrealizedVolumesInfo',
    canActivate: [AuthGuard],
    data: { session: 'session' },
    component: DetailUnrealizedVolumesInfoComponent,
  },

  { path: '*', component: ErrorPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
