import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SongEditorPageComponent } from './song-editor';

describe('SongEditorPageComponent', () => {
  let component: SongEditorPageComponent;
  let fixture: ComponentFixture<SongEditorPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SongEditorPageComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(SongEditorPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
