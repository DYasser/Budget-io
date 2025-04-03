import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import {
    Chart,
    DoughnutController, ArcElement,
    BarController, BarElement, CategoryScale, LinearScale,
    Tooltip, Legend
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { CalendarA11y, CalendarDateFormatter, DateAdapter, CalendarEventTitleFormatter } from 'angular-calendar'; 
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns'; 
import { CalendarUtils } from 'angular-calendar'; 
import { CommonModule, I18nPluralPipe } from '@angular/common';
import { environment } from '../environments/environment';


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
    importProvidersFrom(CommonModule),
    provideRouter(routes),
    provideAnimations(),

    provideFirebaseApp(() => initializeApp(environment.firebase)),

    provideFirestore(() => getFirestore()),

    { provide: DateAdapter, useFactory: adapterFactory },
    CalendarUtils,
    CalendarDateFormatter,
    CalendarA11y,
    CalendarEventTitleFormatter,
    I18nPluralPipe 

  ]
};