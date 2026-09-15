/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnrealizedVolumesWorkerComponent } from './unrealized-volumes-worker.component';

describe('UnrealizedVolumesWorkerComponent', () => {
  let component: UnrealizedVolumesWorkerComponent;
  let fixture: ComponentFixture<UnrealizedVolumesWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnrealizedVolumesWorkerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnrealizedVolumesWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
