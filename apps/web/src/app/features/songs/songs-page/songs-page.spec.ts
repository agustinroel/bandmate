import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SongsPageComponent } from './songs-page';

describe('SongsPageComponent', () => {
  let component: SongsPageComponent;
  let fixture: ComponentFixture<SongsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongsPageComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SongsPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
