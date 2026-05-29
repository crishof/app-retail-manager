import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { PasswordRecoveryComponent } from './pages/password-recovery/password-recovery.component';
import { EmailVerificationComponent } from './pages/email-verification/email-verification.component';
import { LandingHomeComponent } from './pages/landing-home/landing-home.component';
import { noAuthGuard } from '../../core/auth/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: LandingHomeComponent,
        canActivate: [noAuthGuard]
      },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [noAuthGuard],
        data: { title: 'Sign In' }
      },
      {
        path: 'signup',
        component: SignupComponent,
        canActivate: [noAuthGuard],
        data: { title: 'Create Account' }
      },
      {
        path: 'password-recovery',
        component: PasswordRecoveryComponent,
        canActivate: [noAuthGuard],
        data: { title: 'Reset Password' }
      },
      {
        path: 'email-verification',
        component: EmailVerificationComponent,
        data: { title: 'Verify Email' }
      }
    ]
  }
];
