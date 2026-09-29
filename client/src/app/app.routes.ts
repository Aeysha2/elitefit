import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'EliteFit — Salle de sport ouverte 24 h/24',
    data: { description: 'EliteFit, votre salle de sport ouverte 24 h/24 et 7 j/7 : coachs diplômés, programmes sur mesure et séance d\'essai gratuite.' },
  },
  {
    path: 'formules',
    loadComponent: () => import('./pages/plans/plans').then((m) => m.Plans),
    title: 'Formules et tarifs — EliteFit',
    data: { description: 'Abonnements EliteFit en FCFA : mensuel, trimestriel, semestriel ou annuel à 150 000 FCFA.' },
  },
  {
    path: 'coachs',
    loadComponent: () => import('./pages/trainers/trainers').then((m) => m.Trainers),
    title: 'Nos coachs — EliteFit',
    data: { description: 'Rencontrez les coachs EliteFit : musculation, perte de poids, CrossFit, yoga.' },
  },
  {
    path: 'programmes',
    loadComponent: () => import('./pages/programs/programs').then((m) => m.Programs),
    title: 'Programmes d\'entraînement — EliteFit',
    data: { description: 'Perte de poids, prise de muscle, cardio, yoga, CrossFit et coaching personnalisé.' },
  },
  {
    path: 'galerie',
    loadComponent: () => import('./pages/gallery/gallery').then((m) => m.Gallery),
    title: 'Galerie — EliteFit',
    data: { description: 'Découvrez la salle EliteFit, ses équipements, ses séances et ses événements.' },
  },
  {
    path: 'essai-gratuit',
    loadComponent: () => import('./pages/booking/booking').then((m) => m.Booking),
    title: 'Réserver une séance d\'essai gratuite — EliteFit',
    data: { description: 'Réservez votre séance d\'essai gratuite chez EliteFit, à l\'heure qui vous convient, 24 h/24.' },
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact),
    title: 'Contact — EliteFit',
    data: { description: 'Une question ? Contactez l\'équipe EliteFit.' },
  },
  {
    path: 'connexion',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
    title: 'Connexion — EliteFit',
  },
  {
    path: 'inscription',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register/register').then((m) => m.Register),
    title: 'Créer un compte — EliteFit',
    data: { description: 'Créez votre compte EliteFit pour suivre vos réservations et votre abonnement.' },
  },
  {
    path: 'mon-compte',
    canActivate: [roleGuard()],
    loadComponent: () => import('./pages/account/account').then((m) => m.Account),
    title: 'Mon compte — EliteFit',
  },
  {
    path: 'coach',
    canActivate: [roleGuard('coach')],
    loadComponent: () => import('./pages/coach/coach').then((m) => m.Coach),
    title: 'Espace coach — EliteFit',
  },
  { path: 'admin/login', redirectTo: 'connexion' },
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./pages/admin/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Administration — EliteFit',
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Page introuvable — EliteFit',
  },
];
