/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailUnrealizedVolumesInfoComponent } from './detail-unrealized-volumes-info.component';

describe('DetailUnrealizedVolumesInfoComponent', () => {
  let component: DetailUnrealizedVolumesInfoComponent;
  let fixture: ComponentFixture<DetailUnrealizedVolumesInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailUnrealizedVolumesInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailUnrealizedVolumesInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
