const alphanumCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function SlideData() {
  return {
    slides: null,
    compiledSlides: new Map(),
    selected: null,

    async fetchSlides() {
      const res = await fetch('/slides');
      this.slides = await res.json();
      this.slides.sort(alphanumCollator.compare);
    },
    async fetchSlide(slide) {
      if (!this.compiledSlides.has(slide)) {
        const res = await fetch(`/slides/${slide}`);
        this.compiledSlides.set(slide, await res.text());
      }
      return this.compiledSlides.get(slide);
    },
    async changeSlide(index) {
      if (this.slides === null) {
        return;
      }
      const slide = this.slides[index];
      if (slide === undefined) {
        return;
      }
      const html = await this.fetchSlide(slide);
      this.selected = {
        slide,
        index,
        html,
      };
      document.title = getSlideTitle(slide);
    },
    async previousSlide() {
      if (this.selectedIndex !== null) {
        await this.changeSlide(this.selectedIndex - 1);
      }
    },
    async nextSlide() {
      const index = this.selectedIndex !== null ? this.selectedIndex + 1 : 0;
      await this.changeSlide(index);
    },
    get slidesLength() {
      return Array.isArray(this.slides) ? this.slides.length : null;
    },
    get selectedIndex() {
      return this.selected !== null ? this.selected.index : null;
    },
  };
};

function getSlideTitle(slide) {
  return slide.split('__').join('. ').slice(0, -3);
}
