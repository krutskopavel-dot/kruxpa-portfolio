// Astro's sharp service, plus one preset for UI screenshots: quality "max" on a WebP output is
// encoded near-lossless. Lossy WebP halves the colour resolution, which smears small coloured UI
// text (links, chips, status pills); near-lossless keeps it crisp at ~1.4× the file size.
import sharpService from 'astro/assets/services/sharp';
import type { LocalImageService } from 'astro';

const service: LocalImageService = {
  ...sharpService,
  async transform(inputBuffer, transform, config, logger) {
    if (transform.quality !== 'max' || (transform.format && transform.format !== 'webp')) {
      return sharpService.transform(inputBuffer, transform, config, logger);
    }
    const serviceConfig = { ...config.service.config, webp: { nearLossless: true, quality: 60 } };
    return sharpService.transform(
      inputBuffer,
      { ...transform, quality: undefined },
      { ...config, service: { ...config.service, config: serviceConfig } },
      logger,
    );
  },
};

export default service;
