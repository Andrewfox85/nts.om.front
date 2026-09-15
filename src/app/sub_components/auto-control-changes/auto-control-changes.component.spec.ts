/* eslint-disable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoControlChangesComponent } from './auto-control-changes.component';

describe('AutoControlChangesComponent', () => {
  let component: AutoControlChangesComponent;
  let fixture: ComponentFixture<AutoControlChangesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutoControlChangesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoControlChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
