import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SetlistsPageComponent } from './setlists-page';

describe('SetlistsPageComponent', () => {
  let component: SetlistsPageComponent;
  let fixture: ComponentFixture<SetlistsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetlistsPageComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SetlistsPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
