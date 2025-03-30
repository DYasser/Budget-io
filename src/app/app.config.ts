import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, CategoryScale, BarElement, BarController} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { LinearScale } from 'chart.js';

// Register the components with Chart.js
Chart.register(

  DoughnutController,
  BarController,

  ArcElement,
  BarElement,

  CategoryScale,
  LinearScale,

  Tooltip,
  Legend,
  ChartDataLabels
);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations()
  ]
};