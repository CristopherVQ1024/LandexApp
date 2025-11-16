import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth: Auth = inject(Auth);
  const router: Router = inject(Router);

  return user(auth).pipe(
    map(currentUser => {
      if (currentUser) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};