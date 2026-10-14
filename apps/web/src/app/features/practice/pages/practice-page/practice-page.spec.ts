import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { PracticePageComponent } from './practice-page';

describe('PracticePageComponent', () => {
  let component: PracticePageComponent;
  let fixture: ComponentFixture<PracticePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticePageComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
