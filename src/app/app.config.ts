// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

// --- Chart.js Registration ---
// Import Chart object and specific components needed
import { Chart, DoughnutController, ArcElement, Tooltip, Legend} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register the components with Chart.js
Chart.register(DoughnutController, ArcElement, Tooltip, Legend, ChartDataLabels);
// --- End Chart.js Registration ---

// Your existing app config definition
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations()
    // other providers...
  ]
};