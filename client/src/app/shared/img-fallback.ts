import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Remplace une image introuvable par le visuel EliteFit par défaut. */
@Directive({ selector: 'img[appImgFallback]' })
export class ImgFallback {
  private readonly img = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;

  @HostListener('error')
  protected onError() {
    if (!this.img.src.endsWith('/placeholder.svg')) this.img.src = '/placeholder.svg';
  }
}
