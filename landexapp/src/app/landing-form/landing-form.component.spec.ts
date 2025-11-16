import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingFormComponent } from './landing-form.component';

describe('LandingFormComponent', () => {
  let component: LandingFormComponent;
  let fixture: ComponentFixture<LandingFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
