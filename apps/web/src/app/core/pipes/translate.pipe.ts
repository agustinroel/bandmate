import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false, // Ensures reactive re-rendering on language signal change
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: string, fallback?: string): string {
    return this.i18n.t(key, fallback);
  }
}
